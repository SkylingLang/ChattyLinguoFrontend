from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from app.core.config import get_settings

settings = get_settings()

VOICE_OPTIONS = ["Alex", "Eric", "Henry", "James", "Alexa", "Emily"]
LEVEL_OPTIONS = [
    "Beginner",
    "Elementary",
    "Pre-Intermediate",
    "Intermediate",
    "Upper-Intermediate",
    "Advanced",
    "Native",
]
TOPIC_OPTIONS = [
    "Travel and Culture",
    "Food and Cooking",
    "Music and Art",
    "Sports and Fitness",
    "Technology and Social Media",
    "Health and Wellness",
    "Education and Learning",
    "Careers and Professional Development",
    "Hobbies and Crafts",
    "Environmental Issues",
]


def response_actions(message_id: int | None = None) -> InlineKeyboardMarkup:
    suffix = f":{message_id}" if message_id else ""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Text", web_app=WebAppInfo(url=str(settings.mini_app_url))),
                InlineKeyboardButton(text="Explain", callback_data=f"explain{suffix}"),
                InlineKeyboardButton(text="Score ✅", callback_data=f"score{suffix}"),
            ]
        ]
    )


def voice_keyboard(selected: str, enabled: bool) -> InlineKeyboardMarkup:
    rows = []
    for voice in VOICE_OPTIONS:
        label = f"{voice} ✅" if enabled and voice == selected else voice
        rows.append([InlineKeyboardButton(text=label, callback_data=f"voice:{voice}")])
    rows.append([InlineKeyboardButton(text="Turn off", callback_data="voice:off")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def level_keyboard(selected: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"{level} ✅" if level == selected else level,
                    callback_data=f"level:{level}",
                )
            ]
            for level in LEVEL_OPTIONS
        ]
    )


def topics_keyboard(selected_topics: list[str]) -> InlineKeyboardMarkup:
    rows = []
    for topic in TOPIC_OPTIONS:
        label = f"{topic} ✅" if topic in selected_topics else topic
        rows.append([InlineKeyboardButton(text=label, callback_data=f"topic:{topic}")])
    rows.append(
        [
            InlineKeyboardButton(text="«", callback_data="topics:prev"),
            InlineKeyboardButton(text="»", callback_data="topics:next"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def mini_app_button(text: str = "Open") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text=text, web_app=WebAppInfo(url=str(settings.mini_app_url)))]]
    )

