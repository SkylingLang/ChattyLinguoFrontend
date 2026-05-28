from datetime import datetime

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    status: str
    plan: str | None = None
    expires_at: datetime | None = None


class CreateSubscriptionRequest(BaseModel):
    plan: str


class CreateSubscriptionResponse(BaseModel):
    checkout_url: str
    plan: str
    amount_cents: int
    currency: str = "USD"

