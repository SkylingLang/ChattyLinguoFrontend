from datetime import date

from pydantic import BaseModel


class StatsOut(BaseModel):
    word_count: int
    current_streak: int
    maximum_streak: int
    messages_count: int
    voice_messages_count: int
    practice_days: int
    last_active_date: date | None
    correct_percent: int = 0

