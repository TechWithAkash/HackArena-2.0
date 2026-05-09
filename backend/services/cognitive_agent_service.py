"""
Cognitive Health Agent — DarpanAI Real-Time Agentic System.

4-step pipeline using Groq llama-3.3-70b-versatile.
Each step is a focused LLM call that builds on the previous.
Results stream in real-time via SSE so the frontend shows each
step as it actually completes — not fake delays on cached data.

Pipeline:
  Step 1 — Risk Analyst Agent       (Groq): Reads risk + SHAP → clinical summary
  Step 2 — Memory Agent             (mem0): Retrieves patterns + past interventions
  Step 3 — Causal Strategist Agent  (Groq): Root cause + intervention lever
  Step 4 — Recommendation Engine    (Groq): 3-5 ranked actions with mechanisms

Output stored in DB (agent_metadata JSONB) for the /recommend fallback.
"""

import json
import re
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, List, Optional

from groq import AsyncGroq

from backend.config import settings
from backend.db.postgres import get_db
from backend.services.memory_service import get_user_context

# ── Groq client ────────────────────────────────────────────────────────────────

_groq: Optional[AsyncGroq] = None

def _client() -> AsyncGroq:
    global _groq
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.groq_api_key)
    return _groq


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _parse_json(raw: str, default):
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    m = re.search(r"[\[\{].*[\]\}]", cleaned, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass
    return default


def _pj(val, default):
    """Parse JSONB column (asyncpg returns strings)."""
    if val is None:
        return default
    return json.loads(val) if isinstance(val, str) else val


# ── Step 1: Risk Analyst ───────────────────────────────────────────────────────

async def _step_risk_analyst(risk_row, shap_row) -> Dict:
    if not risk_row:
        return {
            "risk_summary": "No health data available yet.",
            "critical_concerns": [],
            "severity_note": "",
            "error": True,
        }

    score = round(float(risk_row["risk_score"]), 1)
    category = risk_row["risk_category"]
    top_factors = _pj(risk_row["top_risk_factors"], [])
    shap = _pj(risk_row["shap_contributions"], {}) if risk_row else {}

    shap_lines = "\n".join(
        f"  {k}: {v:+.2f} pts ({'↑ risk' if v > 0 else '↓ protective'})"
        for k, v in sorted(shap.items(), key=lambda x: -abs(x[1]))
    )

    shap_desc = ""
    if shap_row:
        drivers = _pj(shap_row["risk_drivers"], [])
        protective = _pj(shap_row["protective_factors"], [])
        driver_names = [d.get("label", d.get("feature", "")) for d in drivers[:3]]
        prot_names   = [p.get("label", p.get("feature", "")) for p in protective[:2]]
        shap_desc = (
            f"Risk drivers: {', '.join(driver_names) or 'none identified'}\n"
            f"Protective factors: {', '.join(prot_names) or 'none'}"
        )

    prompt = f"""You are a clinical health risk analyst for DarpanAI's Cognitive Health Twin system.

PATIENT HEALTH SNAPSHOT:
  Risk Score: {score}/100  Category: {category}
  Top risk factors: {', '.join(top_factors)}

SHAP EXPLAINABILITY (each metric's contribution to risk score):
{shap_lines}

{shap_desc}

Provide a concise clinical analysis. Output ONLY valid JSON:
{{
  "risk_summary": "2-sentence clinical assessment of this patient's health state, referencing actual numbers",
  "critical_concerns": ["3 specific concerns with their values, e.g. stress_level at 7/10 is the primary driver"],
  "severity_note": "one sharp observation about the most alarming metric"
}}"""

    resp = await _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "You are a clinical health risk analyst. Output only valid JSON, no markdown."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=500,
        timeout=30,
    )
    raw = resp.choices[0].message.content
    result = _parse_json(raw, {
        "risk_summary": f"Risk score {score}/100 ({category}). Top factors: {', '.join(top_factors[:2])}.",
        "critical_concerns": top_factors[:3],
        "severity_note": f"Primary driver: {risk_row.get('primary_cause', 'unknown')}",
    })
    return result


