"""Database models for SQLAlchemy."""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model for authentication and user information."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to parse results (for future use)
    parse_results = relationship("ParseResult", back_populates="user", cascade="all, delete-orphan")


class ParseResult(Base):
    """Parse result model for storing PDF parsing results."""

    __tablename__ = "parse_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    num_pages = Column(Integer, nullable=False)
    parse_time_ms = Column(Integer, nullable=False)
    total_matches = Column(Integer, nullable=False)
    matched_pages = Column(Integer, nullable=False)
    results_json = Column(Text, nullable=False)  # JSON string of full results
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship to user
    user = relationship("User", back_populates="parse_results")

