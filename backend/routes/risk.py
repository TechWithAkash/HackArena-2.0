import json
from typing import List
from fastapi import APIRouter, HTTPException
from backend.db.postgres import get_db
from backend.models.health import RiskResponse

router = APIRouter()


@router.get("/risk", response_model=RiskResponse)
async def get_risk(user_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM risk_scores WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1",
            user_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="No risk data found for user")

    top_risk_factors = row["top_risk_factors"]
    if isinstance(top_risk_factors, str):
        top_risk_factors = json.loads(top_risk_factors)
    if top_risk_factors is None:
        top_risk_factors = []

    # Parse disease-specific scores stored by ensemble_service in shap_contributions
    shap_raw = row["shap_contributions"] or "{}"
    if isinstance(shap_raw, str):
        shap_raw = json.loads(shap_raw)

    return RiskResponse(
        user_id=user_id,
        risk_score=row["risk_score"],
        risk_category=row["risk_category"],
        timestamp=row["timestamp"],
        top_risk_factors=top_risk_factors,
        diabetes_risk=shap_raw.get("diabetes_risk"),
        cvd_risk=shap_raw.get("cvd_risk"),
        hypertension_risk=shap_raw.get("hypertension_risk"),
    )


@router.get("/risk/history", response_model=List[RiskResponse])
async def get_risk_history(user_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM risk_scores WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 30",
            user_id,
        )

    result = []
    for row in rows:
        top_risk_factors = row["top_risk_factors"]
        if isinstance(top_risk_factors, str):
            top_risk_factors = json.loads(top_risk_factors)
        if top_risk_factors is None:
            top_risk_factors = []

        # Parse disease scores from shap_contributions (same as main /risk endpoint)
        shap_raw = row["shap_contributions"] or "{}"
        if isinstance(shap_raw, str):
            shap_raw = json.loads(shap_raw)

        result.append(
            RiskResponse(
                user_id=user_id,
                risk_score=row["risk_score"],
                risk_category=row["risk_category"],
                timestamp=row["timestamp"],
                top_risk_factors=top_risk_factors,
                diabetes_risk=shap_raw.get("diabetes_risk"),
                cvd_risk=shap_raw.get("cvd_risk"),
                hypertension_risk=shap_raw.get("hypertension_risk"),
            )
        )

    return result
