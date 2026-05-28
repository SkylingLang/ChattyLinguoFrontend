from aiogram import Bot, Dispatcher

from app.bot.handlers import callbacks, commands, messages
from app.core.config import get_settings

settings = get_settings()

bot = Bot(token=settings.telegram_bot_token or "0:token")
dispatcher = Dispatcher()
dispatcher.include_router(commands.router)
dispatcher.include_router(callbacks.router)
dispatcher.include_router(messages.router)

