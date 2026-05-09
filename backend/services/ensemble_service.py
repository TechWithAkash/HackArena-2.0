"""
DarpanAI — Ensemble Inference Service (12-Feature ICMR Edition)
================================================================
Loads the Transformer + 3x XGBoost + meta-learner ensemble once at startup,
then exposes a fast synchronous predict() for use by risk_service.

Works on:
  - Apple M4 (CPU — fast enough for a 10MB model)
  - Any CUDA GPU
  - CPU-only (fallback)

Usage:
    from backend.services.ensemble_service import get_ensemble, predict_risk

    result = predict_risk(user_health_dict)
    # → {"diabetes_risk": 23.4, "cvd_risk": 11.2, "hypertension_risk": 18.7,
    #    "composite_risk": 19.5, "risk_category": "Low", "top_risk_factors": [...]}

IMPORTANT — macOS ARM OpenMP fix
---------------------------------
PyTorch 2.x bundles its own OpenMP (libomp). XGBoost 3.x on macOS also uses
Apple Accelerate / libomp. When both are imported in the same Python process,
a race condition in the OpenMP thread pool causes a SIGSEGV (segfault).
Setting OMP_NUM_THREADS=1 BEFORE any import serializes the thread pools
and prevents the crash. This must be the FIRST thing in this module.
"""

import os
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

import logging
import warnings
from functools import lru_cache
from pathlib import Path
from typing import Dict, Any

import numpy as np
import torch
import joblib

# Suppress noisy xgboost device warning on Mac (XGBoost was trained on CUDA,
# runs fine on CPU — it just warns about device mismatch)
warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")

from backend.ml.darpan_transformer import DarpanTransformer

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "ml"

# 12 ICMR feature columns (order must match training)
FEATURE_COLS = [
    "age", "gender", "bmi", "whr",
    "fam_diabetes", "fam_cvd", "fam_hypertension",
    "sleep_hours", "steps", "sugar_intake_g",
    "stress_level", "hrv_rmssd",
]

STATIC_DIM  = 7   # first 7 are static
DYNAMIC_DIM = 5   # last 5 vary day-to-day

CATEGORY_THRESHOLDS = [
    (0,  20,  "Low"),
    (20, 40,  "Moderate"),
    (40, 60,  "High"),
    (60, 101, "Critical"),
]


def _best_device() -> torch.device:
    """
    Returns CPU for now.

    MPS (Apple Silicon) causes a segfault when loading CUDA-trained .pth files
    with weights_only=True on PyTorch 2.x. Since DarpanTransformer is only ~10MB,
    CPU inference on M4 is ~1ms — practically instant. Re-enable MPS once the
    model is re-serialized natively by running:
        torch.save(model.state_dict(), "...icmr.pth")
    after loading on CPU once.
    """
    # TODO: Switch back to MPS after re-serializing the .pth on Mac
    # if torch.backends.mps.is_available():
    #     return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def _extract_xgb_features(x: np.ndarray) -> np.ndarray:
    """Extract hand-crafted statistical features for the XGBoost layer."""
    B    = x.shape[0]
    rows = []
    for i in range(B):
        days   = x[i]           # [30, 12]
        static = days[0, :7]    # take static from day-0 (same each day)
        dyn    = days[:, 7:]    # [30, 5] — dynamic features

        feat = list(static)
        for col_idx in range(5):
            col = dyn[:, col_idx]
            feat.extend([col.mean(), col.std(), col.min(), col.max()])
            feat.append(col[-7:].mean() - col[:7].mean())   # 7-day trend

        # Threshold counts (clinical signals)
        feat.append(float((dyn[:, 2] > 70).sum()))   # high sugar days
        feat.append(float((dyn[:, 1] < 4000).sum())) # low-steps days
        feat.append(float((dyn[:, 3] > 7).sum()))    # high stress days
        feat.append(float((dyn[:, 0] < 5.5).sum()))  # poor sleep days

        rows.append(feat)
    return np.array(rows, dtype=np.float32)


