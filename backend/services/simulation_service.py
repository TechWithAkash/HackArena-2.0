"""
Simulation Engine — DarpanAI Phase 5.

Generates 3 risk trajectories over 120 days by iteratively re-inferring
risk from the XGBoost model with behaviorally-modified health inputs.

Scenarios:
  current  — no behavior change (natural drift based on adherence decay)
  improved — sleep +2h, steps +3000/day, stress reduced by 2 points
  optimal  — all metrics at recommended targets
"""

import json
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

import numpy as np

from backend.db.postgres import get_db

MODEL_PATH = Path(__file__).parent.parent / "ml" / "risk_model.pkl"
META_PATH  = Path(__file__).parent.parent / "ml" / "risk_model_meta.json"
FEATURES   = ["age", "bmi", "sleep", "steps", "stress_level", "diet_score", "heart_rate"]

# Checkpoints (days) at which we compute risk
TIMELINE = [0, 15, 30, 45, 60, 90, 120]

# Optimal health targets
OPTIMAL_TARGETS = {
    "sleep":        8.0,
    "steps":        10000,
    "stress_level": 3,
    "diet_score":   8,
    "heart_rate":   65,
    "bmi":          22.5,
}

# Improved scenario deltas applied gradually
IMPROVED_DELTAS = {
    "sleep":        +2.0,
    "steps":        +3000,
    "stress_level": -2.0,
    "diet_score":   +1.5,
}

# Denorm bounds (same as risk_service)
DENORM = {
    "heart_rate":   (40,  200),
    "steps":        (0,   20000),
    "sleep":        (0,   12),
    "bmi":          (15,  50),
    "stress_level": (1,   10),
    "diet_score":   (1,   10),
}

_model = None

def _load_model():
    global _model
    if _model is None:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    return _model


def _denormalize(normalized: dict, age: float = 35.0) -> dict:
    raw = {"age": age}
    for feat, (lo, hi) in DENORM.items():
        val = normalized.get(feat, 0.5)
        raw[feat] = lo + val * (hi - lo)
    return raw


def _predict(model, raw: dict) -> float:
    X = np.array([[raw.get(f, 0.0) for f in FEATURES]])
    return float(np.clip(model.predict(X)[0], 0, 100))


def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _simulate_current(model, base: dict, days: List[int]) -> List[float]:
    """
    Natural drift: without intervention, lifestyle metrics gradually worsen
    at a realistic rate (habit decay + aging stress).
    """
    scores = []
    state = base.copy()

    for day in days:
        if day == 0:
            scores.append(round(_predict(model, state), 1))
            continue

        t = day / 120.0  # progress 0→1

        # Gradual realistic worsening
        state["sleep"]        = _clamp(base["sleep"]        - t * 0.8,       2,  12)
        state["steps"]        = _clamp(base["steps"]        - t * 800,        0, 20000)
        state["stress_level"] = _clamp(base["stress_level"] + t * 1.2,        1,  10)
        state["diet_score"]   = _clamp(base["diet_score"]   - t * 0.5,        1,  10)
        # Heart rate creeps up with stress
        state["heart_rate"]   = _clamp(base["heart_rate"]   + t * 5.0,       40, 180)

        scores.append(round(_predict(model, state), 1))

    return scores


def _simulate_improved(model, base: dict, days: List[int]) -> List[float]:
    """
    Improved: apply IMPROVED_DELTAS gradually (habit formation curve).
    Changes ramp in over first 30 days then sustain.
    Heart rate drops as activity/sleep improve.
    """
    scores = []
    state = base.copy()

    targets = {
        k: _clamp(base.get(k, 5) + v,
                  DENORM.get(k, (0, 10))[0],
                  DENORM.get(k, (0, 10))[1])
        for k, v in IMPROVED_DELTAS.items()
    }

    for day in days:
        if day == 0:
            scores.append(round(_predict(model, state), 1))
            continue

        # Sigmoid-shaped adherence ramp (people form habits gradually)
        adherence = 1 / (1 + np.exp(-0.15 * (day - 20)))

        for feat, target in targets.items():
            state[feat] = base[feat] + adherence * (target - base[feat])
            lo, hi = DENORM.get(feat, (1, 10))
            state[feat] = _clamp(state[feat], lo, hi)

        # Heart rate responds to activity and sleep improvement
        hr_improvement = adherence * 8.0
        state["heart_rate"] = _clamp(base["heart_rate"] - hr_improvement, 40, 180)

        scores.append(round(_predict(model, state), 1))

    return scores


