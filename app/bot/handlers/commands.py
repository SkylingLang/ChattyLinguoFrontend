from aiogram import Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command
from aiogram.types import BotCommand, InlineQuery, InlineQueryResultArticle, InputTextMessageContent, Message

from app.bot.keyboards import (
    level_keyboard,
    mini_app_button,
    topics_keyboard,
    voice_keyboard,
    voice_speed_keyboard,
)
from app.db.session import AsyncSessionLocal
from app.repositories.messages import get_dialogue_telegram_message_ids
from app.repositories.users import register_user
from app.services.stats import get_stats
from app.services.subscriptions import check_subscription

router = Router()

INLINE_COMMANDS = {
    "/menu": "Open Mini App link",
    "/help": "Show help",
    "/voice": "Change Aqbota voice",
    "/voice_speed": "Change Aqbota voice speed",
    "/level": "Change English level",
    "/topics": "Choose topics",
    "/saved": "Open saved words",
    "/languages": "Open languages",
    "/stats": "Show stats",
    "/unlimited": "Manage unlimited",
    "/invite": "Invite friends",
    "/reset": "Clear Telegram chat",
}

COMMANDS = [
    BotCommand(command="start", description="Start bot / onboarding"),
    BotCommand(command="menu", description="Show main menu"),
    BotCommand(command="unlimited", description="Manage unlimited subscription"),
    BotCommand(command="voice", description="Change voice or turn off voice responses"),
    BotCommand(command="level", description="Change your English level"),
    BotCommand(command="topics", description="Choose topics for conversations"),
    BotCommand(command="saved", description="View your saved words"),
    BotCommand(command="voice_speed", description="Change voice message speed"),
    BotCommand(command="stats", description="Show usage statistics"),
    BotCommand(command="help", description="How to use the bot"),
    BotCommand(command="reset", description="Delete previous messages and start a new dialogue"),
    BotCommand(command="languages", description="Aqbota for other languages"),
]

HELP_TEXT = """Команды:
⚪ /unlimited - Управление безлимитной подпиской
⚪ /voice - Изменить голос Aqbota или отключить голосовые ответы
⚪ /level - Изменить ваш уровень английского
⚪ /topics - Выбрать тему для обсуждения
⚪ /saved - Просмотреть сохраненные слова
⚪ /voice_speed - Изменить скорость голосовых сообщений Aqbota
⚪ /stats - Показать статистику использования Aqbota
⚪ /languages - Aqbota для других языков

⚪ /reset - Очистить историю сообщений в Telegram-чате с Aqbota. Данные в базе не удаляются.

🎤 Используйте голосовые сообщения вместо текста.
🤓 Не стесняйтесь задавать любые вопросы. Новые фразы, переводы слов, правила грамматики и т.д.
⏰ Говорите много. Ваша цель - отвечать очень подробно и использовать сложные предложения.
❤️ Попросите сменить тему, если хотите - не бойтесь обидеть Aqbota.

Общайтесь с Aqbota, как с носителем языка. Aqbota будет исправлять критические ошибки, а если вы что-то не понимаете, не стесняйтесь попросить ее перефразировать. Aqbota также может переводить, но оставьте это для критических ситуаций, когда понимание необходимо.

Если Aqbota говорит слишком быстро, нажмите и удерживайте кнопку 1X в правом верхнем углу Telegram и измените скорость воспроизведения аудио.

🌐 Если у вас проблемы с доступом к Telegram, используйте наш специальный бесплатный прокси для пользователей Aqbota."""


async def _user_from_message(message: Message):
    tg_user = message.from_user
    async with AsyncSessionLocal() as session:
        user = await register_user(
            session,
            telegram_user_id=tg_user.id,
            name=tg_user.full_name,
            username=tg_user.username,
        )
        await session.commit()
        return user


async def send_menu(message: Message) -> None:
    user = await _user_from_message(message)
    await message.bot.set_my_commands(COMMANDS)
    await message.answer(
        "Here is the link:",
        reply_markup=mini_app_button("Open Mini App", user.telegram_user_id),
    )


async def send_help(message: Message) -> None:
    await message.answer(HELP_TEXT)