class DarpanEnsemble:
    """Loaded-once singleton that performs ensemble inference."""

    def __init__(self, transformer, xgb_diabetes, xgb_cvd, xgb_hypertension,
                 meta_learner, device):
        self.transformer      = transformer
        self.xgb_diabetes     = xgb_diabetes
        self.xgb_cvd          = xgb_cvd
        self.xgb_hypertension = xgb_hypertension
        self.meta_learner     = meta_learner
        self.device           = device

    @classmethod
    def load(cls) -> "DarpanEnsemble":
        device = _best_device()
        logger.info(f"[DarpanEnsemble] Loading models onto {device}")

        # Load the Transformer backbone
        transformer = DarpanTransformer(
            norm_mean=np.zeros(12, dtype=np.float32),
            norm_std=np.ones(12,  dtype=np.float32),
        ).to(device)
        transformer.load_state_dict(
            torch.load(
                MODEL_DIR / "darpan_sequence_model_icmr.pth",
                map_location=device,
                weights_only=True,
            )
        )
        transformer.eval()

        # XGBoost specialists (CPU-only, joblib)
        xgb_diabetes     = joblib.load(MODEL_DIR / "darpan_xgb_diabetes_icmr.pkl")
        xgb_cvd          = joblib.load(MODEL_DIR / "darpan_xgb_cvd_icmr.pkl")
        xgb_hypertension = joblib.load(MODEL_DIR / "darpan_xgb_hypertension_icmr.pkl")

        # Meta-learner (Ridge)
        meta_bundle   = joblib.load(MODEL_DIR / "darpan_meta_weights_icmr.pkl")
        meta_learner  = meta_bundle["meta_learner"]

        logger.info("[DarpanEnsemble] ✓ All models loaded successfully")
        return cls(transformer, xgb_diabetes, xgb_cvd, xgb_hypertension, meta_learner, device)

    def predict_batch(self, x: np.ndarray) -> np.ndarray:
        """
        x: float32 array [B, 30, 12]
        Returns: float32 array [B, 3] — (diabetes%, cvd%, hypertension%)
        """
        x_tensor = torch.from_numpy(x).to(self.device)

        with torch.no_grad():
            t_preds = self.transformer(x_tensor).cpu().numpy()  # [B, 3]

        x_xgb    = _extract_xgb_features(x)
        xgb_preds = np.column_stack([
            self.xgb_diabetes.predict(x_xgb),
            self.xgb_cvd.predict(x_xgb),
            self.xgb_hypertension.predict(x_xgb),
        ])                                                       # [B, 3]

        meta_input   = np.hstack([t_preds, xgb_preds])         # [B, 6]
        ensemble_out = self.meta_learner.predict(meta_input)    # [B, 3]

        return np.clip(ensemble_out, 0.0, 100.0).astype(np.float32)

    def predict_single(self, thirty_day_sequence: list) -> dict:
        """thirty_day_sequence: list of 30 dicts, each with the 12 ICMR keys."""
        x = np.array([[
            [day[k] for k in FEATURE_COLS] for day in thirty_day_sequence
        ]], dtype=np.float32)                                    # [1, 30, 12]

        out = self.predict_batch(x)
        return {
            "diabetes_risk":     round(float(out[0, 0]), 2),
            "cvd_risk":          round(float(out[0, 1]), 2),
            "hypertension_risk": round(float(out[0, 2]), 2),
        }


# ── Module-level singleton ────────────────────────────────────────────────────

_ensemble: DarpanEnsemble | None = None


def get_ensemble() -> DarpanEnsemble:
    """Returns the singleton ensemble, loading it on first call."""
    global _ensemble
    if _ensemble is None:
        _ensemble = DarpanEnsemble.load()
    return _ensemble


def build_sequence_from_snapshot(snapshot: Dict[str, Any], age: float = 35.0) -> list:
    """
    Converts a single health snapshot (from HealthDataInput / health_logs)
    into a 30-day pseudo-sequence by repeating the snapshot.

    Field mapping from DarpanAI health fields → ICMR 12 features:
      heart_rate    → hrv_rmssd (proxy: HRV ≈ 50 – |HR - 70|)
      sleep         → sleep_hours
      steps         → steps
      stress_level  → stress_level
      diet_score    → sugar_intake_g (proxy: inverse, 0-100g)
      bmi           → bmi
      age           → age (from users table)
    """
    # Derive missing ICMR fields from available DarpanAI fields
    heart_rate   = snapshot.get("heart_rate",   72.0)
    sleep_hours  = snapshot.get("sleep",         7.0)
    steps        = snapshot.get("steps",       8000.0)
    stress       = snapshot.get("stress_level",  4.0)
    diet_score   = snapshot.get("diet_score",    6.0)
    bmi          = snapshot.get("bmi",          23.5)

    # HRV proxy: healthy HR ≈ 65. Deviation = worse HRV
    hrv_rmssd = max(10.0, 65.0 - abs(heart_rate - 65.0))

    # Sugar proxy: diet_score 10 = ~5g sugar, diet_score 1 = ~100g sugar
    sugar_intake_g = round(105.0 - (diet_score * 10.0), 1)

    # Gender / family history / WHR — use neutral defaults if unavailable
    gender             = snapshot.get("gender",            0)     # 0=Female neutral if unknown
    whr                = snapshot.get("whr",              0.85)
    fam_diabetes       = snapshot.get("fam_diabetes",      0)
    fam_cvd            = snapshot.get("fam_cvd",           0)
    fam_hypertension   = snapshot.get("fam_hypertension",  0)

    day = {
        "age":               float(age),
        "gender":            float(gender),
        "bmi":               float(bmi),
        "whr":               float(whr),
        "fam_diabetes":      float(fam_diabetes),
        "fam_cvd":           float(fam_cvd),
        "fam_hypertension":  float(fam_hypertension),
        "sleep_hours":       float(sleep_hours),
        "steps":             float(steps),
        "sugar_intake_g":    float(sugar_intake_g),
        "stress_level":      float(stress),
        "hrv_rmssd":         float(hrv_rmssd),
    }
    # Repeat for 30 days (single-snapshot inference)
    return [day] * 30


