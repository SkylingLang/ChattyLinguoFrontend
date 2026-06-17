from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class UserProfile(BaseModel):
    id: int
    telegram_user_id: int
    name: str | None
    username: str | None
    native_language: str
    interface_language: str
    english_level: str
    selected_voice: str
    voice_enabled: bool
    voice_speed: float
    selected_topics: list[str]
    subscription_status: str
    subscription_plan: str | None
    subscription_expires_at: datetime | None
    word_count: int
    correct_messages_count: int
    stars_count: int
    tickets_count: int
    daily_message_stars_count: int
    daily_message_stars_date: date | None
    correct_percent: int
    current_streak: int
    maximum_streak: int
    messages_count: int
    voice_messages_count: int
    practice_days: int
    last_active_date: date | None
    active_dates: list[str]

    model_config = ConfigDict(from_attributes=True)


class UpdateLevelRequest(BaseModel):
    english_level: str


class UpdateVoiceRequest(BaseModel):
    selected_voice: str
    voice_enabled: bool = True


class UpdateVoiceSpeedRequest(BaseModel):
    voice_speed: float


class UpdateTopicsRequest(BaseModel):
    selected_topics: list[str]


class UpdateLanguageRequest(BaseModel):
    native_language: str


class UpdateInterfaceLanguageRequest(BaseModel):
    interface_language: str


class ExchangeStarsResponse(BaseModel):
    stars_count: int
    tickets_count: int
    daily_message_stars_count: int
