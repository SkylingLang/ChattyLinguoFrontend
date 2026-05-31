from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_user_by_telegram_id(session: AsyncSession, telegram_user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.telegram_user_id == telegram_user_id))
    return result.scalar_one_or_none()


async def register_user(
    session: AsyncSession,
    telegram_user_id: int,
    name: str | None = None,
    username: str | None = None,
) -> User:
    user = await get_user_by_telegram_id(session, telegram_user_id)
    if user:
        user.name = name or user.name
        user.username = username or user.username
        return user

    user = User(
        telegram_user_id=telegram_user_id,
        name=name,
        username=username,
        selected_topics=["Food and Cooking", "Travel and Culture"],
    )
    session.add(user)
    await session.flush()
    return user


async def update_streak(session: AsyncSession, user: User, active_date: date | None = None) -> None:
    today = active_date or date.today()
    if user.last_active_date == today:
        return

    active_dates = list(user.active_dates or [])
    today_key = today.isoformat()
    if today_key not in active_dates:
        active_dates.append(today_key)
        user.active_dates = sorted(active_dates)

    if user.last_active_date == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1

    user.maximum_streak = max(user.maximum_streak, user.current_streak)
    user.practice_days += 1
    user.last_active_date = today
    await session.flush()
