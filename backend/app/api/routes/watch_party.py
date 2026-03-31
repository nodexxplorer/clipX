"""
WebSocket-based Watch Party for clipX.

Protocol (JSON over WS):
  Client -> Server: { "type": "play" | "pause" | "seek", "currentTime": 123 }
  Client -> Server: { "type": "chat", "content": "hello!" }
  Server -> Client: { "type": "sync", "isPlaying": true, "currentTime": 123 }
  Server -> Client: { "type": "chat", "userId": "...", "userName": "...", "content": "...", "createdAt": "..." }
  Server -> Client: { "type": "user_joined" | "user_left", "userName": "...", "participantCount": N }
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import uuid
from datetime import datetime

router = APIRouter()


class WatchPartyManager:
    def __init__(self):
        # room_code -> { "connections": [(ws, user_info)], "state": {...} }
        self._rooms: Dict[str, dict] = {}

    def _ensure_room(self, room_code: str):
        if room_code not in self._rooms:
            self._rooms[room_code] = {
                "connections": [],
                "state": {
                    "isPlaying": False,
                    "currentTime": 0,
                    "lastUpdate": datetime.utcnow().isoformat(),
                }
            }

    async def connect(self, websocket: WebSocket, room_code: str, user_info: dict):
        await websocket.accept()
        self._ensure_room(room_code)
        self._rooms[room_code]["connections"].append((websocket, user_info))

        # Send current state to the new joiner
        await websocket.send_json({
            "type": "sync",
            **self._rooms[room_code]["state"],
        })

        # Broadcast user joined
        count = len(self._rooms[room_code]["connections"])
        await self._broadcast(room_code, {
            "type": "user_joined",
            "userId": user_info.get("id"),
            "userName": user_info.get("name", "Someone"),
            "userAvatar": user_info.get("avatar"),
            "participantCount": count,
            "createdAt": datetime.utcnow().isoformat(),
        }, exclude=websocket)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self._rooms:
            self._rooms[room_code]["connections"] = [
                (ws, ui) for ws, ui in self._rooms[room_code]["connections"] if ws != websocket
            ]
            if not self._rooms[room_code]["connections"]:
                del self._rooms[room_code]

    async def broadcast_leave(self, room_code: str, user_info: dict):
        count = len(self._rooms.get(room_code, {}).get("connections", []))
        await self._broadcast(room_code, {
            "type": "user_left",
            "userId": user_info.get("id"),
            "userName": user_info.get("name", "Someone"),
            "participantCount": count,
            "createdAt": datetime.utcnow().isoformat(),
        })

    async def handle_playback_event(self, room_code: str, event_type: str, current_time: float, user_info: dict):
        """Handle play/pause/seek events and sync all participants."""
        if room_code not in self._rooms:
            return

        state = self._rooms[room_code]["state"]
        if event_type == "play":
            state["isPlaying"] = True
            state["currentTime"] = current_time
        elif event_type == "pause":
            state["isPlaying"] = False
            state["currentTime"] = current_time
        elif event_type == "seek":
            state["currentTime"] = current_time
        state["lastUpdate"] = datetime.utcnow().isoformat()

        # Broadcast sync to all participants
        await self._broadcast(room_code, {
            "type": "sync",
            "isPlaying": state["isPlaying"],
            "currentTime": state["currentTime"],
            "triggeredBy": user_info.get("name", "Someone"),
            "event": event_type,
        })

        # Also update DB state
        try:
            from app.core.database import async_session
            from app.models.database import WatchPartyRoom
            from sqlalchemy.future import select
            async with async_session() as db:
                result = await db.execute(
                    select(WatchPartyRoom).where(WatchPartyRoom.room_code == room_code)
                )
                room = result.scalars().first()
                if room:
                    room.current_time = int(current_time)
                    room.is_playing = state["isPlaying"]
                    await db.commit()
        except Exception as e:
            print(f"WatchParty DB sync error: {e}")

    async def broadcast_chat(self, room_code: str, user_info: dict, content: str):
        await self._broadcast(room_code, {
            "type": "chat",
            "id": str(uuid.uuid4()),
            "userId": user_info.get("id"),
            "userName": user_info.get("name", "User"),
            "userAvatar": user_info.get("avatar"),
            "content": content[:500],
            "createdAt": datetime.utcnow().isoformat(),
        })

    async def _broadcast(self, room_code: str, data: dict, exclude: WebSocket = None):
        if room_code not in self._rooms:
            return
        dead = []
        for ws, ui in self._rooms[room_code]["connections"]:
            if ws == exclude:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        if dead:
            self._rooms[room_code]["connections"] = [
                (ws, ui) for ws, ui in self._rooms[room_code]["connections"] if ws not in dead
            ]

    def get_participant_count(self, room_code: str) -> int:
        return len(self._rooms.get(room_code, {}).get("connections", []))

    def get_participants(self, room_code: str) -> list:
        if room_code not in self._rooms:
            return []
        seen = set()
        users = []
        for _, ui in self._rooms[room_code]["connections"]:
            uid = ui.get("id")
            if uid and uid not in seen:
                seen.add(uid)
                users.append({"id": uid, "name": ui.get("name"), "avatar": ui.get("avatar")})
        return users


wp_manager = WatchPartyManager()


@router.websocket("/ws/watch-party/{room_code}")
async def websocket_watch_party(websocket: WebSocket, room_code: str):
    """
    WebSocket endpoint for watch party synchronization.

    Query params:
      - token: JWT auth token (required)
    """
    token = websocket.query_params.get("token")
    user_info = {"id": str(uuid.uuid4()), "name": "Guest", "avatar": None, "authenticated": False}

    # Authenticate
    if token:
        try:
            from app.core.auth import decode_access_token
            from app.core.database import async_session
            from app.models.database import User as DbUser
            from sqlalchemy.future import select

            payload = decode_access_token(token)
            if payload and "sub" in payload:
                async with async_session() as db:
                    result = await db.execute(select(DbUser).where(DbUser.email == payload["sub"]))
                    db_user = result.scalars().first()
                    if db_user:
                        user_info = {
                            "id": str(db_user.id),
                            "name": db_user.name or db_user.email.split("@")[0],
                            "avatar": db_user.avatar,
                            "authenticated": True,
                        }
        except Exception as e:
            print(f"WatchParty auth fallback: {type(e).__name__}")

    # Verify room exists and is active
    try:
        from app.core.database import async_session
        from app.models.database import WatchPartyRoom
        from sqlalchemy.future import select
        async with async_session() as db:
            result = await db.execute(
                select(WatchPartyRoom).where(
                    WatchPartyRoom.room_code == room_code,
                    WatchPartyRoom.status == "active"
                )
            )
            room = result.scalars().first()
            if not room:
                await websocket.close(code=4004, reason="Room not found or has ended")
                return
    except Exception as e:
        print(f"WatchParty room check error: {e}")

    await wp_manager.connect(websocket, room_code, user_info)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "")

            if msg_type in ("play", "pause", "seek"):
                current_time = data.get("currentTime", 0)
                await wp_manager.handle_playback_event(room_code, msg_type, current_time, user_info)

            elif msg_type == "chat":
                content = data.get("content", "").strip()
                if content:
                    await wp_manager.broadcast_chat(room_code, user_info, content)

            elif msg_type == "request_sync":
                # Client requesting current state
                if room_code in wp_manager._rooms:
                    state = wp_manager._rooms[room_code]["state"]
                    await websocket.send_json({"type": "sync", **state})

    except WebSocketDisconnect:
        wp_manager.disconnect(websocket, room_code)
        await wp_manager.broadcast_leave(room_code, user_info)
    except Exception as e:
        print(f"WatchParty WS error: {e}")
        wp_manager.disconnect(websocket, room_code)
