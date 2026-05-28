from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.user import (
    UpdateLanguageRequest,
    UpdateLevelRequest,
    UpdateTopicsRequest,
    UpdateVoiceRequest,
    UpdateVoiceSpeedRequest,
    UserProfile,
)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfile)
async def read_profile(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/level", response_model=UserProfile)
async def update_level(
    payload: UpdateLevelRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user.english_level = payload.english_level
    await session.commit()
    return user


@router.patch("/voice", response_model=UserProfile)
async def update_voice(
    payload: UpdateVoiceRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user.selected_voice = payload.selected_voice
    user.voice_enabled = payload.voice_enabled
    await session.commit()
    return user


@router.patch("/voice-speed", response_model=UserProfile)
async def update_voice_speed(
    payload: UpdateVoiceSpeedRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user.voice_speed = payload.voice_speed
    await session.commit()
    return user


@router.patch("/topics", response_model=UserProfile)
async def update_topics(
    payload: UpdateTopicsRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user.selected_topics = payload.selected_topics
    await session.commit()
    return user


@router.patch("/language", response_model=UserProfile)
async def update_language(
    payload: UpdateLanguageRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user.native_language = payload.native_language
    await session.commit()
    return user

