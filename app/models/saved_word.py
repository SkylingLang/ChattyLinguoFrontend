from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class SavedWord(Base):
    __tablename__ = "saved_words"
    __table_args__ = (UniqueConstraint("user_id", "word", name="uq_saved_words_user_word"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    word: Mapped[str] = mapped_column(String(128), index=True)
    translation: Mapped[str | None] = mapped_column(String(255))
    definition: Mapped[str | None] = mapped_column(Text)
    examples: Mapped[list[str]] = mapped_column(JSON, default=list)
    part_of_speech: Mapped[str | None] = mapped_column(String(64))
    pronunciation: Mapped[str | None] = mapped_column(String(255))
    antonyms: Mapped[list[str]] = mapped_column(JSON, default=list)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_words")
