from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base
from app.models.enums import SubscriptionStatus


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_user_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    username: Mapped[str | None] = mapped_column(String(255), index=True)
    native_language: Mapped[str] = mapped_column(String(64), default="English")
    english_level: Mapped[str] = mapped_column(String(64), default="Intermediate")
    selected_voice: Mapped[str] = mapped_column(String(64), default="Alexa")
    voice_enabled: Mapped[bool] = mapped_column(default=True)
    voice_speed: Mapped[float] = mapped_column(default=1.0)
    selected_topics: Mapped[list[str]] = mapped_column(JSON, default=list)
    subscription_status: Mapped[str] = mapped_column(
        String(32), default=SubscriptionStatus.FREE.value
    )
    subscription_plan: Mapped[str | None] = mapped_column(String(32))
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    maximum_streak: Mapped[int] = mapped_column(Integer, default=0)
    messages_count: Mapped[int] = mapped_column(Integer, default=0)
    voice_messages_count: Mapped[int] = mapped_column(Integer, default=0)
    practice_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)
    frequent_grammar_mistakes: Mapped[list[str]] = mapped_column(JSON, default=list)
    weak_vocabulary_topics: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    saved_words = relationship("SavedWord", back_populates="user", cascade="all, delete-orphan")
