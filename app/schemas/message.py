from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MessageOut(BaseModel):
    id: int
    role: str
    type: str
    text: str | None
    transcript: str | None
    audio_file_id: str | None
    correction: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatReply(BaseModel):
    message_id: int | None = None
    reply_text: str
    correction: str | None = None
    quick_explanation: str | None = None
    audio_url: str | None = None


class HelpResponse(BaseModel):
    text: str


class FollowUpRequest(BaseModel):
    question: str


class FollowUpResponse(BaseModel):
    answer: str


class ExplainResponse(BaseModel):
    original_text: str
    corrected_text: str
    explanation: str
    chatty_text: str | None = None


class PronunciationScoreOut(BaseModel):
    transcript: str
    accuracy_score: int
    fluency_score: int
    prosody_score: int
    grammar_score: int
    vocabulary_score: int
    topic_score: int
    feedback: str | None = None
