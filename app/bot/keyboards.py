from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from app.core.config import get_settings

settings = get_settings()

VOICE_OPTIONS = ["Alex", "Eric", "Henry", "James", "Alexa", "Emily"]
VOICE_SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5]
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

BUTTON_TEXT = {
    "en": {
        "explain": "Explain",
        "score": "Score",
        "text": "Text",
        "help": "Help",
        "open_analysis": "Open analysis",
        "checked": "✅",
    },
    "ru": {
        "explain": "Объяснить",
        "score": "Оценка",
        "text": "Текст",
        "help": "Помощь",
        "open_analysis": "Открыть анализ",
        "checked": "✅",
    },
}


def button_text(interface_language: str | None, key: str) -> str:
    return BUTTON_TEXT.get(interface_language or "en", BUTTON_TEXT["en"])[key]


def _mini_app_url(**params: object) -> str:
    url = str(settings.mini_app_url)
    if not params:
        return url
    parts = urlsplit(url)
    existing_params = dict(parse_qsl(parts.query, keep_blank_values=True))
    for stale_key in ("mode", "message_id", "telegram_user_id"):
        existing_params.pop(stale_key, None)
    existing_params.update({key: str(value) for key, value in params.items() if value is not None})
    return urlunsplit(parts._replace(query=urlencode(existing_params)))


def response_actions(
    message_id: int | None = None,
    *,
    telegram_user_id: int | None = None,
    has_correction: bool = False,
    allow_score: bool = False,
    interface_language: str | None = None,
) -> InlineKeyboardMarkup:
    suffix = f":{message_id}" if message_id else ""
    explain_label = button_text(interface_language, "explain")
    if has_correction:
        explain_button = InlineKeyboardButton(
            text=explain_label,
            web_app=WebAppInfo(
                url=_mini_app_url(
                    mode="explain",
                    message_id=message_id,
                    telegram_user_id=telegram_user_id,
                )
            ),
        )
    else:
        explain_button = InlineKeyboardButton(text=explain_label, callback_data=f"explain{suffix}")
    buttons = [explain_button]
    if allow_score:
        buttons.append(
            InlineKeyboardButton(
                text=button_text(interface_language, "score"),
                web_app=WebAppInfo(
                    url=_mini_app_url(
                        mode="score",
                        message_id=message_id,
                        telegram_user_id=telegram_user_id,
                    )
                ),
            )
        )
    return InlineKeyboardMarkup(inline_keyboard=[buttons])


def voice_response_actions(
    message_id: int | None = None,
    telegram_user_id: int | None = None,
    *,
    help_checked: bool = False,
    interface_language: str | None = None,
) -> InlineKeyboardMarkup:
    suffix = f":{message_id}" if message_id else ""
    help_text = button_text(interface_language, "help")
    help_label = f"{help_text} {button_text(interface_language, 'checked')}" if help_checked else help_text
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=button_text(interface_language, "text"),
                    web_app=WebAppInfo(
                        url=_mini_app_url(
                            mode="text",
                            message_id=message_id,
                            telegram_user_id=telegram_user_id,
                        )
                    ),
                ),
                InlineKeyboardButton(text=help_label, callback_data=f"help{suffix}"),
            ]
        ]
    )


def analysis_button(
    message_id: int, telegram_user_id: int, interface_language: str | None = None
) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=button_text(interface_language, "open_analysis"),
                    web_app=WebAppInfo(
                        url=_mini_app_url(
                            mode="score",
                            message_id=message_id,
                            telegram_user_id=telegram_user_id,
                        )
                    ),
                )
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


def voice_speed_keyboard(selected: float) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"{speed:g}x ✅" if abs(speed - selected) < 0.001 else f"{speed:g}x",
                    callback_data=f"voice_speed:{speed}",
                )
            ]
            for speed in VOICE_SPEED_OPTIONS
        ]
    )


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
