from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Table, Date
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
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    watchlist = relationship("Watchlist", back_populates="user")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moviebox_id = Column(String(255), unique=True, index=True) # New field to map to Moviebox API
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
    title = Column(String(255), nullable=False)
    description = Column(Text)
    rating = Column(Float)
    poster_url = Column(String(500))
    backdrop_url = Column(String(500))
    number_of_seasons = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False) # Store the Moviebox ID directly for easy lookup
    content_type = Column(String(50), default="movie") # 'movie' or 'series'
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="watchlist")

class History(Base):
    __tablename__ = "history"
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
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    moviebox_id = Column(String(255), nullable=False)
    content_type = Column(String(50), default="movie")
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="recently_viewed")

# Update User relationship
User.history = relationship("History", back_populates="user")
User.recently_viewed = relationship("RecentlyViewed", back_populates="user", order_by="desc(RecentlyViewed.viewed_at)")
