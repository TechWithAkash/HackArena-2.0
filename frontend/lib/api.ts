const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export interface RiskResponse {
  user_id: string;
  log_id: string;
  risk_score: number;
  risk_category: "Low" | "Moderate" | "High" | "Critical";
  top_risk_factors: string[];
  shap_contributions: Record<string, number>;
  timestamp: string;
  // Ensemble v2 disease-specific scores
  diabetes_risk?: number | null;
  cvd_risk?: number | null;
  hypertension_risk?: number | null;
}

export interface SimulationResponse {
  user_id: string;
  scenarios: { current: number[]; improved: number[]; optimal: number[] };
  timeline_days: number[];
  projected_risk_reduction: { improved: number; optimal: number };
  generated_at: string;
}

export interface Recommendation {
  priority: number;
  action: string;
  reason: string;
  impact: "high" | "medium" | "low";
  timeframe: string;
  estimated_risk_reduction?: number | null;
  causal_mechanism?: string | null;
}

export interface AgentTraceStep {
  step: number;
  type: "tool_call" | "synthesis";
  tool?: string;
  query?: Record<string, unknown>;
  summary?: string;
  content?: string;
}

export interface AgentMeta {
  reasoning: string;
  primary_lever: string;
  agent_confidence: "high" | "medium" | "low";
  tools_called: string[];
  n_tool_calls: number;
  trace: AgentTraceStep[];
}

export interface RecommendResponse {
  user_id: string;
  recommendations: Recommendation[];
  risk_score?: number | null;
  method?: string;
  generated_at?: string;
  agent?: AgentMeta;
}

export interface InsightsFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface InsightsResponse {
  user_id: string;
  shap_contributions: Record<string, number>;
  primary_cause?: string;
  causal_chain?: string;
  // computed on the frontend from shap_contributions
  risk_drivers?: InsightsFactor[];
  protective_factors?: InsightsFactor[];
}

export interface Alert {
  id: string;
  metric: string;
  severity: string;
  message: string;
  value: number;
  timestamp?: string;
}

export interface AlertsResponse {
  user_id: string;
  alerts: Alert[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  timestamp: string;
}

export interface HealthDataInput {
  user_id: string;
  heart_rate: number;
  sleep: number;
  steps: number;
  stress_level: number;
  diet_score: number;
  bmi: number;
}

export interface MemoryItem {
  id: string;
  memory: string;
  metadata?: any;
}

export interface MemoryResponse {
  user_id: string;
  memories: MemoryItem[];
}

export interface DocSession {
  session_id: string;
  filename: string;
  chunk_count: number;
  preview: string;
}

export interface UserProfile {
  user_id: string;
  age?: number | null;
  gender?: string | null;
  whr?: number | null;
  fam_diabetes?: number | null;
  fam_cvd?: number | null;
  fam_hypertension?: number | null;
  profile_complete?: boolean;
}

export const api = {
  submitHealth: (data: HealthDataInput) =>
    post<{ log_id: string; status: string }>("/health-data", data),
  getRisk: (userId: string) =>
    get<RiskResponse>(`/risk?user_id=${encodeURIComponent(userId)}`),
  getRiskHistory: (userId: string) =>
    get<RiskResponse[]>(`/risk/history?user_id=${encodeURIComponent(userId)}`),
  getSimulation: (userId: string) =>
    get<SimulationResponse>(`/simulate?user_id=${encodeURIComponent(userId)}`),
  getRecommend: (userId: string) =>
    get<RecommendResponse>(`/recommend?user_id=${encodeURIComponent(userId)}`),
  getInsights: (userId: string) =>
    get<InsightsResponse>(`/insights?user_id=${encodeURIComponent(userId)}`),
  getAlerts: (userId: string) =>
    get<AlertsResponse>(`/alerts?user_id=${encodeURIComponent(userId)}`),
  chat: (userId: string, message: string, history: ChatMessage[]) =>
    post<ChatResponse>("/chat", { user_id: userId, message, history }),
  acknowledgeAlert: (alertId: string) =>
    post<{ status: string }>(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, {}),
  getMemories: (userId: string) =>
    get<MemoryResponse>(`/memory/${encodeURIComponent(userId)}`),
  clearMemories: (userId: string) =>
    del<{ status: string }>(`/memory/${encodeURIComponent(userId)}`),
  getLatestHealth: (userId: string) =>
    get<HealthDataInput>(`/health-data/${encodeURIComponent(userId)}`),
  getProfile: (userId: string) =>
    get<UserProfile>(`/profile?user_id=${encodeURIComponent(userId)}`),
  updateProfile: (data: UserProfile) =>
    post<UserProfile>("/profile", data),
};
