from aiogram import F, Router
from aiogram.types import CallbackQuery

from app.bot.keyboards import level_keyboard, topics_keyboard, voice_keyboard
from app.db.session import AsyncSessionLocal
from app.repositories.users import register_user

router = Router()


async def _user_from_callback(callback: CallbackQuery):
    tg_user = callback.from_user
    session = AsyncSessionLocal()
    return session, await register_user(session, tg_user.id, tg_user.full_name, tg_user.username)


@router.callback_query(F.data.startswith("voice:"))
async def select_voice(callback: CallbackQuery) -> None:
    async with AsyncSessionLocal() as session:
        user = await register_user(
            session, callback.from_user.id, callback.from_user.full_name, callback.from_user.username
        )
        value = callback.data.split(":", 1)[1]
        if value == "off":
            user.voice_enabled = False
            text = "Voice replies are turned off."
        else:
            user.selected_voice = value
            user.voice_enabled = True
            text = f"Voice changed to {value}."
        await session.commit()
    await callback.message.edit_text(text, reply_markup=voice_keyboard(user.selected_voice, user.voice_enabled))
    await callback.answer()


@router.callback_query(F.data.startswith("level:"))
async def select_level(callback: CallbackQuery) -> None:
    async with AsyncSessionLocal() as session:
        user = await register_user(
            session, callback.from_user.id, callback.from_user.full_name, callback.from_user.username
        )
        user.english_level = callback.data.split(":", 1)[1]
        await session.commit()
    await callback.message.edit_text(
        f"English level: {user.english_level}", reply_markup=level_keyboard(user.english_level)
    )
    await callback.answer()


@router.callback_query(F.data.startswith("topic:"))
async def toggle_topic(callback: CallbackQuery) -> None:
    async with AsyncSessionLocal() as session:
        user = await register_user(
            session, callback.from_user.id, callback.from_user.full_name, callback.from_user.username
        )
        topic = callback.data.split(":", 1)[1]
        selected = list(user.selected_topics or [])
        if topic in selected:
            selected.remove(topic)
        else:
            selected.append(topic)
        user.selected_topics = selected
        await session.commit()
    await callback.message.edit_text("Select topics:", reply_markup=topics_keyboard(user.selected_topics))
    await callback.answer()


@router.callback_query(F.data.startswith("explain"))
async def explain_callback(callback: CallbackQuery) -> None:
    await callback.answer("Open the Mini App explanation screen from the response card.", show_alert=True)


@router.callback_query(F.data.startswith("score"))
async def score_callback(callback: CallbackQuery) -> None:
    await callback.answer("Open the Mini App pronunciation analysis screen.", show_alert=True)
