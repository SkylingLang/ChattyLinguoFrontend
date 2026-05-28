import asyncio

from aiogram import Bot

from app.core.config import get_settings


async def main() -> None:
    settings = get_settings()
    bot = Bot(settings.telegram_bot_token)
    await bot.set_webhook(
        url=f"{settings.api_base_url}/telegram/webhook",
        secret_token=settings.telegram_webhook_secret or None,
    )
    await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())

