from aiogram import Router
from aiogram.filters import Command
from aiogram.types import BotCommand, Message

from app.bot.keyboards import level_keyboard, mini_app_button, topics_keyboard, voice_keyboard
from app.db.session import AsyncSessionLocal
from app.repositories.messages import reset_dialogue
from app.repositories.users import register_user
from app.services.stats import get_stats
from app.services.subscriptions import check_subscription

router = Router()

COMMANDS = [
    BotCommand(command="start", description="Start bot / onboarding"),
    BotCommand(command="menu", description="Show main menu"),
    BotCommand(command="unlimited", description="Manage unlimited subscription"),
    BotCommand(command="voice", description="Change voice or turn off voice responses"),
    BotCommand(command="level", description="Change your English level"),
    BotCommand(command="topics", description="Choose topics for conversations"),
    BotCommand(command="saved", description="View your saved words"),
    BotCommand(command="stats", description="Show usage statistics"),
    BotCommand(command="help", description="How to use the bot"),
    BotCommand(command="reset", description="Delete previous messages and start a new dialogue"),
    BotCommand(command="language", description="Choose translation/native language"),
]


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


@router.message(Command("start", "menu"))
async def start(message: Message) -> None:
    user = await _user_from_message(message)
    await message.bot.set_my_commands(COMMANDS)
    await message.answer(
        f"Hi {user.name or 'there'}! I am Chatty, your English speaking tutor.\n\n"
        "Send text or voice. I will reply, correct your English, and help you practice.",
        reply_markup=mini_app_button("Open Mini App"),
    )


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    await message.answer(
        "Send me English text or a voice message.\n"
        "Use Explain for grammar, Score ✅ for pronunciation, /topics for conversation themes, "
        "and /saved to review vocabulary."
    )


@router.message(Command("voice"))
async def voice(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer(
        "Turn off audio messages from Chatty or choose one of 6 voices:",
        reply_markup=voice_keyboard(user.selected_voice, user.voice_enabled),
    )


@router.message(Command("level"))
async def level(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer("Select your English level:", reply_markup=level_keyboard(user.english_level))


@router.message(Command("topics"))
async def topics(message: Message) -> None:
    user = await _user_from_message(message)
    await message.answer("Select topics:", reply_markup=topics_keyboard(user.selected_topics))


@router.message(Command("saved"))
async def saved(message: Message) -> None:
    await _user_from_message(message)
    await message.answer("⬇️ Your Saved Words ⬇️", reply_markup=mini_app_button())


@router.message(Command("language"))
async def language(message: Message) -> None:
    await _user_from_message(message)
    await message.answer("Choose your translation language in the Mini App.", reply_markup=mini_app_button())


@router.message(Command("stats"))
async def stats(message: Message) -> None:
    user = await _user_from_message(message)
    stats_out = get_stats(user)
    await message.answer(
        f"📝 Word Count: {stats_out.word_count}\n"
        f"🏆 Maximum Streak: {stats_out.maximum_streak}\n"
        f"⏳ Current Streak: {stats_out.current_streak}\n"
        f"💬 Messages Sent: {stats_out.messages_count}"
    )


@router.message(Command("unlimited"))
async def unlimited(message: Message) -> None:
    user = await _user_from_message(message)
    subscription = check_subscription(user)
    await message.answer(
        "Chatty Unlimited\n\n"
        "✅ Unlimited messages and audio\n"
        "✅ You can unsubscribe at any time\n"
        "✅ Subscribers are more likely to improve their level\n\n"
        f"Current status: {subscription.status}",
        reply_markup=mini_app_button("Continue"),
    )


@router.message(Command("reset"))
async def reset(message: Message) -> None:
    user = await _user_from_message(message)
    async with AsyncSessionLocal() as session:
        await reset_dialogue(session, user.id)
        await session.commit()
    await message.answer("Done. I cleared this dialogue context, but kept your profile and progress.")

