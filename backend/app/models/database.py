from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Table, Date, Index
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSON
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255))
    name = Column(String(255))
    avatar = Column(String(500))
    role = Column(String(50), default="user")
    bio = Column(Text)
    preferences = Column(JSON, default=dict)
    email_verified = Column(Boolean, default=False)
    last_active = Column(DateTime, default=datetime.utcnow)
    subscription_tier = Column(String(20), default="free")
    subscription_expires_at = Column(DateTime, nullable=True)
    paystack_customer_code = Column(String(255), nullable=True)
    referral_count = Column(Integer, default=0)
    grace_period_end = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    watchlist = relationship("Watchlist", back_populates="user", lazy="dynamic")
    history = relationship("History", back_populates="user", lazy="dynamic")
    recently_viewed = relationship("RecentlyViewed", back_populates="user", order_by="desc(RecentlyViewed.viewed_at)", lazy="dynamic")
    notifications = relationship("Notification", back_populates="user", order_by="desc(Notification.created_at)", lazy="dynamic")
    reports = relationship("Report", back_populates="user", order_by="desc(Report.created_at)", lazy="dynamic")
    reviews = relationship("Review", back_populates="user", order_by="desc(Review.created_at)", lazy="dynamic")
    chat_messages = relationship("ChatMessage", back_populates="user", order_by="desc(ChatMessage.created_at)", lazy="dynamic")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moviebox_id = Column(String(255), unique=True, index=True) # New field to map to Moviebox API
    detail_path = Column(String(500)) # Stores the slug needed for detail page
    subject_type = Column(Integer, default=1) # 1 for movie, 2 for series
    title = Column(String(255), nullable=False)
    description = Column(Text)
    year = Column(Integer)
    rating = Column(Float)
    poster_url = Column(String(500))
    backdrop_url = Column(String(500))
    trailer_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Series(Base):
    __tablename__ = "series"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moviebox_id = Column(String(255), unique=True, index=True) # New field to map to Moviebox API
    detail_path = Column(String(500))
    subject_type = Column(Integer, default=2)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    rating = Column(Float)
    poster_url = Column(String(500))
    backdrop_url = Column(String(500))
    number_of_seasons = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        Index("ix_watchlist_user_movie", "user_id", "moviebox_id"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False) # Store the Moviebox ID directly for easy lookup
    content_type = Column(String(50), default="movie") # 'movie' or 'series'
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="watchlist")

class History(Base):
    __tablename__ = "history"
    __table_args__ = (
        Index("ix_history_user_movie", "user_id", "moviebox_id"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False)
    content_type = Column(String(50), default="movie")
    current_time = Column(Integer, default=0) # Seconds
    duration = Column(Integer, default=0) # Seconds
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="history")

class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"
    __table_args__ = (
        Index("ix_recently_viewed_user_movie", "user_id", "moviebox_id"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False)
    content_type = Column(String(50), default="movie")
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="recently_viewed")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system")  # watchlist, watch, milestone, content, review, report, system, social
    action_url = Column(String(500), nullable=True)  # Deep link URL
    extra_data = Column(JSON, default=dict)  # Extra context (movie poster, etc.)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")

