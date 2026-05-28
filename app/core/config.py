from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ChattyLinguo"
    app_env: str = "local"
    debug: bool = False
    api_base_url: AnyHttpUrl | str = "http://localhost:8000"
    mini_app_url: AnyHttpUrl | str = "http://localhost:5173"

    database_url: str = "sqlite+aiosqlite:///./chattylinguo.sqlite3"

    telegram_bot_token: str = Field(default="", repr=False)
    telegram_webhook_secret: str = Field(default="", repr=False)

    openai_api_key: str = Field(default="", repr=False)
    openai_chat_model: str = "gpt-4.1-mini"
    openai_transcription_model: str = "gpt-4o-mini-transcribe"
    openai_tts_model: str = "gpt-4o-mini-tts"
    openai_default_voice: str = "alloy"

    free_daily_message_limit: int = 25
    free_daily_audio_limit: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()

