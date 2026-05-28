import json
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

settings = get_settings()


class OpenAIService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def chat_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if not self.client:
            return {}

        response = await self.client.chat.completions.create(
            model=settings.openai_chat_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    async def chat_text(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            return ""

        response = await self.client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "voice.ogg") -> str:
        if not self.client:
            return ""

        transcription = await self.client.audio.transcriptions.create(
            model=settings.openai_transcription_model,
            file=(filename, audio_bytes),
        )
        return transcription.text

    async def generate_speech(self, text: str, voice: str) -> bytes:
        if not self.client:
            return b""

        response = await self.client.audio.speech.create(
            model=settings.openai_tts_model,
            voice=voice,
            input=text,
            response_format="mp3",
        )
        return response.content


openai_service = OpenAIService()

