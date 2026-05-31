from difflib import SequenceMatcher
from html import escape

from aiogram import F, Router
from aiogram.enums import ParseMode
from aiogram.types import BufferedInputFile, Message

from app.bot.keyboards import response_actions, voice_response_actions
from app.db.session import AsyncSessionLocal
from app.models.enums import MessageRole, MessageType
from app.repositories.messages import get_last_messages, save_message, trim_old_messages
from app.repositories.users import register_user, update_streak
from app.services.openai_client import openai_service
from app.services.tutor import generate_chat_reply, generate_voice_reply

router = Router()


def _word_count(text: str) -> int:
    return len(text.split())


def _message_is_correct(original: str, correction: str | None) -> bool:
    return not correction or correction.strip().lower() == original.strip().lower()


def _correction_text(original: str, correction: str | None) -> str:
    cleaned_correction = correction.strip() if correction else None
    if cleaned_correction and cleaned_correction.lower() != original.strip().lower():
        return f"💡 {_correction_diff(original, cleaned_correction)}"
    return f"✅ {escape(original)}"


def _correction_diff(original: str, correction: str) -> str:
    original_words = original.split()
    correction_words = correction.split()
    matcher = SequenceMatcher(a=original_words, b=correction_words)
    parts: list[str] = []
    for tag, start_a, end_a, start_b, end_b in matcher.get_opcodes():
        old = " ".join(original_words[start_a:end_a])
        new = " ".join(correction_words[start_b:end_b])
        if tag == "equal":
            parts.append(escape(old))
        elif tag == "replace":
            parts.append(f"<s>{escape(old)}</s> {escape(new)}")
        elif tag == "delete":
            parts.append(f"<s>{escape(old)}</s>")
        elif tag == "insert":
            parts.append(escape(new))
    return " ".join(part for part in parts if part)


@router.message(F.text)
async def handle_text(message: Message) -> None:
    tg_user = message.from_user
    async with AsyncSessionLocal() as session:
        user = await register_user(session, tg_user.id, tg_user.full_name, tg_user.username)
        await update_streak(session, user)
        await save_message(
            session,
            user.id,
            MessageRole.USER,
            MessageType.TEXT,
            text=message.text,
            telegram_message_id=message.message_id,
        )
        history = await get_last_messages(session, user.id)
        reply = await generate_chat_reply(user, message.text or "", history)
        user.messages_count += 1
        user.word_count += _word_count(message.text or "")
        if _message_is_correct(message.text or "", reply.correction):
            user.correct_messages_count += 1
        assistant_message = await save_message(
            session,
            user.id,
            MessageRole.ASSISTANT,
            MessageType.VOICE,
            text=reply.reply_text,
            correction=reply.correction,
        )
        await trim_old_messages(session, user.id)
        await session.commit()

    await message.answer(
        _correction_text(message.text or "", reply.correction),
        reply_markup=response_actions(
            assistant_message.id,
            telegram_user_id=tg_user.id,
            has_correction=bool(reply.correction),
        ),
        parse_mode=ParseMode.HTML,
    )
    if user.voice_enabled:
        speech = await generate_voice_reply(reply.reply_text, user.selected_voice)
        if speech:
            await message.answer_voice(
                BufferedInputFile(speech, filename="chatty-reply.mp3"),
                reply_markup=voice_response_actions(assistant_message.id, tg_user.id),
            )
    else:
        await message.answer(
            reply.reply_text, reply_markup=voice_response_actions(assistant_message.id, tg_user.id)
        )


@router.message(F.voice)
async def handle_voice(message: Message) -> None:
    tg_user = message.from_user
    voice_file = await message.bot.get_file(message.voice.file_id)
    buffer = await message.bot.download_file(voice_file.file_path)
    audio_bytes = buffer.read() if buffer else b""
    transcript = await openai_service.transcribe_audio(audio_bytes) if audio_bytes else ""
    if not transcript:
        transcript = "I sent a voice message."
    async with AsyncSessionLocal() as session:
        user = await register_user(session, tg_user.id, tg_user.full_name, tg_user.username)
        await update_streak(session, user)
        await save_message(
            session,
            user.id,
            MessageRole.USER,
            MessageType.VOICE,
            transcript=transcript,
            telegram_message_id=message.message_id,
            audio_file_id=message.voice.file_id,
        )
        history = await get_last_messages(session, user.id)
        reply = await generate_chat_reply(user, transcript, history)
        user.messages_count += 1
        user.voice_messages_count += 1
        user.word_count += _word_count(transcript)
        if _message_is_correct(transcript, reply.correction):
            user.correct_messages_count += 1
        assistant_message = await save_message(
            session,
            user.id,
            MessageRole.ASSISTANT,
            MessageType.VOICE,
            text=reply.reply_text,
            correction=reply.correction,
        )
        await trim_old_messages(session, user.id)
        await session.commit()

    await message.answer(
        _correction_text(transcript, reply.correction),
        reply_markup=response_actions(
            assistant_message.id,
            telegram_user_id=tg_user.id,
            has_correction=bool(reply.correction),
            allow_score=True,
        ),
        parse_mode=ParseMode.HTML,
    )
    if user.voice_enabled:
        speech = await generate_voice_reply(reply.reply_text, user.selected_voice)
        if speech:
            await message.answer_voice(
                BufferedInputFile(speech, filename="chatty-reply.mp3"),
                reply_markup=voice_response_actions(assistant_message.id, tg_user.id),
            )
    else:
        await message.answer(
            reply.reply_text, reply_markup=voice_response_actions(assistant_message.id, tg_user.id)
        )
