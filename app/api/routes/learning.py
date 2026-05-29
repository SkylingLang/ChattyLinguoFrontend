from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.repositories import learning as learning_repo
from app.repositories import words as words_repo
from app.repositories.messages import get_message, get_previous_user_message
from app.schemas.message import (
    ExplainResponse,
    FollowUpRequest,
    FollowUpResponse,
    MessageOut,
    PronunciationScoreOut,
)
from app.schemas.translation import TranslateRequest, TranslateResponse
from app.schemas.word import SaveWordRequest, SavedWordOut, WordDefinition
from app.services import tutor

router = APIRouter(prefix="/learning", tags=["learning"])


@router.get("/messages/{message_id}", response_model=MessageOut)
async def message_detail(
    message_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> MessageOut:
    message = await get_message(session, user.id, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.get("/messages/{message_id}/score", response_model=PronunciationScoreOut)
async def message_score(
    message_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PronunciationScoreOut:
    user_message = await get_previous_user_message(session, user.id, message_id)
    if not user_message or not user_message.transcript:
        raise HTTPException(status_code=404, detail="Voice message not found")

    saved = await learning_repo.get_latest_pronunciation_score(session, user.id, user_message.id)
    if saved:
        return PronunciationScoreOut(
            transcript=saved.transcript,
            accuracy_score=saved.accuracy_score,
            fluency_score=saved.fluency_score,
            prosody_score=saved.prosody_score,
            grammar_score=saved.grammar_score,
            vocabulary_score=saved.vocabulary_score,
            topic_score=saved.topic_score,
            feedback=saved.feedback,
        )

    payload = await tutor.score_pronunciation(user, user_message.transcript)
    await learning_repo.save_pronunciation_score(
        session, user.id, user_message.id, user_message.audio_file_id, payload
    )
    await session.commit()
    return payload


@router.get("/messages/{message_id}/explain", response_model=ExplainResponse)
async def message_explain(
    message_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ExplainResponse:
    assistant_message = await get_message(session, user.id, message_id)
    user_message = await get_previous_user_message(session, user.id, message_id)
    if not assistant_message or not user_message:
        raise HTTPException(status_code=404, detail="Message not found")

    original = user_message.text or user_message.transcript or ""
    correction = assistant_message.correction
    if not correction or correction.strip().lower() == original.strip().lower():
        raise HTTPException(status_code=404, detail="Correction not found")

    payload = await tutor.explain_mistake(user, original, correction)
    payload.chatty_text = assistant_message.text
    await learning_repo.save_grammar_explanation(session, user.id, user_message.id, payload)
    await session.commit()
    return payload


@router.post("/messages/{message_id}/explain/follow-up", response_model=FollowUpResponse)
async def explain_follow_up(
    message_id: int,
    payload: FollowUpRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> FollowUpResponse:
    assistant_message = await get_message(session, user.id, message_id)
    user_message = await get_previous_user_message(session, user.id, message_id)
    if not assistant_message or not user_message or not assistant_message.correction:
        raise HTTPException(status_code=404, detail="Correction not found")

    original = user_message.text or user_message.transcript or ""
    explanation = await tutor.explain_mistake(user, original, assistant_message.correction)
    answer = await tutor.answer_explanation_follow_up(
        user,
        original,
        assistant_message.correction,
        explanation.explanation,
        payload.question,
    )
    return FollowUpResponse(answer=answer)


@router.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest) -> TranslateResponse:
    return await tutor.translate_text(payload.text, payload.target_language)


@router.get("/word/{word}", response_model=WordDefinition)
async def define_word(
    word: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> WordDefinition:
    saved = await words_repo.get_saved_word(session, user.id, word)
    return await tutor.get_word_definition(word, user.native_language, saved=bool(saved))


@router.get("/saved-words", response_model=list[SavedWordOut])
async def saved_words(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list:
    return await words_repo.get_saved_words(session, user.id)


@router.post("/saved-words", response_model=SavedWordOut)
async def save_word(
    payload: SaveWordRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    saved = await words_repo.save_word(session, user.id, payload)
    await session.commit()
    return saved


@router.delete("/saved-words/{word}", status_code=204)
async def remove_word(
    word: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await words_repo.remove_saved_word(session, user.id, word)
    await session.commit()


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: ExplainResponse, user: User = Depends(get_current_user)) -> ExplainResponse:
    return await tutor.explain_mistake(user, payload.original_text, payload.corrected_text)


@router.post("/score", response_model=PronunciationScoreOut)
async def score(payload: PronunciationScoreOut) -> PronunciationScoreOut:
    return payload
