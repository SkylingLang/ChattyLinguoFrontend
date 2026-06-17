from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.repositories.users import reset_daily_message_stars_if_needed
from app.schemas.user import (
    UpdateInterfaceLanguageRequest,
    UpdateLanguageRequest,
    UpdateLevelRequest,
    UpdateTopicsRequest,
    UpdateVoiceRequest,
    UpdateVoiceSpeedRequest,
    ExchangeStarsResponse,
    UserProfile,
)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfile)
async def read_profile(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    await reset_daily_message_stars_if_needed(session, user)
    await session.commit()
    return user


@router.post("/stars/exchange", response_model=ExchangeStarsResponse)
async def exchange_stars_for_ticket(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ExchangeStarsResponse:
    await reset_daily_message_stars_if_needed(session, user)
    if user.stars_count < 100:
        raise HTTPException(status_code=400, detail="You need 100 stars to exchange for 1 ticket.")

    user.stars_count -= 100
    user.tickets_count += 1
    await session.commit()
    return ExchangeStarsResponse(
        stars_count=user.stars_count,
        tickets_count=user.tickets_count,
        daily_message_stars_count=user.daily_message_stars_count,
    )


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


@router.patch("/interface-language", response_model=UserProfile)
async def update_interface_language(
    payload: UpdateInterfaceLanguageRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    if payload.interface_language not in {"en", "ru"}:
        raise HTTPException(status_code=400, detail="Unsupported interface language.")
    user.interface_language = payload.interface_language
    await session.commit()
    return user
