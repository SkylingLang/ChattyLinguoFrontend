from aiogram import F, Router
from aiogram.types import BufferedInputFile
from aiogram.types import Message

from app.bot.keyboards import response_actions
from app.db.session import AsyncSessionLocal
from app.models.enums import MessageRole, MessageType
from app.repositories.messages import get_last_messages, save_message, trim_old_messages
from app.repositories.users import register_user, update_streak
from app.services.openai_client import openai_service
from app.services.tutor import generate_chat_reply, generate_voice_reply

router = Router()


@router.message(F.text)
async def handle_text(message: Message) -> None:
    tg_user = message.from_user
    async with AsyncSessionLocal() as session:
        user = await register_user(session, tg_user.id, tg_user.full_name, tg_user.username)
        user.messages_count += 1
        user.word_count += len((message.text or "").split())
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
        assistant_message = await save_message(
            session,
            user.id,
            MessageRole.ASSISTANT,
            MessageType.TEXT,
            text=reply.reply_text,
            correction=reply.correction,
        )
        await trim_old_messages(session, user.id)
        await session.commit()

    parts = [reply.reply_text]
    if reply.correction:
        parts.append(f"\nCorrection:\n✅ {reply.correction}")
    await message.answer("\n".join(parts), reply_markup=response_actions(assistant_message.id))


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
        user.messages_count += 1
        user.voice_messages_count += 1
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
        assistant_message = await save_message(
            session,
            user.id,
            MessageRole.ASSISTANT,
            MessageType.TEXT,
            text=reply.reply_text,
            correction=reply.correction,
        )
        await trim_old_messages(session, user.id)
        await session.commit()

    await message.answer(f"Transcript:\n{transcript}\n\n{reply.reply_text}", reply_markup=response_actions(assistant_message.id))
    if user.voice_enabled:
        speech = await generate_voice_reply(reply.reply_text, user.selected_voice)
        if speech:
            await message.answer_voice(BufferedInputFile(speech, filename="chatty-reply.mp3"))
