import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.user import User
from app.repositories.users import get_user_by_telegram_id, register_user


def _telegram_user_from_init_data(init_data: str) -> dict:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=500, detail="Telegram bot token is not configured")

    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Invalid Telegram Mini App data")

    data_check_string = "\n".join(f"{key}={pairs[key]}" for key in sorted(pairs))
    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram_bot_token.encode(),
        hashlib.sha256,
    ).digest()
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(calculated_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid Telegram Mini App data")

    raw_user = pairs.get("user")
    if not raw_user:
        raise HTTPException(status_code=401, detail="Telegram Mini App user is missing")
    try:
        return json.loads(raw_user)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=401, detail="Invalid Telegram Mini App user") from exc


async def get_current_user(
    telegram_user_id: int | None = Query(None),
    telegram_init_data: str | None = Header(None, alias="X-Telegram-Init-Data"),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    if telegram_init_data:
        telegram_user = _telegram_user_from_init_data(telegram_init_data)
        user_id = telegram_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Telegram Mini App user is missing")
        name = " ".join(
            part
            for part in [telegram_user.get("first_name"), telegram_user.get("last_name")]
            if part
        )
        user = await register_user(
            session,
            int(user_id),
            name or None,
            telegram_user.get("username"),
        )
        await session.commit()
        return user

    if telegram_user_id is None:
        raise HTTPException(status_code=401, detail="Telegram user is not authenticated")

    user = await get_user_by_telegram_id(session, telegram_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not registered")
    return user


def verify_telegram_webhook(secret: str | None = Header(None, alias="X-Telegram-Bot-Api-Secret-Token")) -> None:
    from app.core.config import get_settings

    expected = get_settings().telegram_webhook_secret
    if expected and secret != expected:
        raise HTTPException(status_code=401, detail="Invalid Telegram webhook secret")
