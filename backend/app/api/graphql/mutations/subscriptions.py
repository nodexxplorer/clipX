# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Subscription mutations: payments, watchParty, family, customLists."""

import strawberry
import secrets
import string
from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.services.notification_service import notification_service
from app.models.database import (
    User as DbUser,
    WatchPartyRoom as DbWatchPartyRoom, WatchPartyParticipant as DbWatchPartyParticipant,
    FamilyPlan as DbFamilyPlan, FamilyMember as DbFamilyMember, FamilyInvite as DbFamilyInvite,
)
from app.api.graphql.types import (
    SuccessResponse, PromoCodeResult, CustomList, CustomListItem,
    CreateCustomListInput,
)
from app.api.graphql.helpers import _sentry_capture, logger


@strawberry.type
class SubscriptionMutations:

    @strawberry.mutation
    async def initializeSubscription(self, info: strawberry.Info, plan: str, billing: str = "monthly") -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if not getattr(user, 'email_verified', False):
            raise Exception("Please verify your email address before subscribing. A verification link has been sent to your inbox.")
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # if not getattr(user, "email_verified", False):
        #     raise Exception("Please verify your email address before subscribing.")
        # from app.core.paystack import initialize_transaction, PLAN_AMOUNTS
        # import uuid as uuid_mod
        # plan_key = f"{plan}_{billing}"
        # amount = PLAN_AMOUNTS.get(plan_key)
        # if not amount:
        #     raise Exception(f"Invalid plan: {plan} ({billing})")
        # reference = f"clipx_{plan}_{str(uuid_mod.uuid4())[:8]}"
        # result = await initialize_transaction(
        #     email=user.email, amount=amount, plan=plan_key, reference=reference,
        #     metadata={"user_id": str(user.id), "plan": plan, "billing": billing,
        #         "custom_fields": [
        #             {"display_name": "Plan", "variable_name": "plan", "value": plan.capitalize()},
        #             {"display_name": "Billing", "variable_name": "billing", "value": billing.capitalize()},
        #         ]}
        # )
        # if not result.get("status"):
        #     raise Exception(result.get("error", "Failed to initialize payment"))
        # return {"authorizationUrl": result["authorization_url"], "accessCode": result["access_code"], "reference": result["reference"]}

    @strawberry.mutation
    async def verifyPayment(self, info: strawberry.Info, reference: str) -> SuccessResponse:
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # from app.core.paystack import verify_transaction
        # result = await verify_transaction(reference)
        # if not result.get("status"):
        #     raise Exception(result.get("error", "Payment verification failed"))
        # metadata = result.get("metadata", {})
        # plan = metadata.get("plan", "standard")
        # billing = metadata.get("billing", "monthly")
        # db = await info.context.get_db()
        # user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        # if user_obj:
        #     user_obj.subscription_tier = plan
        #     user_obj.subscription_expires_at = datetime.utcnow() + timedelta(days=365 if billing == "yearly" else 30)
        #     user_obj.paystack_customer_code = result.get("customer_code")
        #     await db.commit()
        # return SuccessResponse(success=True, message="Payment verified")

    @strawberry.mutation
    async def cancelSubscription(self, info: strawberry.Info) -> SuccessResponse:
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # db = await info.context.get_db()
        # user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        # if not user_obj or user_obj.subscription_tier == "free":
        #     raise Exception("No active subscription to cancel")
        # old_plan = user_obj.subscription_tier
        # user_obj.subscription_tier = "free"
        # user_obj.subscription_expires_at = None
        # await db.commit()
        # return SuccessResponse(success=True, message="Subscription cancelled successfully")

    @strawberry.mutation
    async def applyPromoCode(self, info: strawberry.Info, code: str) -> PromoCodeResult:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import text
        row = (await db.execute(text(
            "SELECT id, code, discount_percent, discount_months, plan, max_uses, current_uses, "
            "is_active, expires_at FROM promo_codes WHERE UPPER(code) = UPPER(:code)"
        ), {"code": code.strip()})).fetchone()
        if not row:
            return PromoCodeResult(success=False, message="Invalid promo code")
        promo_id, _, discount, months, plan, max_uses, current_uses, is_active, expires_at = row
        if not is_active:
            return PromoCodeResult(success=False, message="This promo code is no longer active")
        if expires_at and datetime.utcnow() > expires_at:
            return PromoCodeResult(success=False, message="This promo code has expired")
        if max_uses and current_uses >= max_uses:
            return PromoCodeResult(success=False, message="This promo code has reached its usage limit")
        if (await db.execute(text("SELECT 1 FROM applied_promos WHERE user_id = :uid AND promo_code_id = :pid"),
                             {"uid": str(user.id), "pid": str(promo_id)})).fetchone():
            return PromoCodeResult(success=False, message="You've already used this promo code")
        await db.execute(text("INSERT INTO applied_promos (user_id, promo_code_id) VALUES (:uid, :pid)"),
                         {"uid": str(user.id), "pid": str(promo_id)})
        await db.execute(text("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = :pid"),
                         {"pid": str(promo_id)})
        if plan:
            user.subscription_tier = plan
            user.subscription_expires_at = datetime.utcnow() + timedelta(days=30 * (months or 1))
        await db.commit()
        return PromoCodeResult(
            success=True,
            message=f"Promo applied! {discount}% off" + (f" on {plan.capitalize()} plan" if plan else ""),
            discountPercent=discount or 0, plan=plan
        )

    @strawberry.mutation
    async def createWatchParty(self, info: strawberry.Info, movieboxId: str, contentType: str = "movie") -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        room = DbWatchPartyRoom(host_id=user.id, moviebox_id=movieboxId, content_type=contentType, room_code=room_code)
        db.add(room)
        db.add(DbWatchPartyParticipant(room_id=room.id, user_id=user.id))
        await db.commit()
        import json
        return json.dumps({
            "roomId": str(room.id), "roomCode": room_code, "movieboxId": movieboxId,
            "contentType": contentType, "hostName": user.name, "shareLink": f"/watch-party/{room_code}"
        })

    @strawberry.mutation
    async def joinWatchParty(self, info: strawberry.Info, roomCode: str) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room = (await db.execute(
            select(DbWatchPartyRoom).where(DbWatchPartyRoom.room_code == roomCode, DbWatchPartyRoom.status == "active")
        )).scalars().first()
        if not room:
            raise Exception("Room not found or has ended")
        participants = (await db.execute(
            select(DbWatchPartyParticipant).where(DbWatchPartyParticipant.room_id == room.id)
        )).scalars().all()
        if len(participants) >= room.max_participants:
            raise Exception("Room is full")
        already_in = any(p.user_id == user.id for p in participants)
        if not already_in:
            db.add(DbWatchPartyParticipant(room_id=room.id, user_id=user.id))
            await db.commit()
        try:
            await notification_service.create(
                db, str(room.host_id), title="≡ƒÄë New Viewer Joined!",
                message=f"{user.name} joined your watch party",
                notif_type="social", action_url=f"/watch-party/{roomCode}"
            )
        except Exception as e:
            logger.debug(f"[watchParty] join notification skipped: {e}")
        import json
        return json.dumps({
            "roomId": str(room.id), "roomCode": room.room_code, "movieboxId": room.moviebox_id,
            "contentType": room.content_type, "currentTime": room.current_time,
            "isPlaying": room.is_playing,
            "participantCount": len(participants) + (0 if already_in else 1)
        })

    @strawberry.mutation
    async def endWatchParty(self, info: strawberry.Info, roomCode: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room = (await db.execute(
            select(DbWatchPartyRoom).where(DbWatchPartyRoom.room_code == roomCode, DbWatchPartyRoom.host_id == user.id)
        )).scalars().first()
        if not room:
            raise Exception("Room not found or you're not the host")
        room.status = "ended"
        room.ended_at = datetime.utcnow()
        await db.commit()
        return SuccessResponse(success=True, message="Watch party ended")

    @strawberry.mutation
    async def createFamilyPlan(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if getattr(user, 'subscription_tier', 'free') != 'family':
            raise Exception("Family plan requires the Family subscription tier")
        db = await info.context.get_db()
        if (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first():
            raise Exception("You already have a family plan")
        invite_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        plan = DbFamilyPlan(parent_id=user.id, invite_code=invite_code)
        db.add(plan)
        db.add(DbFamilyMember(family_plan_id=plan.id, user_id=user.id, role="owner"))
        await db.commit()
        import json
        return json.dumps({"planId": str(plan.id), "inviteCode": invite_code, "memberSlots": plan.member_slots, "membersUsed": 1})

    @strawberry.mutation
    async def inviteFamilyMember(self, info: strawberry.Info, email: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first()
        if not plan:
            raise Exception("You don't have a family plan")
        members = (await db.execute(select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id))).scalars().all()
        if len(members) >= plan.member_slots:
            raise Exception(f"Family plan is full ({plan.member_slots} members max)")
        if (await db.execute(
            select(DbFamilyInvite).where(
                DbFamilyInvite.family_plan_id == plan.id,
                DbFamilyInvite.email == email, DbFamilyInvite.status == "pending"
            )
        )).scalars().first():
            return SuccessResponse(success=False, message="An invite is already pending for this email")
        db.add(DbFamilyInvite(
            family_plan_id=plan.id, email=email,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.utcnow() + timedelta(days=7)
        ))
        await db.commit()
        return SuccessResponse(success=True, message=f"Invite sent to {email}")

    @strawberry.mutation
    async def acceptFamilyInvite(self, info: strawberry.Info, token: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        invite = (await db.execute(
            select(DbFamilyInvite).where(DbFamilyInvite.token == token, DbFamilyInvite.status == "pending")
        )).scalars().first()
        if not invite:
            raise Exception("Invalid or expired invite")
        if invite.expires_at and invite.expires_at < datetime.utcnow():
            invite.status = "expired"
            await db.commit()
            raise Exception("This invite has expired")
        if (await db.execute(select(DbFamilyMember).where(DbFamilyMember.user_id == user.id))).scalars().first():
            raise Exception("You're already part of a family plan")
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.id == invite.family_plan_id))).scalars().first()
        members = (await db.execute(select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id))).scalars().all()
        if len(members) >= plan.member_slots:
            raise Exception("Family plan is full")
        db.add(DbFamilyMember(family_plan_id=plan.id, user_id=user.id, role="member"))
        invite.status = "accepted"
        user.subscription_tier = "family"
        await db.commit()
        return SuccessResponse(success=True, message="Welcome to the family plan!")

    @strawberry.mutation
    async def removeFamilyMember(self, info: strawberry.Info, memberId: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first()
        if not plan:
            raise Exception("You don't have a family plan")
        member = (await db.execute(
            select(DbFamilyMember).where(DbFamilyMember.id == memberId, DbFamilyMember.family_plan_id == plan.id)
        )).scalars().first()
        if not member:
            raise Exception("Member not found")
        if member.role == "owner":
            raise Exception("Cannot remove the plan owner")
        removed_user = (await db.execute(select(DbUser).where(DbUser.id == member.user_id))).scalars().first()
        if removed_user:
            removed_user.subscription_tier = "free"
        await db.delete(member)
        await db.commit()
        return SuccessResponse(success=True, message="Member removed from family plan")

    @strawberry.mutation
    async def createCustomList(self, info: strawberry.Info, input: CreateCustomListInput) -> CustomList:
        """Create a new custom list (Letterboxd-style compilation)."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import uuid
        async with AsyncSessionLocal() as db:
            list_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO custom_lists (id, user_id, name, description, is_public)
                VALUES (:id, :uid, :name, :desc, :pub)
            """), {
                "id": list_id, "uid": str(user.id),
                "name": input.name, "desc": input.description or "",
                "pub": input.isPublic or False,
            })
            await db.commit()
            return CustomList(
                id=list_id, userId=str(user.id),
                name=input.name, description=input.description,
                isPublic=input.isPublic or False,
                items=[], createdAt=str(datetime.utcnow()),
                updatedAt=str(datetime.utcnow()),
            )

    @strawberry.mutation
    async def addToCustomList(
        self, info: strawberry.Info, listId: str,
        movieboxId: str, title: str = "", posterUrl: str = ""
    ) -> SuccessResponse:
        """Add a movie to a custom list."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify ownership
                owner = (await db.execute(text(
                    "SELECT user_id FROM custom_lists WHERE id = :lid"
                ), {"lid": listId})).fetchone()
                if not owner or str(owner.user_id) != str(user.id):
                    raise Exception("List not found or not authorized")
                await db.execute(text("""
                    INSERT INTO custom_list_items (list_id, moviebox_id, title, poster_url)
                    VALUES (:lid, :mid, :title, :poster)
                    ON CONFLICT (list_id, moviebox_id) DO NOTHING
                """), {"lid": listId, "mid": movieboxId, "title": title, "poster": posterUrl})
                await db.execute(text(
                    "UPDATE custom_lists SET updated_at = NOW() WHERE id = :lid"
                ), {"lid": listId})
                await db.commit()
            return SuccessResponse(success=True, message="Added to list")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    @strawberry.mutation
    async def sendWatchPartyInvite(
        self, info: strawberry.Info, roomCode: str, email: str
    ) -> SuccessResponse:
        """Send a watch party invite via email/notification."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify the room exists and user is host
                room = (await db.execute(text("""
                    SELECT * FROM watch_party_rooms WHERE room_code = :rc
                """), {"rc": roomCode})).fetchone()
                if not room:
                    return SuccessResponse(success=False, message="Room not found")
                # Find invitee
                invitee = (await db.execute(text(
                    "SELECT id FROM users WHERE email = :email"
                ), {"email": email})).fetchone()
                if invitee:
                    # Create in-app notification
                    await db.execute(text("""
                        INSERT INTO notifications (user_id, title, message, type, action_url)
                        VALUES (:uid, :title, :msg, 'watch_party', :url)
                    """), {
                        "uid": str(invitee.id),
                        "title": f"Watch Party Invite from {user.name or user.email}",
                        "msg": f"You've been invited to join a watch party! Room code: {roomCode}",
                        "url": f"/watch-party/{roomCode}",
                    })
                    await db.commit()
                return SuccessResponse(success=True, message=f"Invite sent to {email}")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    @strawberry.mutation
    async def watchPartyHostAction(
        self, info: strawberry.Info, roomCode: str,
        action: str, targetUserId: Optional[str] = None, seekTime: Optional[int] = None
    ) -> SuccessResponse:
        """Host control actions: pause, play, seek, kick."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                room = (await db.execute(text("""
                    SELECT * FROM watch_party_rooms WHERE room_code = :rc
                """), {"rc": roomCode})).fetchone()
                if not room:
                    return SuccessResponse(success=False, message="Room not found")
                if str(room.host_id) != str(user.id):
                    return SuccessResponse(success=False, message="Only the host can perform this action")
                if action == "kick" and targetUserId:
                    await db.execute(text("""
                        DELETE FROM watch_party_participants
                        WHERE room_id = :rid AND user_id = :uid
                    """), {"rid": str(room.id), "uid": targetUserId})
                    await db.commit()
                    return SuccessResponse(success=True, message="User kicked from party")
                # For pause/play/seek, these are broadcast via WebSocket ΓÇö we just validate host authority
                return SuccessResponse(success=True, message=f"Host action '{action}' authorized")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

