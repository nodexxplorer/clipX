"""
WebSocket-based real-time chat for clipX.

Rooms:
  - 'global' — site-wide chat
  - 'movie:<id>' — per-movie discussion

Protocol (JSON over WS):
  Client -> Server: { "type": "message", "content": "...", "room": "global" }
  Server -> Client: { "type": "message", "id": "...", "userId": "...", "userName": "...", "userAvatar": "...", "content": "...", "room": "...", "createdAt": "..." }
  Server -> Client: { "type": "system", "content": "User joined", "room": "..." }
  Server -> Client: { "type": "online_count", "count": N, "room": "..." }
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import uuid
from datetime import datetime

router = APIRouter()

# In-memory connection manager
class ConnectionManager:
    def __init__(self):
        # room -> set of (websocket, user_info_dict)
        self._rooms: Dict[str, List[tuple]] = {}

    async def connect(self, websocket: WebSocket, room: str, user_info: dict):
        await websocket.accept()
        if room not in self._rooms:
            self._rooms[room] = []
        self._rooms[room].append((websocket, user_info))
        # Broadcast online count
        await self._broadcast_online_count(room)
        # Broadcast join
        await self._broadcast(room, {
            "type": "system",
            "content": f"{user_info.get('name', 'Someone')} joined the chat",
            "room": room,
            "createdAt": str(datetime.utcnow()),
        }, exclude=websocket)

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self._rooms:
            self._rooms[room] = [(ws, ui) for ws, ui in self._rooms[room] if ws != websocket]
            if not self._rooms[room]:
                del self._rooms[room]

    async def broadcast_leave(self, room: str, user_info: dict):
        await self._broadcast(room, {
            "type": "system",
            "content": f"{user_info.get('name', 'Someone')} left the chat",
            "room": room,
            "createdAt": str(datetime.utcnow()),
        })
        await self._broadcast_online_count(room)

    async def broadcast_message(self, room: str, message: dict):
        await self._broadcast(room, message)

    async def _broadcast(self, room: str, data: dict, exclude: WebSocket = None):
        if room not in self._rooms:
            return
        dead = []
        for ws, ui in self._rooms[room]:
            if ws == exclude:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        # Cleanup dead connections
        if dead:
            self._rooms[room] = [(ws, ui) for ws, ui in self._rooms[room] if ws not in dead]

    async def _broadcast_online_count(self, room: str):
        count = len(self._rooms.get(room, []))
        await self._broadcast(room, {
            "type": "online_count",
            "count": count,
            "room": room,
        })

    def get_online_count(self, room: str) -> int:
        return len(self._rooms.get(room, []))

    def get_online_users(self, room: str) -> list:
        if room not in self._rooms:
            return []
        seen = set()
        users = []
        for _, ui in self._rooms[room]:
            uid = ui.get("id")
            if uid and uid not in seen:
                seen.add(uid)
                users.append(ui)
        return users


manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket chat endpoint.
    
    Query params:
      - room: chat room name (default: 'global')
      - token: JWT auth token
      - name: display name (fallback)
    """
    room = websocket.query_params.get("room", "global")
    token = websocket.query_params.get("token")
    name = websocket.query_params.get("name", "Anonymous")
    avatar = websocket.query_params.get("avatar")

    # Try to authenticate via JWT
    user_info = {"id": str(uuid.uuid4()), "name": name, "avatar": avatar}
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
                        }
        except Exception as e:
            print(f"Chat auth fallback: {e}")

    await manager.connect(websocket, room, user_info)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "message")
            content = data.get("content", "").strip()

            if msg_type == "message" and content:
                # Persist to DB
                msg_id = str(uuid.uuid4())
                now = str(datetime.utcnow())

                try:
                    from app.core.database import async_session
                    from app.models.database import ChatMessage as DbChatMessage
                    async with async_session() as db:
                        db_msg = DbChatMessage(
                            user_id=user_info["id"],
                            room=room,
                            content=content[:2000],
                        )
                        db.add(db_msg)
                        await db.commit()
                        await db.refresh(db_msg)
                        msg_id = str(db_msg.id)
                        now = str(db_msg.created_at)
                except Exception as e:
                    print(f"Chat persist error: {e}")

                broadcast_data = {
                    "type": "message",
                    "id": msg_id,
                    "userId": user_info["id"],
                    "userName": user_info.get("name", "User"),
                    "userAvatar": user_info.get("avatar"),
                    "content": content[:2000],
                    "room": room,
                    "createdAt": now,
                }
                # Broadcast to everyone in the room (including sender)
                await manager.broadcast_message(room, broadcast_data)

            elif msg_type == "typing":
                # Broadcast typing indicator
                await manager._broadcast(room, {
                    "type": "typing",
                    "userId": user_info["id"],
                    "userName": user_info.get("name", "User"),
                    "room": room,
                }, exclude=websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room)
        await manager.broadcast_leave(room, user_info)
    except Exception as e:
        print(f"Chat WS error: {e}")
        manager.disconnect(websocket, room)
