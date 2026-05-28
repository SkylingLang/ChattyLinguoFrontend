from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.user import User
from app.repositories.users import get_user_by_telegram_id


async def get_current_user(
    telegram_user_id: int = Query(...),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    user = await get_user_by_telegram_id(session, telegram_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")
    return user


def verify_telegram_webhook(secret: str | None = Header(None, alias="X-Telegram-Bot-Api-Secret-Token")) -> None:
    from app.core.config import get_settings

    expected = get_settings().telegram_webhook_secret
    if expected and secret != expected:
        raise HTTPException(status_code=401, detail="Invalid Telegram webhook secret")

