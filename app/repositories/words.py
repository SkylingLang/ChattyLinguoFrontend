from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_word import SavedWord
from app.schemas.word import SaveWordRequest


async def get_saved_words(session: AsyncSession, user_id: int) -> list[SavedWord]:
    result = await session.execute(
        select(SavedWord).where(SavedWord.user_id == user_id).order_by(SavedWord.saved_at.desc())
    )
    return list(result.scalars().all())


async def get_saved_word(session: AsyncSession, user_id: int, word: str) -> SavedWord | None:
    result = await session.execute(
        select(SavedWord).where(
            SavedWord.user_id == user_id,
            SavedWord.word == word.lower().strip(),
        )
    )
    return result.scalar_one_or_none()


async def save_word(session: AsyncSession, user_id: int, payload: SaveWordRequest) -> SavedWord:
    normalized_word = payload.word.lower().strip()
    existing = await get_saved_word(session, user_id, normalized_word)
    if existing:
        return existing

    saved_word = SavedWord(
        user_id=user_id,
        word=normalized_word,
        translation=payload.translation,
        definition=payload.definition,
        examples=payload.examples,
        part_of_speech=payload.part_of_speech,
        pronunciation=payload.pronunciation,
        antonyms=payload.antonyms,
    )
    session.add(saved_word)
    await session.flush()
    return saved_word


async def remove_saved_word(session: AsyncSession, user_id: int, word: str) -> None:
    await session.execute(
        delete(SavedWord).where(
            SavedWord.user_id == user_id,
            SavedWord.word == word.lower().strip(),
        )
    )

