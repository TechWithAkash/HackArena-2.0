import json
from fastapi import APIRouter, HTTPException
from backend.db.postgres import get_db
from backend.models.health import SimulationResponse, SimulationScenarios

router = APIRouter()


@router.get("/simulate", response_model=SimulationResponse)
async def get_simulation(user_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM simulations WHERE user_id=$1 ORDER BY generated_at DESC LIMIT 1",
            user_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="No simulation found for user")

    scenarios = row["scenarios"]
    if isinstance(scenarios, str):
        scenarios = json.loads(scenarios)

    timeline_days = row["timeline_days"]
    if isinstance(timeline_days, str):
        timeline_days = json.loads(timeline_days)

    projected_risk_reduction = row["projected_risk_reduction"]
    if isinstance(projected_risk_reduction, str):
        projected_risk_reduction = json.loads(projected_risk_reduction)
    if projected_risk_reduction is None:
        projected_risk_reduction = {}

    return SimulationResponse(
        user_id=user_id,
        scenarios=SimulationScenarios(**scenarios),
        timeline_days=timeline_days,
        projected_risk_reduction=projected_risk_reduction,
    )
