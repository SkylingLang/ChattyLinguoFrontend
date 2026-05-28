from app.models.user import User
from app.schemas.stats import StatsOut


def get_stats(user: User) -> StatsOut:
    return StatsOut(
        word_count=user.word_count,
        current_streak=user.current_streak,
        maximum_streak=user.maximum_streak,
        messages_count=user.messages_count,
        voice_messages_count=user.voice_messages_count,
        practice_days=user.practice_days,
        last_active_date=user.last_active_date,
        correct_percent=0,
    )

