from html import escape

from aiogram import F, Router
from aiogram.enums import ParseMode
from aiogram.types import CallbackQuery

from app.bot.keyboards import (
    level_keyboard,
    topics_keyboard,
    voice_keyboard,
    voice_response_actions,
)
from app.db.session import AsyncSessionLocal
from app.repositories.learning import save_grammar_explanation
from app.repositories.messages import get_message, get_previous_user_message
from app.repositories.users import register_user
from app.services.tutor import explain_mistake, generate_conversation_help

router = Router()


def _callback_message_id(data: str | None) -> int | None:
    if not data or ":" not in data:
        return None
    value = data.rsplit(":", 1)[1]
    return int(value) if value.isdigit() else None


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
    message_id = _callback_message_id(callback.data)
    if not message_id:
        await callback.answer("I could not find this message.", show_alert=True)
        return

    async with AsyncSessionLocal() as session:
        user = await register_user(
            session, callback.from_user.id, callback.from_user.full_name, callback.from_user.username
        )
        assistant_message = await get_message(session, user.id, message_id)
        user_message = await get_previous_user_message(session, user.id, message_id)
        if not assistant_message or not user_message:
            await callback.answer("I could not find this correction.", show_alert=True)
            return

        original = user_message.text or user_message.transcript or ""
        if not assistant_message.correction or assistant_message.correction.strip().lower() == original.strip().lower():
            await callback.answer("No correction needed.", show_alert=False)
            return
        payload = await explain_mistake(user, original, assistant_message.correction)
        await save_grammar_explanation(session, user.id, user_message.id, payload)
        await session.commit()

    await callback.message.answer(payload.explanation)
    await callback.answer()


@router.callback_query(F.data.startswith("help"))
async def help_callback(callback: CallbackQuery) -> None:
    message_id = _callback_message_id(callback.data)
    if not message_id:
        await callback.answer("I could not find this message.", show_alert=True)
        return

    async with AsyncSessionLocal() as session:
        user = await register_user(
            session, callback.from_user.id, callback.from_user.full_name, callback.from_user.username
        )
        assistant_message = await get_message(session, user.id, message_id)
        user_message = await get_previous_user_message(session, user.id, message_id)
        if not assistant_message or not user_message:
            await callback.answer("I could not prepare help for this message.", show_alert=True)
            return

        original = user_message.text or user_message.transcript or ""
        payload = await generate_conversation_help(user, original, assistant_message.text)

    if callback.message:
        await callback.message.edit_reply_markup(
            reply_markup=voice_response_actions(message_id, callback.from_user.id, help_checked=True)
        )
    await callback.message.answer(
        f"<blockquote>{escape(payload.text)}</blockquote>",
        parse_mode=ParseMode.HTML,
    )
    await callback.answer()