async def send_voice(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer(
        "Turn off audio messages from Aqbota or choose one of 6 voices:",
        reply_markup=voice_keyboard(user.selected_voice, user.voice_enabled),
    )


async def send_voice_speed(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer(
        "Choose Aqbota voice message speed:",
        reply_markup=voice_speed_keyboard(user.voice_speed),
    )


async def send_level(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer("Select your English level:", reply_markup=level_keyboard(user.english_level))


async def send_topics(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer("Select topics:", reply_markup=topics_keyboard(user.selected_topics))


async def send_saved(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer(
        "Open the Mini App to view your saved words:",
        reply_markup=mini_app_button("Open Mini App", user.telegram_user_id),
    )


async def send_languages(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer(
        "Open the Mini App to choose languages:",
        reply_markup=mini_app_button("Open Mini App", user.telegram_user_id),
    )


async def send_stats(message: Message) -> None:
    user = await _user_from_message(message)
    stats_out = get_stats(user)
    await message.answer(
        f"📝 Word Count: {stats_out.word_count}\n"
        f"🏆 Maximum Streak: {stats_out.maximum_streak}\n"
        f"⏳ Current Streak: {stats_out.current_streak}\n"
        f"💬 Messages Sent: {stats_out.messages_count}"
    )


async def send_unlimited(message: Message) -> None:
    user = await _user_from_message(message)
    subscription = check_subscription(user)
    await message.answer(
        "Aqbota Unlimited\n\n"
        "✅ Unlimited messages and audio\n"
        "✅ You can unsubscribe at any time\n"
        "✅ Subscribers are more likely to improve their level\n\n"
        f"Current status: {subscription.status}",
        reply_markup=mini_app_button("Continue", user.telegram_user_id),
    )


async def send_invite(message: Message) -> None:
    user = await _user_from_message(message)
    bot_username = (await message.bot.get_me()).username
    bot_link = f"https://t.me/{bot_username}?start=ref_{user.telegram_user_id}"
    await message.answer(f"Invite friends with this link:\n{bot_link}")


async def reset(message: Message) -> None:
    user = await _user_from_message(message)
    async with AsyncSessionLocal() as session:
        telegram_message_ids = await get_dialogue_telegram_message_ids(session, user.id)

    recent_message_ids = range(max(1, message.message_id - 200), message.message_id + 1)
    for message_id in {*telegram_message_ids, *recent_message_ids}:
        try:
            await message.bot.delete_message(message.chat.id, message_id)
        except TelegramBadRequest:
            pass
    await message.answer("Диалог очищен. Профиль и прогресс сохранены.")


@router.inline_query()
async def inline_command_query(inline_query: InlineQuery) -> None:
    query = (inline_query.query or "").strip()
    commands = [query] if query in INLINE_COMMANDS else [
        command for command in INLINE_COMMANDS if command.startswith(query)
    ]
    results = [
        InlineQueryResultArticle(
            id=command.strip("/"),
            title=command,
            description=INLINE_COMMANDS[command],
            input_message_content=InputTextMessageContent(message_text=command),
        )
        for command in commands[:10]
    ]
    await inline_query.answer(results, cache_time=0, is_personal=True)


async def dispatch_web_app_command(message: Message, command: str) -> bool:
    handlers = {
        "/menu": send_menu,
        "/start": send_menu,
        "/help": send_help,
        "/voice": send_voice,
        "/voice_speed": send_voice_speed,
        "/level": send_level,
        "/topics": send_topics,
        "/saved": send_saved,
        "/saved_words": send_saved,
        "/language": send_languages,
        "/languages": send_languages,
        "/stats": send_stats,
        "/unlimited": send_unlimited,
        "/invite": send_invite,
        "/reset": reset,
    }
    handler = handlers.get(command.strip())
    if not handler:
        return False
    await handler(message)
    return True


@router.message(Command("start", "menu"))
async def start_command(message: Message) -> None:
    await send_menu(message)


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    await send_help(message)


@router.message(Command("voice"))
async def voice_command(message: Message) -> None:
    await send_voice(message)


@router.message(Command("voice_speed"))
async def voice_speed_command(message: Message) -> None:
    await send_voice_speed(message)


@router.message(Command("level"))
async def level_command(message: Message) -> None:
    await send_level(message)


@router.message(Command("topics"))
async def topics_command(message: Message) -> None:
    await send_topics(message)


@router.message(Command("saved", "saved_words"))
async def saved_command(message: Message) -> None:
    await send_saved(message)


@router.message(Command("language", "languages"))
async def language_command(message: Message) -> None:
    await send_languages(message)


@router.message(Command("stats"))
async def stats_command(message: Message) -> None:
    await send_stats(message)


@router.message(Command("unlimited"))
async def unlimited_command(message: Message) -> None:
    await send_unlimited(message)


@router.message(Command("invite"))
async def invite_command(message: Message) -> None:
    await send_invite(message)


@router.message(Command("reset"))
async def reset_command(message: Message) -> None:
    await reset(message)
