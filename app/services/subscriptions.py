from datetime import UTC, datetime, timedelta

from app.models.enums import SubscriptionPlan, SubscriptionStatus
from app.models.user import User
from app.schemas.subscription import CreateSubscriptionResponse, SubscriptionOut

PLAN_PRICES = {
    SubscriptionPlan.MONTHLY.value: 999,
    SubscriptionPlan.YEARLY.value: 4999,
}


def check_subscription(user: User) -> SubscriptionOut:
    return SubscriptionOut(
        status=user.subscription_status,
        plan=user.subscription_plan,
        expires_at=user.subscription_expires_at,
    )


def create_subscription_checkout(plan: str) -> CreateSubscriptionResponse:
    amount = PLAN_PRICES.get(plan, PLAN_PRICES[SubscriptionPlan.MONTHLY.value])
    return CreateSubscriptionResponse(
        checkout_url=f"https://payments.example.com/chattylinguo/{plan}",
        plan=plan,
        amount_cents=amount,
    )


def activate_subscription(user: User, plan: str) -> None:
    now = datetime.now(UTC)
    user.subscription_status = SubscriptionStatus.ACTIVE.value
    user.subscription_plan = plan
    user.subscription_expires_at = now + (
        timedelta(days=365) if plan == SubscriptionPlan.YEARLY.value else timedelta(days=30)
    )

