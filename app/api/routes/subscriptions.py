from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.subscription import CreateSubscriptionRequest, CreateSubscriptionResponse, SubscriptionOut
from app.services.subscriptions import check_subscription, create_subscription_checkout

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=SubscriptionOut)
async def read_subscription(user: User = Depends(get_current_user)) -> SubscriptionOut:
    return check_subscription(user)


@router.post("/checkout", response_model=CreateSubscriptionResponse)
async def checkout(payload: CreateSubscriptionRequest) -> CreateSubscriptionResponse:
    return create_subscription_checkout(payload.plan)

