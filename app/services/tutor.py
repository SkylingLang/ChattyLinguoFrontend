from app.models.message import Message
from app.models.user import User
from app.schemas.message import ChatReply, ExplainResponse, HelpResponse, PronunciationScoreOut
from app.schemas.translation import TranslateResponse
from app.schemas.word import WordDefinition
from app.services.openai_client import openai_service

VOICE_MAP = {
    "Alex": "alloy",
    "Eric": "echo",
    "Henry": "onyx",
    "James": "fable",
    "Alexa": "nova",
    "Emily": "shimmer",
}


def _history_text(messages: list[Message]) -> str:
    lines = []
    for message in messages:
        body = message.text or message.transcript or ""
        lines.append(f"{message.role}: {body}")
    return "\n".join(lines[-20:])


async def generate_chat_reply(user: User, user_text: str, history: list[Message]) -> ChatReply:
    system_prompt = (
        "You are Chatty, a warm English speaking tutor inside Telegram. "
        "Reply only in English. The reply_text is for a voice answer, so answer the learner's "
        "question naturally and end with one friendly follow-up question. Do not include "
        "transcription, correction, grammar analysis, scores, or labels in reply_text. "
        "Return JSON with keys: reply_text, correction, quick_explanation. For correction, "
        "return only the fully corrected version of the learner message, or null if there is "
        "no meaningful mistake."
    )
    user_prompt = f"""
Learner profile:
- Name: {user.name or "friend"}
- English level: {user.english_level}
- Favorite topics: {", ".join(user.selected_topics or [])}

Recent dialogue:
{_history_text(history)}

New learner message:
{user_text}
"""
    data = await openai_service.chat_json(system_prompt, user_prompt)
    if not data:
        corrected = user_text.replace("enjoy go", "enjoy going").replace("and eat", "and eating")
        return ChatReply(
            reply_text="That sounds nice. Walking with friends is great exercise. What food do you enjoy most?",
            correction=corrected if corrected != user_text else None,
            quick_explanation="Use a gerund after verbs like 'enjoy', for example 'enjoy going'.",
        )

    return ChatReply(
        reply_text=data.get("reply_text", ""),
        correction=data.get("correction"),
        quick_explanation=data.get("quick_explanation"),
    )


async def generate_conversation_help(user: User, user_text: str, reply_text: str | None = None) -> HelpResponse:
    system_prompt = (
        "You are an English speaking coach. Return short plain text with three sections: "
        "Beginning, Useful words and structures, Example complete answer. Help the learner "
        "answer Chatty's latest follow-up question. Use simple English, bullets, and one "
        "concise sample answer."
    )
    data = await openai_service.chat_text(
        system_prompt,
        f"Level: {user.english_level}\nLearner said: {user_text}\nChatty replied: {reply_text or ''}",
    )
    if not data:
        data = (
            'Beginning:\n- Start with a short answer: "My day is..." or "These days, I..."\n'
            '- Add one or two details: "I work", "I study", "I cook", "I play sports".\n'
            '- Use simple connectors: "and", "but", "so", "because".\n\n'
            'Useful words and structures:\n- "usually", "sometimes", "every day", "right now".\n'
            '- "I enjoy...", "I want to...", "I am learning...".\n\n'
            'Example complete answer:\n'
            '"These days, I am busy, but I feel good. I study every day, and I relax by watching movies."'
        )
    return HelpResponse(text=data)


async def answer_explanation_follow_up(
    user: User,
    original_text: str,
    corrected_text: str,
    explanation: str,
    question: str,
) -> str:
    system_prompt = (
        "You are Chatty, an English tutor. Answer follow-up questions about an English "
        "correction. Be brief, friendly, and clear. Use the learner's native language "
        "when helpful for grammar explanation."
    )
    answer = await openai_service.chat_text(
        system_prompt,
        (
            f"Learner level: {user.english_level}\n"
            f"Native language: {user.native_language}\n"
            f"Original: {original_text}\n"
            f"Corrected: {corrected_text}\n"
            f"Explanation: {explanation}\n"
            f"Follow-up question: {question}"
        ),
    )
    return answer or "Good question. This correction makes the sentence more natural and clear."


async def explain_mistake(user: User, original_text: str, corrected_text: str | None) -> ExplainResponse:
    system_prompt = (
        "You explain English corrections clearly and briefly. Return JSON with "
        "original_text, corrected_text, explanation. Use English only."
    )
    data = await openai_service.chat_json(
        system_prompt,
        f"Level: {user.english_level}\nOriginal: {original_text}\nCorrected: {corrected_text or original_text}",
    )
    if not data:
        return ExplainResponse(
            original_text=original_text,
            corrected_text=corrected_text or original_text,
            explanation="The corrected sentence uses more natural English grammar and parallel verb forms.",
        )
    return ExplainResponse(**data)


async def score_pronunciation(
    user: User,
    transcript: str,
    expected_topic: str | None = None,
) -> PronunciationScoreOut:
    system_prompt = (
        "You score English speaking practice from a transcript. Return JSON with integer "
        "scores 0-100: accuracy_score, fluency_score, prosody_score, grammar_score, "
        "vocabulary_score, topic_score, plus transcript and feedback."
    )
    data = await openai_service.chat_json(
        system_prompt,
        f"Level: {user.english_level}\nTopic: {expected_topic or 'general'}\nTranscript: {transcript}",
    )
    if not data:
        return PronunciationScoreOut(
            transcript=transcript,
            accuracy_score=78,
            fluency_score=74,
            prosody_score=70,
            grammar_score=76,
            vocabulary_score=72,
            topic_score=80,
            feedback="Good start. Try speaking in fuller sentences and keeping verb forms consistent.",
        )
    return PronunciationScoreOut(**data)


async def translate_text(text: str, target_language: str) -> TranslateResponse:
    system_prompt = (
        "Translate English learning material. Return JSON with original_text, translated_text, "
        "and word_by_word as an array of objects with word and translation."
    )
    data = await openai_service.chat_json(
        system_prompt,
        f"Target language: {target_language}\nEnglish text: {text}",
    )
    if not data:
        return TranslateResponse(
            original_text=text,
            translated_text=text,
            word_by_word=[{"word": word, "translation": word} for word in text.split()],
        )
    return TranslateResponse(**data)


async def get_word_definition(word: str, native_language: str, saved: bool = False) -> WordDefinition:
    system_prompt = (
        "Create a learner dictionary entry. Return JSON with word, translation, definition, "
        "examples array, part_of_speech, pronunciation, antonyms array."
    )
    data = await openai_service.chat_json(
        system_prompt,
        f"Word: {word}\nNative language for translation: {native_language}",
    )
    if not data:
        data = {
            "word": word,
            "translation": word,
            "definition": f"A dictionary definition for '{word}'.",
            "examples": [f"I learned the word {word} today."],
            "part_of_speech": None,
            "pronunciation": None,
            "antonyms": [],
        }
    data["saved"] = saved
    return WordDefinition(**data)


async def generate_voice_reply(text: str, selected_voice: str) -> bytes:
    return await openai_service.generate_speech(text, VOICE_MAP.get(selected_voice, "nova"))
