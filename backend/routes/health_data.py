from fastapi import APIRouter, HTTPException, BackgroundTasks

from backend.models.health import HealthDataInput, HealthDataResponse
from backend.services.ingestion_service import ingest
from backend.services.anomaly_service import detect_anomalies
from backend.services.risk_service import compute_risk
from backend.services.explain_service import explain_risk
from backend.services.causal_service import run_causal
from backend.services.simulation_service import run_simulation
from backend.services.cognitive_agent_service import run_cognitive_agent
from backend.services.telegram_service import send_health_alert, send_anomaly_alert
from backend.db.postgres import get_db

router = APIRouter()


async def run_full_pipeline(log_id: str, user_id: str, raw: dict, normalized: dict):

    anomalies = await detect_anomalies(user_id, log_id, raw)

    risk_result = await compute_risk(user_id, log_id, normalized)
    risk_score = risk_result["risk_score"]
    risk_category = risk_result.get("risk_category", "Unknown")

    await explain_risk(user_id, log_id, normalized, risk_score)
    await run_causal(user_id, log_id, normalized)
    await run_simulation(user_id, log_id, normalized, risk_score)
    agent_result = await run_cognitive_agent(user_id, log_id)

    # Send Telegram alerts for High/Critical risk or anomalies
    try:
        if risk_category in ("High", "Critical"):
            top_factors = risk_result.get("top_risk_factors", [])
            recs = agent_result.get("recommendations", []) if agent_result else []
            anomaly_dicts = [
                {"metric": a.get("metric", ""), "message": a.get("message", ""), "severity": a.get("severity", "")}
                for a in (anomalies or [])
            ]
            await send_health_alert(user_id, risk_score, risk_category, top_factors, anomaly_dicts, recs)
        elif anomalies:
            anomaly_dicts = [
                {"metric": a.get("metric", ""), "message": a.get("message", ""), "severity": a.get("severity", "")}
                for a in anomalies
            ]
            await send_anomaly_alert(user_id, anomaly_dicts)
    except Exception as e:
        print(f"[health_data] Telegram alert failed: {e}")


@router.post("/health-data", response_model=HealthDataResponse)
async def submit_health_data(data: HealthDataInput, background_tasks: BackgroundTasks):
    try:
        result = await ingest(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    anomalies = await detect_anomalies(data.user_id, result["log_id"], result["raw"])

    background_tasks.add_task(
        run_full_pipeline,
        result["log_id"],
        data.user_id,
        result["raw"],
        result["normalized"],
    )

    return HealthDataResponse(
        log_id=result["log_id"],
        status="ingested",
        anomalies_detected=len(anomalies) > 0,
        pipeline_triggered=True,
        timestamp=result["timestamp"],
    )


@router.get("/health-data/{user_id}")
async def get_latest_health_data(user_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT heart_rate, sleep, steps, stress_level, diet_score, bmi
            FROM health_logs
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT 1
            """,
            user_id
        )
    if not row:
        raise HTTPException(status_code=404, detail="No health data found")
    return dict(row)
