from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.stats import StatsOut
from app.services.stats import get_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
async def read_stats(user: User = Depends(get_current_user)) -> StatsOut:
    return get_stats(user)