class Report(Base):
    __tablename__ = "reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    moviebox_id = Column(String(255), nullable=True) # Optional, can be empty if it is a general bug report
    reason = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending") # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reports")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String, nullable=True, index=True)  # null = site review, set = movie review
    content = Column(Text, nullable=False)
    rating = Column(Float, nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reviews")
    likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan")
    reports = relationship("ReviewReport", back_populates="review", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room = Column(String(255), default="global", index=True)  # 'global' or 'movie:<id>'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_messages")

# ═══════════════════════════════════════════════════════════════
# V2 Models — Social, Family Plan, Watch Party, Notifications
# ═══════════════════════════════════════════════════════════════

class ReviewLike(Base):
    """Like/dislike toggle for user reviews."""
    __tablename__ = "review_likes"
    __table_args__ = (
        Index("ix_review_likes_user_review", "user_id", "review_id", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    like_type = Column(String(10), nullable=False)  # 'like' or 'dislike'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    review = relationship("Review", back_populates="likes")

class ReviewReport(Base):
    """Report a review for moderation."""
    __tablename__ = "review_reports"
    __table_args__ = (
        Index("ix_review_reports_user_review", "user_id", "review_id", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(255), nullable=False)  # spam, harassment, spoiler, other
    description = Column(Text)
    status = Column(String(50), default="pending")  # pending, reviewed, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    review = relationship("Review", back_populates="reports")

class WatchPartyRoom(Base):
    """Synchronized playback room."""
    __tablename__ = "watch_party_rooms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False)
    content_type = Column(String(50), default="movie")
    room_code = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(String(20), default="active")  # active, ended
    max_participants = Column(Integer, default=10)
    current_time = Column(Integer, default=0)  # playback position in seconds
    is_playing = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    host = relationship("User")
    participants = relationship("WatchPartyParticipant", back_populates="room", cascade="all, delete-orphan")

class WatchPartyParticipant(Base):
    """Participant in a watch party room."""
    __tablename__ = "watch_party_participants"
    __table_args__ = (
        Index("ix_wp_participant_room_user", "room_id", "user_id", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("watch_party_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("WatchPartyRoom", back_populates="participants")
    user = relationship("User")

class FamilyPlan(Base):
    """Family subscription plan with RBAC. Max 5 sub-accounts."""
    __tablename__ = "family_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    member_slots = Column(Integer, default=5)  # hard-cap at 5
    invite_code = Column(String(20), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("User", foreign_keys=[parent_id])
    members = relationship("FamilyMember", back_populates="family_plan", cascade="all, delete-orphan")
    invites = relationship("FamilyInvite", back_populates="family_plan", cascade="all, delete-orphan")

class FamilyMember(Base):
    """A member of a family plan."""
    __tablename__ = "family_members"
    __table_args__ = (
        Index("ix_family_member_plan_user", "family_plan_id", "user_id", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_plan_id = Column(UUID(as_uuid=True), ForeignKey("family_plans.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    role = Column(String(20), default="member")  # 'owner' or 'member'
    joined_at = Column(DateTime, default=datetime.utcnow)

    family_plan = relationship("FamilyPlan", back_populates="members")
    user = relationship("User")

class FamilyInvite(Base):
    """Email invite to join a family plan."""
    __tablename__ = "family_invites"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_plan_id = Column(UUID(as_uuid=True), ForeignKey("family_plans.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, accepted, expired
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    family_plan = relationship("FamilyPlan", back_populates="invites")

class UserLayoutPreference(Base):
    """User's custom UI row ordering (drag-and-drop)."""
    __tablename__ = "user_layout_preferences"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    layout_order = Column(JSON, default=list)  # e.g. ["my_list", "continue_watching", "trending", ...]
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

class PushSubscription(Base):
    """FCM push notification token per device."""
    __tablename__ = "push_subscriptions"
    __table_args__ = (
        Index("ix_push_sub_user_token", "user_id", "fcm_token", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fcm_token = Column(String(500), nullable=False)
    device_type = Column(String(20), default="web")  # web, ios, android
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class YearlyStats(Base):
    """Wrapped-style yearly viewing statistics."""
    __tablename__ = "yearly_stats"
    __table_args__ = (
        Index("ix_yearly_stats_user_year", "user_id", "year", unique=True),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    total_minutes = Column(Integer, default=0)
    total_titles = Column(Integer, default=0)
    top_genres = Column(JSON, default=list)       # [{"genre":"Action","count":42}, ...]
    top_actors = Column(JSON, default=list)        # [{"name":"Actor","count":15}, ...]
    favorite_movies = Column(JSON, default=list)   # [{"moviebox_id":"...","title":"...","poster":"..."}, ...]
    longest_binge = Column(Integer, default=0)     # minutes in longest session
    data = Column(JSON, default=dict)              # extensible extra stats
    generated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Subtitle(Base):
    """Subtitle/caption file for content (.srt or .vtt)."""
    __tablename__ = "subtitles"
    __table_args__ = (
        Index("ix_subtitles_content", "moviebox_id", "language"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moviebox_id = Column(String(255), nullable=False, index=True)
    content_type = Column(String(50), default="movie")  # movie / series
    language = Column(String(10), nullable=False, default="en")  # ISO 639-1
    label = Column(String(100), default="English")       # Display label
    format = Column(String(10), default="vtt")           # vtt / srt
    file_url = Column(String(500), nullable=False)       # Path or URL to the file
    season = Column(Integer, nullable=True)               # For series
    episode = Column(Integer, nullable=True)              # For series
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PasswordResetToken(Base):
    """One-time password reset token with short TTL."""
    __tablename__ = "password_reset_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(128), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
