from urllib.parse import urlencode, urlsplit, urlunsplit

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


def _mini_app_url(**params: object) -> str:
    url = str(settings.mini_app_url)
    if not params:
        return url
    parts = urlsplit(url)
    query = urlencode({key: value for key, value in params.items() if value is not None})
    separator = "&" if parts.query else ""
    return urlunsplit(parts._replace(query=f"{parts.query}{separator}{query}"))


def response_actions(message_id: int | None = None, *, allow_score: bool = False) -> InlineKeyboardMarkup:
    suffix = f":{message_id}" if message_id else ""
    buttons = [InlineKeyboardButton(text="Explain", callback_data=f"explain{suffix}")]
    if allow_score:
        buttons.append(InlineKeyboardButton(text="Score ✅", callback_data=f"score{suffix}"))
    return InlineKeyboardMarkup(inline_keyboard=[buttons])


def voice_response_actions(
    message_id: int | None = None, telegram_user_id: int | None = None
) -> InlineKeyboardMarkup:
    suffix = f":{message_id}" if message_id else ""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Text",
                    web_app=WebAppInfo(
                        url=_mini_app_url(
                            mode="text",
                            message_id=message_id,
                            telegram_user_id=telegram_user_id,
                        )
                    ),
                ),
                InlineKeyboardButton(text="Help ✅", callback_data=f"help{suffix}"),
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
            InlineKeyboardButton(text="‹", callback_data="topics:prev"),
            InlineKeyboardButton(text="›", callback_data="topics:next"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def mini_app_button(text: str = "Open", telegram_user_id: int | None = None) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=text,
                    web_app=WebAppInfo(url=_mini_app_url(telegram_user_id=telegram_user_id)),
                )
            ]
        ]
    )
