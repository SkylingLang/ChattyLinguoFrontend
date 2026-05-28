from pydantic import BaseModel


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "English"


class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    word_by_word: list[dict[str, str]]

