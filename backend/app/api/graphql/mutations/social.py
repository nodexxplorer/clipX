# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Social mutations: reviews, reports, notifications, chat, subtitles."""

import strawberry
from typing import List, Optional
from datetime import datetime

from sqlalchemy.future import select

from app.services.notification_service import notification_service
from app.models.database import (
    User as DbUser, Report as DbReport, Review as DbReview,
    Notification as DbNotification, ReviewLike as DbReviewLike,
    ReviewReport as DbReviewReport, Subtitle as DbSubtitle,
)
from app.api.graphql.types import (
    SuccessResponse, Review, Report, ChatMessageType, SubtitleType,
)
from app.api.graphql.helpers import _sentry_capture, logger


@strawberry.type
class SocialMutations:

    @strawberry.mutation
    async def addReview(self, info: strawberry.Info, content: str, rating: float, isFeatured: Optional[bool] = False, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        db.add(DbReview(user_id=user.id, content=content, rating=rating, is_featured=isFeatured))
        await db.commit()
        try:
            await notification_service.notify_review_posted(db, str(user.id))
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"Notification error (review): {e}")
        return SuccessResponse(success=True, message="Review added successfully")

    @strawberry.mutation
    async def submitReview(self, info: strawberry.Info, content: str, rating: float) -> Review:
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to submit a review")
        if not content.strip() or len(content.strip()) < 10:
            raise ValueError("Review must be at least 10 characters")
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        db = await info.context.get_db()
        review = DbReview(user_id=user.id, content=content.strip()[:500], rating=rating, is_featured=False)
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return Review(id=str(review.id), content=review.content, rating=review.rating,
                      userName=user.name or "User", userAvatar=user.avatar,
                      isFeatured=False, createdAt=str(review.created_at))

    @strawberry.mutation
    async def submitMovieReview(self, info: strawberry.Info, movieId: str, content: str, rating: float) -> Review:
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to review")
        if not content.strip() or len(content.strip()) < 10:
            raise ValueError("Review must be at least 10 characters")
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        db = await info.context.get_db()
        from sqlalchemy import and_
        old_review = (await db.execute(
            select(DbReview).where(and_(DbReview.user_id == user.id, DbReview.moviebox_id == movieId))
        )).scalars().first()
        if old_review:
            old_review.content = content.strip()[:500]
            old_review.rating = rating
            await db.commit()
            return Review(id=str(old_review.id), content=old_review.content, rating=old_review.rating,
                          userName=user.name or "User", userAvatar=user.avatar,
                          isFeatured=False, createdAt=str(old_review.created_at))
        review = DbReview(user_id=user.id, moviebox_id=movieId, content=content.strip()[:500], rating=rating, is_featured=False)
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return Review(id=str(review.id), content=review.content, rating=review.rating,
                      userName=user.name or "User", userAvatar=user.avatar,
                      isFeatured=False, createdAt=str(review.created_at))

    @strawberry.mutation
    async def likeReview(self, info: strawberry.Info, reviewId: str, likeType: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if likeType not in ('like', 'dislike'):
            raise Exception("likeType must be 'like' or 'dislike'")
        db = await info.context.get_db()
        existing_like = (await db.execute(
            select(DbReviewLike).where(DbReviewLike.user_id == user.id, DbReviewLike.review_id == reviewId)
        )).scalars().first()
        if existing_like:
            if existing_like.like_type == likeType:
                await db.delete(existing_like)
                await db.commit()
                return SuccessResponse(success=True, message=f"{likeType.capitalize()} removed")
            existing_like.like_type = likeType
            await db.commit()
            return SuccessResponse(success=True, message=f"Changed to {likeType}")
        db.add(DbReviewLike(user_id=user.id, review_id=reviewId, like_type=likeType))
        await db.commit()
        return SuccessResponse(success=True, message=f"Review {likeType}d")

    @strawberry.mutation
    async def reportReview(self, info: strawberry.Info, reviewId: str, reason: str, description: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if reason not in ('spam', 'harassment', 'spoiler', 'inappropriate', 'other'):
            raise Exception("Invalid reason")
        db = await info.context.get_db()
        if (await db.execute(
            select(DbReviewReport).where(DbReviewReport.user_id == user.id, DbReviewReport.review_id == reviewId)
        )).scalars().first():
            return SuccessResponse(success=False, message="You've already reported this review")
        db.add(DbReviewReport(user_id=user.id, review_id=reviewId, reason=reason, description=(description or "")[:500]))
        await db.commit()
        try:
            for admin in (await db.execute(select(DbUser).where(DbUser.role == "admin"))).scalars().all():
                await notification_service.create(
                    db, str(admin.id), title="ΓÜá∩╕Å Review Reported",
                    message=f"A review was reported for: {reason}",
                    notif_type="report", action_url=f"/admin/reviews?report={reviewId}"
                )
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"Notification error (report): {e}")
        return SuccessResponse(success=True, message="Review reported. We'll review it shortly.")

    @strawberry.mutation
    async def submitReport(self, info: strawberry.Info, reason: str, description: str, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise ValueError("You must be logged in to submit a report")
        db = await info.context.get_db()
        db.add(DbReport(user_id=user.id, reason=reason, description=description, moviebox_id=movieboxId))
        db.add(DbNotification(
            user_id=user.id, title="Report Submitted",
            message="Thank you for your report. Our team will review it shortly."
        ))
        await db.commit()
        return SuccessResponse(success=True, message="Report submitted successfully")

    @strawberry.mutation
    async def updateReportStatus(self, info: strawberry.Info, id: strawberry.ID, status: str) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        report = (await db.execute(select(DbReport).where(DbReport.id == id))).scalars().first()
        if report:
            report.status = status
            await db.commit()
            if report.user_id:
                try:
                    await notification_service.notify_report_status(db, str(report.user_id), status)
                except Exception as e:
                    _sentry_capture(e)
                    logger.warning(f"Notification error (report): {e}")
            return SuccessResponse(success=True, message="Status updated")
        return SuccessResponse(success=False, message="Report not found")

    @strawberry.mutation
    async def markNotificationRead(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        n = (await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))).scalars().first()
        if n:
            n.is_read = True
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def markAllNotificationsRead(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        from sqlalchemy import update
        await db.execute(
            update(DbNotification).where(
                DbNotification.user_id == user.id, DbNotification.is_read == False
            ).values(is_read=True)
        )
        await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def deleteNotification(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        n = (await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))).scalars().first()
        if n:
            await db.delete(n)
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def sendChatMessage(self, info: strawberry.Info, content: str, room: Optional[str] = "global") -> ChatMessageType:
        from app.models.database import ChatMessage as DbChatMessage
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to send messages")
        db = await info.context.get_db()
        msg = DbChatMessage(user_id=user.id, room=room or "global", content=content[:2000])
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return ChatMessageType(
            id=str(msg.id), userId=str(user.id), userName=user.name or "User",
            userAvatar=user.avatar, room=msg.room, content=msg.content, createdAt=str(msg.created_at)
        )

    @strawberry.mutation
    async def uploadSubtitle(
        self, info: strawberry.Info,
        movieboxId: str, fileUrl: str,
        language: str = "en", label: str = "English",
        format: str = "vtt", contentType: str = "movie",
        season: Optional[int] = None, episode: Optional[int] = None,
    ) -> SubtitleType:
        """Upload/register a subtitle file (.srt or .vtt) for content."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if format not in ("srt", "vtt"):
            raise Exception("Format must be 'srt' or 'vtt'")
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            sub = DbSubtitle(
                moviebox_id=movieboxId,
                content_type=contentType,
                language=language[:10],
                label=label[:100],
                format=format,
                file_url=fileUrl[:500],
                season=season,
                episode=episode,
                uploaded_by=user.id,
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)
            return SubtitleType(
                id=strawberry.ID(str(sub.id)),
                movieboxId=sub.moviebox_id,
                contentType=sub.content_type or "movie",
                language=sub.language or "en",
                label=sub.label or "English",
                format=sub.format or "vtt",
                fileUrl=sub.file_url or "",
                season=sub.season,
                episode=sub.episode,
                createdAt=str(sub.created_at) if sub.created_at else None,
            )

