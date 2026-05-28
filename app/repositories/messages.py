from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MessageRole, MessageType
from app.models.message import Message


async def save_message(
    session: AsyncSession,
    user_id: int,
    role: MessageRole,
    message_type: MessageType,
    text: str | None = None,
    transcript: str | None = None,
    telegram_message_id: int | None = None,
    audio_file_id: str | None = None,
    correction: str | None = None,
) -> Message:
    message = Message(
        user_id=user_id,
        role=role.value,
        type=message_type.value,
        text=text,
        transcript=transcript,
        telegram_message_id=telegram_message_id,
        audio_file_id=audio_file_id,
        correction=correction,
    )
    session.add(message)
    await session.flush()
    return message


async def get_last_messages(session: AsyncSession, user_id: int, limit: int = 20) -> list[Message]:
    result = await session.execute(
        select(Message)
        .where(Message.user_id == user_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))


async def trim_old_messages(session: AsyncSession, user_id: int, keep: int = 20) -> None:
    result = await session.execute(
        select(Message.id)
        .where(Message.user_id == user_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .offset(keep)
    )
    old_ids = [row[0] for row in result.all()]
    if old_ids:
        await session.execute(delete(Message).where(Message.id.in_(old_ids)))


async def reset_dialogue(session: AsyncSession, user_id: int) -> None:
    await session.execute(delete(Message).where(Message.user_id == user_id))

