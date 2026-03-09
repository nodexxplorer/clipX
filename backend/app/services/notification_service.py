from app.models.database import Notification as DbNotification
from typing import Optional, Any
from datetime import datetime


class NotificationService:
    """Creates notifications for various user activities."""

    TYPES = {
        "watchlist": {"icon": "bookmark", "color": "blue"},
        "watch": {"icon": "play", "color": "green"},
        "milestone": {"icon": "award", "color": "yellow"},
        "content": {"icon": "film", "color": "purple"},
        "review": {"icon": "star", "color": "orange"},
        "report": {"icon": "flag", "color": "red"},
        "system": {"icon": "bell", "color": "gray"},
        "social": {"icon": "users", "color": "cyan"},
    }

    async def create(
        self,
        db: Any,
        user_id: str,
        title: str,
        message: str,
        notif_type: str = "system",
        action_url: Optional[str] = None,
        metadata: Optional[dict] = None,
    ):
        """Create a notification in the database."""
        n = DbNotification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            action_url=action_url,
            extra_data=metadata or {},
        )
        db.add(n)
        try:
            await db.commit()
        except Exception as e:
            print(f"[Notification] Error creating: {e}")
            await db.rollback()

    async def notify_watchlist_add(self, db: Any, user_id: str, movie_title: str, movie_id: str = None):
        await self.create(
            db, user_id,
            title="Added to Watchlist",
            message=f'"{movie_title}" has been added to your watchlist.',
            notif_type="watchlist",
            action_url=f"/movies/{movie_id}" if movie_id else None,
            metadata={"movie_id": movie_id, "movie_title": movie_title},
        )

    async def notify_watchlist_remove(self, db: Any, user_id: str, movie_title: str):
        await self.create(
            db, user_id,
            title="Removed from Watchlist",
            message=f'"{movie_title}" has been removed from your watchlist.',
            notif_type="watchlist",
        )

    async def notify_watch_start(self, db: Any, user_id: str, movie_title: str, movie_id: str = None):
        await self.create(
            db, user_id,
            title="Now Watching",
            message=f'You started watching "{movie_title}". Enjoy!',
            notif_type="watch",
            action_url=f"/watch/{movie_id}" if movie_id else None,
            metadata={"movie_id": movie_id, "movie_title": movie_title},
        )

    async def notify_watch_milestone(self, db: Any, user_id: str, count: int):
        milestones = {5: "Movie Explorer", 10: "Film Buff", 25: "Cinema Lover", 50: "Movie Master", 100: "Legendary Viewer"}
        badge = milestones.get(count, f"{count} Movies")
        await self.create(
            db, user_id,
            title=f"🎬 Milestone: {badge}!",
            message=f"You've watched {count} movies on clipX. Keep going!",
            notif_type="milestone",
            action_url="/dashboard",
            metadata={"count": count, "badge": badge},
        )

    async def notify_review_posted(self, db: Any, user_id: str, movie_title: str = None):
        await self.create(
            db, user_id,
            title="Review Published",
            message=f'Your review{" for " + chr(34) + movie_title + chr(34) if movie_title else ""} has been published. Thanks for sharing!',
            notif_type="review",
        )

    async def notify_report_status(self, db: Any, user_id: str, status: str):
        status_messages = {
            "reviewed": "Your report is being reviewed by our team.",
            "resolved": "Your report has been resolved. Thank you for helping improve clipX!",
        }
        await self.create(
            db, user_id,
            title=f"Report {status.title()}",
            message=status_messages.get(status, f"Your report status has been updated to: {status}"),
            notif_type="report",
            action_url="/report",
        )

    async def notify_profile_update(self, db: Any, user_id: str):
        await self.create(
            db, user_id,
            title="Profile Updated",
            message="Your profile has been updated successfully.",
            notif_type="system",
            action_url="/profile",
        )

    async def notify_welcome(self, db: Any, user_id: str, name: str = None):
        await self.create(
            db, user_id,
            title="Welcome to clipX! 🎬",
            message=f"Hey{' ' + name if name else ''}! Welcome aboard. Start exploring trending movies and build your watchlist.",
            notif_type="system",
            action_url="/",
        )


notification_service = NotificationService()
