import json
from fastapi import APIRouter, HTTPException
from backend.db.postgres import get_db
from backend.models.health import InsightsResponse, SHAPContributions

router = APIRouter()


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(user_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM risk_scores WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1",
            user_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="No insights found for user")

    shap = row["shap_contributions"]
    if isinstance(shap, str):
        shap = json.loads(shap)
    if not shap:
        shap = {}

    return InsightsResponse(
        user_id=user_id,
        shap_contributions=SHAPContributions(
            heart_rate=shap.get("heart_rate", 0.0),
            steps=shap.get("steps", 0.0),
            sleep=shap.get("sleep", 0.0),
            stress_level=shap.get("stress_level", 0.0),
            diet_score=shap.get("diet_score", 0.0),
            bmi=shap.get("bmi", 0.0),
        ),
        causal_chain=row["causal_chain"] or "",
        primary_cause=row["primary_cause"] or "",
    )