# ── Step 2: Memory Agent ───────────────────────────────────────────────────────

async def _step_memory_agent(user_id: str) -> Dict:
    ctx = await get_user_context(
        user_id,
        query="health risk interventions sleep stress steps patterns what worked",
        limit=5,
    )
    memories = ctx.get("memories", [])
    if not memories:
        return {
            "summary": "No prior health history found. Recommendations based on current data only.",
            "key_insight": "First-time analysis — no personalisation from past interventions yet.",
            "memories": [],
            "count": 0,
        }
    texts = [m.get("text", "") for m in memories if m.get("text")]
    insight = texts[0][:120] + "…" if texts else "No patterns found."
    return {
        "summary": f"Retrieved {len(memories)} relevant memories from your health history.",
        "key_insight": insight,
        "memories": texts[:3],
        "count": len(memories),
    }


# ── Step 3: Causal Strategist ──────────────────────────────────────────────────

async def _step_causal_strategist(causal_row, step1: Dict, step2: Dict) -> Dict:
    if not causal_row:
        return {
            "primary_lever": "stress_level",
            "causal_mechanism": "cortisol spike → elevated resting HR → cardiovascular stress",
            "strategy": "Target stress reduction as primary intervention — insufficient causal history for personalised analysis.",
            "second_lever": "sleep",
        }

    ranked = _pj(causal_row["ranked_factors"], [])
    primary_cause = causal_row["primary_cause"] or "stress_level"
    causal_chain = causal_row["causal_chain"] or ""

    causal_lines = "\n".join(
        f"  {r['factor']}: ATE = {r.get('ate', 0):+.3f} pts per 1σ improvement | chain: {r.get('chain', '')}"
        for r in ranked[:5] if r.get("ate")
    ) or "  Insufficient observational history — using SHAP-based priors"

    memory_context = step2.get("key_insight", "No prior history.")

    prompt = f"""You are a causal health strategist using DoWhy causal inference methodology.

RISK ANALYSIS FROM STEP 1:
  Summary: {step1.get('risk_summary', '')}
  Critical concerns: {', '.join(step1.get('critical_concerns', []))}

CAUSAL INFERENCE RESULTS (DoWhy Average Treatment Effects):
  Primary causal chain: {primary_cause} → {causal_chain}
  Ranked intervention levers (most negative ATE = biggest benefit):
{causal_lines}

PERSONAL HISTORY INSIGHT:
  {memory_context}

Determine the optimal intervention strategy. Output ONLY valid JSON:
{{
  "primary_lever": "the single highest-impact modifiable factor name",
  "causal_mechanism": "biological pathway e.g. 'reduces cortisol → lowers resting HR → reduces CV risk'",
  "strategy": "1-sentence intervention strategy for this specific patient",
  "second_lever": "secondary factor to address"
}}"""

    resp = await _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "You are a causal health strategist. Output only valid JSON, no markdown."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=400,
        timeout=30,
    )
    result = _parse_json(resp.choices[0].message.content, {
        "primary_lever": primary_cause,
        "causal_mechanism": "multi-pathway physiological cascade",
        "strategy": f"Prioritise {primary_cause} via {causal_chain}",
        "second_lever": ranked[1]["factor"] if len(ranked) > 1 else "sleep",
    })
    return result


# ── Step 4: Recommendation Engine ─────────────────────────────────────────────

