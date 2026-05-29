from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.repositories import learning as learning_repo
from app.repositories import words as words_repo
from app.repositories.messages import get_message
from app.schemas.message import ExplainResponse, MessageOut, PronunciationScoreOut
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
