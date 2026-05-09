from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class HealthDataInput(BaseModel):
    user_id: str
    heart_rate: float = Field(..., ge=30, le=250, description="BPM")
    steps: float = Field(..., ge=0, le=100000, description="Daily steps")
    sleep: float = Field(..., ge=0, le=24, description="Hours of sleep")
    bmi: float = Field(..., ge=10, le=70, description="Body Mass Index")
    stress_level: float = Field(..., ge=1, le=10, description="Stress 1-10")
    diet_score: float = Field(..., ge=1, le=10, description="Diet quality 1-10")
    systolic_bp: Optional[float] = Field(None, ge=70, le=250)
    diastolic_bp: Optional[float] = Field(None, ge=40, le=150)
    blood_oxygen: Optional[float] = Field(None, ge=70, le=100)
    active_minutes: Optional[float] = Field(None, ge=0, le=1440)
    water_intake_ml: Optional[float] = Field(None, ge=0, le=10000)
    source: str = Field(default="manual", pattern="^(manual|apple_health|google_fit)$")


class HealthDataResponse(BaseModel):
    log_id: str
    status: str
    anomalies_detected: bool
    pipeline_triggered: bool
    timestamp: datetime


class RiskResponse(BaseModel):
    user_id: str
    risk_score: float
    risk_category: str
    timestamp: datetime
    top_risk_factors: List[str]
    # Ensemble v2 disease-specific scores (optional for backward compat)
    diabetes_risk: Optional[float] = None
    cvd_risk: Optional[float] = None
    hypertension_risk: Optional[float] = None


class SimulationScenarios(BaseModel):
    current: List[float]
    improved: List[float]
    optimal: List[float]


class SimulationResponse(BaseModel):
    user_id: str
    scenarios: SimulationScenarios
    timeline_days: List[int]
    projected_risk_reduction: dict


class SHAPContributions(BaseModel):
    heart_rate: float
    steps: float
    sleep: float
    stress_level: float
    diet_score: float
    bmi: float


class InsightsResponse(BaseModel):
    user_id: str
    shap_contributions: SHAPContributions
    causal_chain: str
    primary_cause: str


class Recommendation(BaseModel):
    priority: int
    action: str
    reason: str
    impact: str
    timeframe: str
    estimated_risk_reduction: Optional[float] = None
    causal_mechanism: Optional[str] = None


class AgentTraceStep(BaseModel):
    step: int
    type: str  # "tool_call" | "synthesis"
    tool: Optional[str] = None
    query: Optional[dict] = None
    summary: Optional[str] = None
    content: Optional[str] = None


class AgentMeta(BaseModel):
    reasoning: str
    primary_lever: str
    agent_confidence: str  # "high" | "medium" | "low"
    tools_called: List[str]
    n_tool_calls: int
    trace: List[AgentTraceStep]


class RecommendResponse(BaseModel):
    user_id: str
    recommendations: List[Recommendation]
    method: Optional[str] = None
    risk_score: Optional[float] = None
    generated_at: Optional[datetime] = None
    agent: Optional[AgentMeta] = None


class Alert(BaseModel):
    id: str
    metric: str
    value: float
    severity: str
    message: str
    timestamp: datetime


class AlertsResponse(BaseModel):
    user_id: str
    alerts: List[Alert]