async def _step_recommendation_engine(
    step1: Dict,
    step2: Dict,
    step3: Dict,
    sim_row,
    risk_row,
) -> Dict:
    # Build simulation summary
    sim_str = ""
    if sim_row:
        scenarios = _pj(sim_row["scenarios"], {})
        reductions = _pj(sim_row["projected_risk_reduction"], {})
        tl = _pj(sim_row["timeline_days"], [0, 15, 30, 45, 60, 90, 120])
        idx = {d: i for i, d in enumerate(tl)}
        for name, scores in scenarios.items():
            if scores:
                d30 = scores[idx.get(30, min(2, len(scores)-1))]
                d90 = scores[idx.get(90, min(5, len(scores)-1))]
                sim_str += f"  {name}: day-30={d30:.0f}, day-90={d90:.0f}, day-120={scores[-1]:.0f}\n"
        sim_str += f"  Projected reduction: improved={reductions.get('improved', 0):.1f}%, optimal={reductions.get('optimal', 0):.1f}%"

    memory_text = "\n".join(f"  - {m}" for m in step2.get("memories", [])[:3]) or "  No prior history."
    score = round(float(risk_row["risk_score"]), 1) if risk_row else 50

    prompt = f"""You are DarpanAI's personalized health advisor embedded in a Cognitive Health Twin system.

CLINICAL ANALYSIS:
  Risk score: {score}/100
  Summary: {step1.get('risk_summary', '')}
  Critical concerns: {'; '.join(step1.get('critical_concerns', []))}

CAUSAL STRATEGY:
  Primary intervention lever: {step3.get('primary_lever', '')}
  Biological mechanism: {step3.get('causal_mechanism', '')}
  Strategy: {step3.get('strategy', '')}
  Secondary lever: {step3.get('second_lever', '')}

SIMULATION PROJECTIONS:
{sim_str}

PERSONAL HEALTH HISTORY:
{memory_text}

RULES FOR RECOMMENDATIONS:
- SPECIFIC: "Walk 8,000 steps before 9 PM" not "exercise more"
- QUANTIFIED: cite actual numbers from the analysis above
- RANKED: priority 1 = highest expected risk reduction
- MECHANISMS: explain the biological pathway for each action
- Generate exactly 4 recommendations

Output ONLY a valid JSON array:
[
  {{
    "priority": 1,
    "action": "specific measurable action in 1 sentence",
    "reason": "why this for THIS patient, citing their actual numbers",
    "impact": "high",
    "timeframe": "2-3 weeks",
    "estimated_risk_reduction": 3.2,
    "causal_mechanism": "reduces cortisol → lowers resting HR → reduces CV risk"
  }}
]"""

    resp = await _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": "You are a personalized health advisor. Output only a valid JSON array, no markdown, no explanation."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1200,
        timeout=45,
    )
    raw = resp.choices[0].message.content
    recs = _parse_json(raw, [])

    if not isinstance(recs, list):
        recs = []

    for i, r in enumerate(recs):
        r.setdefault("priority", i + 1)
        r.setdefault("impact", "medium")
        r.setdefault("timeframe", "2-4 weeks")
        r.setdefault("estimated_risk_reduction", 0.0)
        r.setdefault("causal_mechanism", "")

    return {
        "recommendations": sorted(recs, key=lambda x: x.get("priority", 99)),
        "confidence": "high" if len(recs) >= 3 else "medium",
        "summary": f"Generated {len(recs)} personalized interventions ranked by causal impact",
    }


# ── DB persistence ─────────────────────────────────────────────────────────────

