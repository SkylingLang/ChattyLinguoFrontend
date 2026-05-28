from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MessageRole, MessageType


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    telegram_message_id: Mapped[int | None] = mapped_column(Integer, index=True)
    role: Mapped[str] = mapped_column(String(32), default=MessageRole.USER.value)
    type: Mapped[str] = mapped_column(String(32), default=MessageType.TEXT.value)
    text: Mapped[str | None] = mapped_column(Text)
    transcript: Mapped[str | None] = mapped_column(Text)
    audio_file_id: Mapped[str | None] = mapped_column(String(512))
    correction: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="messages")
    pronunciation_score = relationship(
        "PronunciationScore", back_populates="message", cascade="all, delete-orphan"
    )
    grammar_explanation = relationship(
        "GrammarExplanation", back_populates="message", cascade="all, delete-orphan"
    )

