from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learning import GrammarExplanation, PronunciationScore
from app.schemas.message import ExplainResponse, PronunciationScoreOut


async def save_grammar_explanation(
    session: AsyncSession,
    user_id: int,
    message_id: int | None,
    payload: ExplainResponse,
) -> GrammarExplanation:
    row = GrammarExplanation(
        user_id=user_id,
        message_id=message_id,
        original_text=payload.original_text,
        corrected_text=payload.corrected_text,
        explanation=payload.explanation,
    )
    session.add(row)
    await session.flush()
    return row


async def save_pronunciation_score(
    session: AsyncSession,
    user_id: int,
    message_id: int | None,
    audio_file_id: str | None,
    payload: PronunciationScoreOut,
) -> PronunciationScore:
    row = PronunciationScore(
        user_id=user_id,
        message_id=message_id,
        transcript=payload.transcript,
        audio_file_id=audio_file_id,
        accuracy_score=payload.accuracy_score,
        fluency_score=payload.fluency_score,
        prosody_score=payload.prosody_score,
        grammar_score=payload.grammar_score,
        vocabulary_score=payload.vocabulary_score,
        topic_score=payload.topic_score,
        feedback=payload.feedback,
    )
    session.add(row)
    await session.flush()
    return row


async def get_latest_pronunciation_score(
    session: AsyncSession, user_id: int, message_id: int | None
) -> PronunciationScore | None:
    result = await session.execute(
        select(PronunciationScore)
        .where(
            PronunciationScore.user_id == user_id,
            PronunciationScore.message_id == message_id,
        )
        .order_by(PronunciationScore.created_at.desc(), PronunciationScore.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
