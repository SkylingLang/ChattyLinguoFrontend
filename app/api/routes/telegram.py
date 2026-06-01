from aiogram.types import Update
from aiogram.types import InlineQueryResultArticle, InputTextMessageContent
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import get_current_user, verify_telegram_webhook
from app.bot.factory import bot, dispatcher
from app.models.user import User

router = APIRouter(prefix="/telegram", tags=["telegram"])

WEB_APP_COMMANDS = {
    "/menu",
    "/help",
    "/voice",
    "/voice_speed",
    "/level",
    "/topics",
    "/saved",
    "/saved_words",
    "/language",
    "/languages",
    "/stats",
    "/unlimited",
    "/invite",
    "/reset",
}


class WebAppCommandRequest(BaseModel):
    query_id: str
    command: str


@router.post("/webhook", dependencies=[Depends(verify_telegram_webhook)])
async def telegram_webhook(request: Request) -> dict[str, bool]:
    payload = await request.json()
    update = Update.model_validate(payload, context={"bot": bot})
    await dispatcher.feed_update(bot, update)
    return {"ok": True}


@router.post("/web-app-command")
async def answer_web_app_command(
    payload: WebAppCommandRequest,
    _user: User = Depends(get_current_user),
) -> dict[str, bool]:
    command = payload.command.strip()
    if command not in WEB_APP_COMMANDS:
        raise HTTPException(status_code=400, detail="Unsupported Mini App command")

    await bot.answer_web_app_query(
        web_app_query_id=payload.query_id,
        result=InlineQueryResultArticle(
            id=command.strip("/").replace("_", "-"),
            title=command,
            input_message_content=InputTextMessageContent(message_text=command),
        ),
    )
    return {"ok": True}
