"""
Explainability Service — DarpanAI Phase 6.

Uses SHAP TreeExplainer on the XGBoost risk model to produce:
  - Per-feature SHAP values (how much each metric pushes risk up/down)
  - Human-readable explanation text per feature
  - Primary driver identification
  - Protective vs risk-increasing factor split

SHAP values are in risk-score units (0-100 scale), signed:
  positive = increases risk, negative = decreases risk.
"""

import json
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import shap

from backend.db.postgres import get_db

MODEL_PATH = Path(__file__).parent.parent / "ml" / "risk_model.pkl"
FEATURES   = ["age", "bmi", "sleep", "steps", "stress_level", "diet_score", "heart_rate"]

DENORM = {
    "heart_rate":   (40,  200),
    "steps":        (0,   20000),
    "sleep":        (0,   12),
    "bmi":          (15,  50),
    "stress_level": (1,   10),
    "diet_score":   (1,   10),
}

# Human-readable labels
FEATURE_LABELS = {
    "heart_rate":   "Heart Rate",
    "steps":        "Daily Steps",
    "sleep":        "Sleep Duration",
    "bmi":          "BMI",
    "stress_level": "Stress Level",
    "diet_score":   "Diet Quality",
    "age":          "Age",
}

# Whether higher raw value = higher risk (for explanation phrasing)
HIGHER_IS_RISKIER = {
    "heart_rate":   True,
    "steps":        False,
    "sleep":        False,
    "bmi":          True,
    "stress_level": True,
    "diet_score":   False,
    "age":          True,
}

_model     = None
_explainer = None


def _load_explainer():
    global _model, _explainer
    if _explainer is None:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        _explainer = shap.TreeExplainer(_model)
    return _explainer


def _denormalize_raw(normalized: dict, age: float = 35.0) -> dict:
    raw = {"age": age}
    for feat, (lo, hi) in DENORM.items():
        val = normalized.get(feat, 0.5)
        raw[feat] = round(lo + val * (hi - lo), 2)
    return raw


def _describe_feature(feat: str, raw_val: float, shap_val: float) -> str:
    label = FEATURE_LABELS[feat]
    direction = "increasing" if shap_val > 0 else "decreasing"
    magnitude = abs(shap_val)

    if magnitude < 1.0:
        impact = "minimal impact"
    elif magnitude < 4.0:
        impact = "moderate impact"
    else:
        impact = "significant impact"

    # Feature-specific phrasing
    if feat == "sleep":
        unit = f"{raw_val:.1f}h/night"
        good = raw_val >= 7
        note = "within healthy range" if good else "below recommended 7–9h"
    elif feat == "steps":
        unit = f"{int(raw_val):,} steps/day"
        good = raw_val >= 8000
        note = "meeting activity goals" if good else "below 8,000 step target"
    elif feat == "heart_rate":
        unit = f"{raw_val:.0f} bpm"
        good = raw_val < 80
        note = "within normal range" if good else "elevated resting rate"
    elif feat == "stress_level":
        unit = f"{raw_val:.0f}/10"
        good = raw_val <= 4
        note = "manageable" if good else "elevated — key risk driver"
    elif feat == "diet_score":
        unit = f"{raw_val:.0f}/10"
        good = raw_val >= 7
        note = "healthy diet" if good else "diet improvements recommended"
    elif feat == "bmi":
        unit = f"{raw_val:.1f}"
        good = 18.5 <= raw_val <= 24.9
        note = "healthy weight" if good else ("overweight" if raw_val >= 25 else "underweight")
    elif feat == "age":
        unit = f"{raw_val:.0f} yrs"
        good = raw_val < 45
        note = "age-related baseline"
    else:
        unit = f"{raw_val:.2f}"
        note = ""
        good = shap_val <= 0

    arrow = "↑ risk" if shap_val > 0 else "↓ risk"
    return f"{label} ({unit}, {note}) — {arrow} by {magnitude:.1f} pts [{impact}]"


def _split_factors(
    shap_values: Dict[str, float]
) -> Tuple[List[Dict], List[Dict]]:
    risk_drivers    = []
    protective      = []

    for feat, val in shap_values.items():
        entry = {"feature": feat, "label": FEATURE_LABELS[feat], "shap_value": round(val, 2)}
        if val > 0:
            risk_drivers.append(entry)
        else:
            protective.append(entry)

    risk_drivers.sort(key=lambda x: -x["shap_value"])
    protective.sort(key=lambda x: x["shap_value"])
    return risk_drivers, protective


async def explain_risk(
    user_id: str,
    log_id: str,
    normalized: dict,
    risk_score: float,
) -> Dict[str, Any]:
    explainer = _load_explainer()

    pool = get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT age FROM users WHERE user_id = $1",
            user_id,
        )
        age = float(user["age"] if user and user["age"] is not None else 35)

        raw = _denormalize_raw(normalized, age)
        X   = np.array([[raw.get(f, 0.0) for f in FEATURES]])

        shap_vals = explainer.shap_values(X)[0]
        shap_dict = {feat: round(float(v), 3) for feat, v in zip(FEATURES, shap_vals)}

        risk_drivers, protective = _split_factors(shap_dict)

        descriptions = {
            feat: _describe_feature(feat, raw[feat], shap_dict[feat])
            for feat in FEATURES
        }

        primary_driver = risk_drivers[0]["feature"] if risk_drivers else "age"

        result = {
            "shap_contributions": shap_dict,
            "risk_drivers":       risk_drivers,
            "protective_factors": protective,
            "descriptions":       descriptions,
            "primary_driver":     primary_driver,
            "base_value":         round(float(explainer.expected_value), 2),
        }

        # Write SHAP data back onto the latest risk_score row
        # IMPORTANT: merge with existing shap_contributions to preserve
        # disease risk scores (diabetes_risk, cvd_risk, hypertension_risk)
        # that were saved by compute_risk — don't overwrite them.
        existing_row = await conn.fetchrow(
            "SELECT shap_contributions FROM risk_scores WHERE user_id = $1 AND log_id = $2",
            user_id, log_id,
        )
        existing_shap = {}
        if existing_row and existing_row["shap_contributions"]:
            try:
                existing_shap = json.loads(existing_row["shap_contributions"])
            except Exception:
                existing_shap = {}

        # Merge: disease scores come first (from compute_risk), SHAP feature
        # importances are added as additional keys — disease scores WIN on conflict
        merged_shap = {**shap_dict, **{
            k: v for k, v in existing_shap.items()
            if k in ("diabetes_risk", "cvd_risk", "hypertension_risk")
        }}

        await conn.execute(
            """
            UPDATE risk_scores
            SET shap_contributions = $1,
                primary_cause      = $2
            WHERE user_id = $3
              AND log_id   = $4
            """,
            json.dumps(merged_shap),
            primary_driver,
            user_id,
            log_id,
        )

        # Store full explainability doc
        await conn.execute(
            """
            INSERT INTO explanations (
                user_id, log_id, risk_score, base_value,
                shap_contributions, risk_drivers, protective_factors,
                descriptions, primary_driver, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """,
            user_id,
            log_id,
            risk_score,
            result["base_value"],
            json.dumps(shap_dict),
            json.dumps(risk_drivers),
            json.dumps(protective),
            json.dumps(descriptions),
            primary_driver,
            datetime.now(timezone.utc),
        )

    return result