def _simulate_optimal(model, base: dict, days: List[int]) -> List[float]:
    """
    Optimal: all factors move toward the best-possible value for this person.
    "Best" = clinical target OR current value, whichever gives lower risk.
    Higher-is-better: sleep, steps, diet_score → use max(target, current).
    Lower-is-better:  stress, heart_rate, bmi → use min(target, current).
    BMI reduces slowly (realistic 0.5 BMI units per 30 days max).
    """
    scores = []
    state = base.copy()

    # Improved scenario final values (what improved converges to)
    improved_finals = {
        k: _clamp(base.get(k, 5) + v, DENORM.get(k, (1, 10))[0], DENORM.get(k, (1, 10))[1])
        for k, v in IMPROVED_DELTAS.items()
    }

    # Build personalised optimal targets:
    # - never worse than current
    # - at least as good as what improved achieves
    # - ideally at clinical optimal
    # Higher-is-better: sleep, steps, diet → max of all three
    # Lower-is-better: stress, heart_rate → min of all three
    best_targets = {
        "sleep":        max(OPTIMAL_TARGETS["sleep"],        improved_finals.get("sleep",        base["sleep"]),        base["sleep"]),
        "steps":        max(OPTIMAL_TARGETS["steps"],        improved_finals.get("steps",        base["steps"]),        base["steps"]),
        "diet_score":   max(OPTIMAL_TARGETS["diet_score"],   improved_finals.get("diet_score",   base["diet_score"]),   base["diet_score"]),
        "stress_level": min(OPTIMAL_TARGETS["stress_level"], improved_finals.get("stress_level", base["stress_level"]), base["stress_level"]),
        "heart_rate":   min(OPTIMAL_TARGETS["heart_rate"],   base["heart_rate"]),
    }

    for day in days:
        if day == 0:
            scores.append(round(_predict(model, state), 1))
            continue

        adherence = 1 / (1 + np.exp(-0.20 * (day - 15)))

        for feat, target in best_targets.items():
            lo, hi = DENORM.get(feat, (1, 10))
            state[feat] = _clamp(
                base[feat] + adherence * (target - base[feat]),
                lo, hi,
            )

        # BMI: slow realistic reduction toward optimal, never increase
        max_reduction = (day / 30) * 0.5
        bmi_target = _clamp(base["bmi"] - max_reduction, OPTIMAL_TARGETS["bmi"], base["bmi"])
        state["bmi"] = min(bmi_target, base["bmi"])

        scores.append(round(_predict(model, state), 1))

    return scores


async def run_simulation(
    user_id: str,
    log_id: str,
    normalized: dict,
    risk_score: float,
) -> Dict[str, Any]:
    model = _load_model()

    pool = get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT age FROM users WHERE user_id = $1",
            user_id,
        )
    age = float(user["age"] if user and user["age"] is not None else 35)

    base = _denormalize(normalized, age)

    current  = _simulate_current(model, base, TIMELINE)
    improved = _simulate_improved(model, base, TIMELINE)
    optimal  = _simulate_optimal(model, base, TIMELINE)

    # Risk reduction = (day-0 score - day-120 score) / day-0 score * 100
    baseline = current[0] if current[0] > 0 else 1.0
    proj_reduced_improved = round((baseline - improved[-1]) / baseline * 100, 1)
    proj_reduced_optimal  = round((baseline - optimal[-1])  / baseline * 100, 1)

    scenarios = {
        "current":  current,
        "improved": improved,
        "optimal":  optimal,
    }
    scenario_assumptions = {
        "improved": {
            "sleep_increase_hours": IMPROVED_DELTAS["sleep"],
            "steps_increase":       IMPROVED_DELTAS["steps"],
            "stress_reduction":     abs(IMPROVED_DELTAS["stress_level"]),
        },
        "optimal": OPTIMAL_TARGETS,
    }
    projected_risk_reduction = {
        "improved": proj_reduced_improved,
        "optimal":  proj_reduced_optimal,
    }

    generated_at = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO simulations (
                user_id, based_on_log_id, scenarios, timeline_days,
                projected_risk_reduction, scenario_assumptions, generated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            user_id,
            log_id,
            json.dumps(scenarios),
            json.dumps(TIMELINE),
            json.dumps(projected_risk_reduction),
            json.dumps(scenario_assumptions),
            generated_at,
        )

    return {
        "user_id":                  user_id,
        "based_on_log_id":          log_id,
        "generated_at":             generated_at,
        "timeline_days":            TIMELINE,
        "scenarios":                scenarios,
        "scenario_assumptions":     scenario_assumptions,
        "projected_risk_reduction": projected_risk_reduction,
    }
