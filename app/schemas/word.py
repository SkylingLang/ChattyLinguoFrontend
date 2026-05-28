from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WordDefinition(BaseModel):
    word: str
    translation: str | None = None
    definition: str | None = None
    examples: list[str] = []
    part_of_speech: str | None = None
    pronunciation: str | None = None
    antonyms: list[str] = []
    saved: bool = False


class SavedWordOut(WordDefinition):
    id: int
    saved_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaveWordRequest(BaseModel):
    word: str
    translation: str | None = None
    definition: str | None = None
    examples: list[str] = []
    part_of_speech: str | None = None
    pronunciation: str | None = None
    antonyms: list[str] = []

