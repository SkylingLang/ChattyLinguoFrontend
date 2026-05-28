from aiogram.types import Update
from fastapi import APIRouter, Depends, Request

from app.api.deps import verify_telegram_webhook
from app.bot.factory import bot, dispatcher

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.post("/webhook", dependencies=[Depends(verify_telegram_webhook)])
async def telegram_webhook(request: Request) -> dict[str, bool]:
    payload = await request.json()
    update = Update.model_validate(payload, context={"bot": bot})
    await dispatcher.feed_update(bot, update)
    return {"ok": True}