def categorize(composite: float) -> str:
    for lo, hi, label in CATEGORY_THRESHOLDS:
        if lo <= composite < hi:
            return label
    return "Critical"


def predict_risk(snapshot: Dict[str, Any], age: float = 35.0) -> Dict[str, Any]:
    """
    High-level function used by risk_service.py.

    Returns:
        {
          "diabetes_risk": float,
          "cvd_risk": float,
          "hypertension_risk": float,
          "composite_risk": float,      ← weighted average for overall score
          "risk_category": str,         ← Low / Moderate / High / Critical
          "top_risk_factors": list[str]  ← top 3 drivers, human-readable
        }
    """
    ensemble = get_ensemble()
    seq      = build_sequence_from_snapshot(snapshot, age)
    raw_out  = ensemble.predict_single(seq)

    # Post-hoc calibration: dampen diabetes and CVD to realistic clinical ranges.
    # The ensemble was trained on high-risk ICMR cohorts and consistently over-predicts
    # for population-level use. A 0.73 scale brings scores into expected reference bands.
    DIABETES_SCALE = 0.73
    CVD_SCALE      = 0.73

    diabetes_risk     = round(raw_out["diabetes_risk"]     * DIABETES_SCALE, 2)
    cvd_risk          = round(raw_out["cvd_risk"]          * CVD_SCALE,      2)
    hypertension_risk = raw_out["hypertension_risk"]   # already in a realistic range

    # Composite score: weighted average (CVD is the most critical for short-term risk)
    composite_risk = round(
        0.35 * diabetes_risk + 0.40 * cvd_risk + 0.25 * hypertension_risk, 2
    )

    risk_category = categorize(composite_risk)

    # Build top_risk_factors from which individual risk is highest
    scores = {
        "diabetes":     diabetes_risk,
        "cardiovascular_disease": cvd_risk,
        "hypertension": hypertension_risk,
    }

    # Supplement with lifestyle factors based on snapshot badness
    lifestyle = {}
    heart_rate  = snapshot.get("heart_rate", 72)
    sleep       = snapshot.get("sleep", 7)
    steps       = snapshot.get("steps", 8000)
    stress      = snapshot.get("stress_level", 4)
    diet_score  = snapshot.get("diet_score", 6)
    bmi_val     = snapshot.get("bmi", 23.5)

    if stress > 6:
        lifestyle["high_stress"] = stress / 10
    if sleep < 6:
        lifestyle["poor_sleep"] = (7 - sleep) / 7
    if bmi_val > 27:
        lifestyle["elevated_bmi"] = (bmi_val - 18.5) / 36.5
    if steps < 5000:
        lifestyle["low_activity"] = 1 - (steps / 10000)
    if heart_rate > 90 or heart_rate < 55:
        lifestyle["abnormal_heart_rate"] = abs(heart_rate - 70) / 100
    if diet_score < 5:
        lifestyle["poor_diet"] = 1 - (diet_score / 10)

    all_factors = {**scores, **lifestyle}
    top_risk_factors = sorted(all_factors, key=all_factors.get, reverse=True)[:3]

    return {
        "diabetes_risk":     diabetes_risk,
        "cvd_risk":          cvd_risk,
        "hypertension_risk": hypertension_risk,
        "composite_risk":    composite_risk,
        "risk_category":     risk_category,
        "top_risk_factors":  top_risk_factors,
    }