async def _store_result(
    pool,
    user_id: str,
    log_id: str,
    method: str,
    risk_score: Optional[float],
    recommendations: List,
    agent_metadata: Dict,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO recommendations
              (user_id, log_id, method, risk_score, recommendations, agent_metadata, generated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            user_id,
            log_id,
            method,
            float(risk_score) if risk_score is not None else None,
            json.dumps(recommendations),
            json.dumps(agent_metadata),
            datetime.now(timezone.utc),
        )


# ── SSE stream (primary — real-time) ──────────────────────────────────────────

async def stream_cognitive_agent(user_id: str) -> AsyncGenerator[str, None]:
    """
    Real-time SSE stream of the 4-step agent pipeline.
    Each step yields an event as it actually completes — no fake delays.
    """
    pool = get_db()

    # Resolve latest log_id
    async with pool.acquire() as conn:
        log_row = await conn.fetchrow(
            "SELECT log_id FROM health_logs WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1",
            user_id,
        )

    if not log_row:
        yield _sse({"type": "error", "message": "No health data found. Submit a check-in from the Dashboard first."})
        return

    log_id = log_row["log_id"]

    # Fetch all supporting data upfront (one DB round-trip)
    async with pool.acquire() as conn:
        risk_row  = await conn.fetchrow(
            "SELECT * FROM risk_scores WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        shap_row  = await conn.fetchrow(
            "SELECT * FROM explanations WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        causal_row = await conn.fetchrow(
            "SELECT * FROM causal_results WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        sim_row   = await conn.fetchrow(
            "SELECT * FROM simulations WHERE user_id=$1 ORDER BY generated_at DESC LIMIT 1", user_id
        )

    risk_score = float(risk_row["risk_score"]) if risk_row else None
    trace: List[Dict] = []

    # ── Step 1 ────────────────────────────────────────────────────────────────
    yield _sse({"type": "step_start", "step": 1, "agent": "Risk Analyst", "icon": "🔬",
                "description": "Reading your health profile and SHAP explainability data…"})
    try:
        step1 = await _step_risk_analyst(risk_row, shap_row)
    except Exception as e:
        print(f"[cognitive_agent] Step 1 error: {e}")
        step1 = {"risk_summary": f"Risk score {risk_score}/100. Analysis unavailable.", "critical_concerns": [], "severity_note": "", "error": True}
    trace.append({"step": 1, "agent": "Risk Analyst", "icon": "🔬",
                  "summary": step1.get("risk_summary", ""), "detail": step1})
    yield _sse({"type": "step_complete", "step": 1, "agent": "Risk Analyst",
                "summary": step1.get("risk_summary", ""), "severity": step1.get("severity_note", "")})

    # ── Step 2 ────────────────────────────────────────────────────────────────
    yield _sse({"type": "step_start", "step": 2, "agent": "Memory Agent", "icon": "🧠",
                "description": "Searching your health history for patterns and past interventions…"})
    try:
        step2 = await _step_memory_agent(user_id)
    except Exception as e:
        print(f"[cognitive_agent] Step 2 error: {e}")
        step2 = {"summary": "Memory retrieval unavailable.", "key_insight": "", "memories": [], "count": 0}
    trace.append({"step": 2, "agent": "Memory Agent", "icon": "🧠",
                  "summary": step2.get("summary", ""), "detail": step2})
    yield _sse({"type": "step_complete", "step": 2, "agent": "Memory Agent",
                "summary": step2.get("summary", ""), "insight": step2.get("key_insight", "")})

    # ── Step 3 ────────────────────────────────────────────────────────────────
    yield _sse({"type": "step_start", "step": 3, "agent": "Causal Strategist", "icon": "⚡",
                "description": "Running DoWhy causal inference to identify your primary risk lever…"})
    try:
        step3 = await _step_causal_strategist(causal_row, step1, step2)
    except Exception as e:
        print(f"[cognitive_agent] Step 3 error: {e}")
        step3 = {"primary_lever": "stress_level", "causal_mechanism": "stress → elevated HR → CV risk", "strategy": "Target stress reduction as primary intervention.", "second_lever": "sleep"}
    trace.append({"step": 3, "agent": "Causal Strategist", "icon": "⚡",
                  "summary": step3.get("strategy", ""), "detail": step3})
    yield _sse({"type": "step_complete", "step": 3, "agent": "Causal Strategist",
                "summary": step3.get("strategy", ""), "lever": step3.get("primary_lever", ""),
                "mechanism": step3.get("causal_mechanism", "")})

    # ── Step 4 ────────────────────────────────────────────────────────────────
    yield _sse({"type": "step_start", "step": 4, "agent": "Recommendation Engine", "icon": "🎯",
                "description": "Synthesising all evidence into personalised ranked interventions…"})
    try:
        step4 = await _step_recommendation_engine(step1, step2, step3, sim_row, risk_row)
    except Exception as e:
        print(f"[cognitive_agent] Step 4 error: {e}")
        step4 = {"recommendations": [], "confidence": "low", "summary": "Recommendation generation failed."}
    recs = step4.get("recommendations", [])
    trace.append({"step": 4, "agent": "Recommendation Engine", "icon": "🎯",
                  "summary": step4.get("summary", ""), "detail": {"count": len(recs)}})
    yield _sse({"type": "step_complete", "step": 4, "agent": "Recommendation Engine",
                "summary": step4.get("summary", "")})

    # ── Assemble final agent metadata ─────────────────────────────────────────
    agent_meta = {
        "reasoning": step3.get("strategy", ""),
        "primary_lever": step3.get("primary_lever", ""),
        "causal_mechanism": step3.get("causal_mechanism", ""),
        "agent_confidence": step4.get("confidence", "medium"),
        "tools_called": ["risk_analyst", "memory_agent", "causal_strategist", "recommendation_engine"],
        "n_tool_calls": 3,
        "trace": trace,
    }

    # ── Persist to DB ─────────────────────────────────────────────────────────
    try:
        await _store_result(
            pool, user_id, log_id,
            method=f"groq-agent:{settings.groq_model}",
            risk_score=risk_score,
            recommendations=recs,
            agent_metadata=agent_meta,
        )
    except Exception as e:
        print(f"[cognitive_agent] DB store failed: {e}")

    # ── Final event ───────────────────────────────────────────────────────────
    yield _sse({
        "type": "complete",
        "recommendations": recs,
        "agent": agent_meta,
        "risk_score": risk_score,
        "method": f"groq-agent:{settings.groq_model}",
    })


# ── Synchronous run (for background pipeline) ──────────────────────────────────

async def run_cognitive_agent(user_id: str, log_id: str) -> Dict[str, Any]:
    """
    Non-streaming version for the background pipeline.
    Runs all 4 steps and returns the assembled result.
    """
    pool = get_db()
    async with pool.acquire() as conn:
        risk_row   = await conn.fetchrow(
            "SELECT * FROM risk_scores WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        shap_row   = await conn.fetchrow(
            "SELECT * FROM explanations WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        causal_row = await conn.fetchrow(
            "SELECT * FROM causal_results WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1", user_id
        )
        sim_row    = await conn.fetchrow(
            "SELECT * FROM simulations WHERE user_id=$1 ORDER BY generated_at DESC LIMIT 1", user_id
        )

    risk_score = float(risk_row["risk_score"]) if risk_row else None

    step1 = await _step_risk_analyst(risk_row, shap_row)
    step2 = await _step_memory_agent(user_id)
    step3 = await _step_causal_strategist(causal_row, step1, step2)
    step4 = await _step_recommendation_engine(step1, step2, step3, sim_row, risk_row)

    recs = step4.get("recommendations", [])
    agent_meta = {
        "reasoning": step3.get("strategy", ""),
        "primary_lever": step3.get("primary_lever", ""),
        "causal_mechanism": step3.get("causal_mechanism", ""),
        "agent_confidence": step4.get("confidence", "medium"),
        "tools_called": ["risk_analyst", "memory_agent", "causal_strategist", "recommendation_engine"],
        "n_tool_calls": 3,
        "trace": [
            {"step": 1, "agent": "Risk Analyst", "icon": "🔬", "summary": step1.get("risk_summary", ""), "detail": step1},
            {"step": 2, "agent": "Memory Agent", "icon": "🧠", "summary": step2.get("summary", ""), "detail": step2},
            {"step": 3, "agent": "Causal Strategist", "icon": "⚡", "summary": step3.get("strategy", ""), "detail": step3},
            {"step": 4, "agent": "Recommendation Engine", "icon": "🎯", "summary": step4.get("summary", ""), "detail": {"count": len(recs)}},
        ],
    }

    await _store_result(pool, user_id, log_id,
                        method=f"groq-agent:{settings.groq_model}",
                        risk_score=risk_score, recommendations=recs, agent_metadata=agent_meta)

    return {
        "user_id": user_id, "log_id": log_id,
        "generated_at": datetime.now(timezone.utc),
        "method": f"groq-agent:{settings.groq_model}",
        "risk_score": risk_score,
        "recommendations": recs,
        "agent": agent_meta,
    }
