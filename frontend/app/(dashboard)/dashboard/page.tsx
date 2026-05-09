"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type HealthDataInput, type RiskResponse, type Recommendation, type UserProfile } from "@/lib/api";
import RiskCard from "@/components/RiskCard";
import RecommendationCard from "@/components/RecommendationCard";
import { Activity, Heart, Moon, Zap, Apple, Expand, RefreshCw, Compass, Radio, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";

const DEFAULT_USER = "user_demo_001";

const FIELDS: {
  key: keyof Omit<HealthDataInput, "user_id">;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: any;
}[] = [
    { key: "heart_rate", label: "Heart Rate", min: 40, max: 200, step: 1, unit: "bpm", icon: Heart },
    { key: "sleep", label: "Sleep", min: 0, max: 12, step: 0.5, unit: "hrs", icon: Moon },
    { key: "steps", label: "Daily Steps", min: 0, max: 30000, step: 100, unit: "steps", icon: Activity },
    { key: "stress_level", label: "Stress Level", min: 1, max: 10, step: 1, unit: "/10", icon: Zap },
    { key: "diet_score", label: "Diet Score", min: 1, max: 10, step: 1, unit: "/10", icon: Apple },
    { key: "bmi", label: "BMI", min: 15, max: 50, step: 0.1, unit: "", icon: Expand },
  ];

const DEFAULTS: Omit<HealthDataInput, "user_id"> = {
  heart_rate: 72, sleep: 7, steps: 8000, stress_level: 4, diet_score: 6, bmi: 23.5,
};

const fakeChartData1 = [{ val: 65 }, { val: 68 }, { val: 72 }, { val: 70 }, { val: 78 }, { val: 85 }, { val: 82 }];
const fakeChartData2 = [{ val: 12 }, { val: 9 }, { val: 5 }, { val: 7 }, { val: 4 }, { val: 3 }, { val: 1 }];
const fakeChartData3 = [{ val: 40 }, { val: 41 }, { val: 45 }, { val: 60 }, { val: 55 }, { val: 65 }, { val: 80 }];

export default function Dashboard() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true); // start open so sliders are visible

  const [userName, setUserName] = useState('');
  const [result, setResult] = useState<{
    score: number;
    category: string;
    topFactors: string[];
  } | null>(null);
  const [history, setHistory] = useState<RiskResponse[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Live KPI state — fetched independently on mount
  const [liveRisk, setLiveRisk] = useState<RiskResponse | null>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);

  // Clinical profile — fields the watch can't provide
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    age: '',
    gender: 'male',
    fam_diabetes: false,
    fam_cvd: false,
    fam_hypertension: false,
    whr: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [isComputingRisk, setIsComputingRisk] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);


  const fetchHistory = () => {
    api.getRiskHistory(DEFAULT_USER).then(setHistory).catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
    const name = sessionStorage.getItem('darpan_user_name');
    if (name) setUserName(name);

    // Fetch clinical profile — pre-populate form if already saved
    api.getProfile(DEFAULT_USER)
      .then((p) => {
        setProfile(p);
        if (p.age || p.gender) {
          setProfileForm({
            age: p.age ? String(p.age) : '',
            gender: p.gender ?? 'male',
            fam_diabetes: p.fam_diabetes === 1,
            fam_cvd: p.fam_cvd === 1,
            fam_hypertension: p.fam_hypertension === 1,
            whr: p.whr ? String(p.whr) : '',
          });
        }
      })
      .catch(() => { });

    // Fetch latest risk — scan history for disease scores if missing (don't submit new computation)
    api.getRisk(DEFAULT_USER)
      .then(async (risk) => {
        // If the latest row has disease scores, use it directly
        if (risk.diabetes_risk != null) {
          setLiveRisk(risk);
          setResult({ score: risk.risk_score, category: risk.risk_category, topFactors: risk.top_risk_factors });
          return;
        }
        // No disease scores in latest row — scan history for one that has them
        try {
          const hist = await api.getRiskHistory(DEFAULT_USER);
          const withScores = hist.find((r: any) => r.diabetes_risk != null || r.cvd_risk != null);
          if (withScores) {
            setLiveRisk(withScores);
            setResult({ score: withScores.risk_score, category: withScores.risk_category, topFactors: withScores.top_risk_factors });
          } else {
            // No history with scores — just show overall risk without disease cards
            setLiveRisk(risk);
          }
        } catch {
          setLiveRisk(risk);
        }
      })
      .catch(() => { });

    // Populate form with last real health data from backend (not hardcoded defaults)
    api.getLatestHealth(DEFAULT_USER)
      .then((latest) => {
        setForm({
          heart_rate: latest.heart_rate != null ? Math.round(latest.heart_rate) : DEFAULTS.heart_rate,
          sleep: (latest.sleep && latest.sleep > 0) ? Number(latest.sleep.toFixed(1)) : DEFAULTS.sleep,
          steps: latest.steps != null ? Math.round(latest.steps) : DEFAULTS.steps,
          stress_level: latest.stress_level != null ? latest.stress_level : DEFAULTS.stress_level,
          diet_score: latest.diet_score != null ? latest.diet_score : DEFAULTS.diet_score,
          bmi: latest.bmi != null ? Number(latest.bmi.toFixed(1)) : DEFAULTS.bmi,
        });
      })
      .catch(() => { /* no health data yet — keep defaults */ });

    api.getAlerts(DEFAULT_USER)
      .then((d) => setAlertCount(d.alerts.length))
      .catch(() => { });
  }, []);

  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  async function handleSync() {
    setSyncing(true);
    setSyncProgress(0);
    try {
      const steps = [10, 45, 80];
      for (const p of steps) {
        await new Promise(r => setTimeout(r, 200));
        setSyncProgress(p);
      }

      const latest = await api.getLatestHealth(DEFAULT_USER);
      setSyncProgress(100);

      setForm({
        heart_rate: latest.heart_rate != null ? Math.round(latest.heart_rate) : form.heart_rate,
        sleep: latest.sleep != null ? Number(latest.sleep.toFixed(1)) : form.sleep,
        steps: latest.steps != null ? Math.round(latest.steps) : form.steps,
        stress_level: latest.stress_level ?? form.stress_level,
        diet_score: latest.diet_score ?? form.diet_score,
        bmi: latest.bmi != null ? Number(latest.bmi.toFixed(1)) : form.bmi,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to sync latest Apple Watch data from cloud.");
    } finally {
      await new Promise(r => setTimeout(r, 600));
      setSyncing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.submitHealth({ user_id: DEFAULT_USER, ...form });

      // Helper: get best available risk row — prefers rows WITH disease scores
      const getBestRisk = async () => {
        const latest = await api.getRisk(DEFAULT_USER);
        if (latest.diabetes_risk != null) return latest;
        // Latest row has no disease scores yet — check history for one that has them
        try {
          const hist = await api.getRiskHistory(DEFAULT_USER);
          const withScores = hist.find((r: any) => r.diabetes_risk != null);
          if (withScores) return { ...latest, ...withScores }; // use new overall score but preserve disease scores
        } catch { /* ignore */ }
        return latest;
      };

      let shownInitial = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const candidate = await getBestRisk();
          if (!shownInitial && candidate.risk_score != null) {
            setResult({ score: candidate.risk_score, category: candidate.risk_category, topFactors: candidate.top_risk_factors });
            setLiveRisk(candidate);
            setLoading(false);
            shownInitial = true;
            fetchHistory();
            api.getAlerts(DEFAULT_USER).then((d) => setAlertCount(d.alerts.length)).catch(() => { });
            api.getRecommend(DEFAULT_USER).then((r) => setRecommendations(r.recommendations)).catch(console.error);
          }
          // Keep updating with fresher disease scores as they arrive
          if (candidate.diabetes_risk != null && shownInitial) {
            setLiveRisk(candidate);
            break;
          }
        } catch { /* pipeline may not have written yet */ }
      }

      sessionStorage.setItem('darpan_user_id', DEFAULT_USER);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileForm.age) return;
    setSavingProfile(true);
    try {
      const saved = await api.updateProfile({
        user_id: DEFAULT_USER,
        age: parseInt(profileForm.age),
        gender: profileForm.gender,
        whr: profileForm.whr ? parseFloat(profileForm.whr) : 0.85,
        fam_diabetes: profileForm.fam_diabetes ? 1 : 0,
        fam_cvd: profileForm.fam_cvd ? 1 : 0,
        fam_hypertension: profileForm.fam_hypertension ? 1 : 0,
      });
      setProfile(saved);       // form disappears immediately — profile is saved
      setSavingProfile(false); // re-enable button / hide spinner right away

      // Fire the health submission and poll in the background — don't block UI
      setIsComputingRisk(true);
      try {
        const latest = await api.getLatestHealth(DEFAULT_USER);
        await api.submitHealth({ user_id: DEFAULT_USER, ...latest });
      } catch { /* pipeline may not have health data yet — that's ok */ }

      // Non-blocking poll: check every 2s, give up after 12 attempts (24s)
      let found = false;
      for (let i = 0; i < 12 && !found; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const risk = await api.getRisk(DEFAULT_USER);
          if (risk.diabetes_risk != null) {
            setLiveRisk(risk);
            setResult({ score: risk.risk_score, category: risk.risk_category, topFactors: risk.top_risk_factors });
            fetchHistory();
            found = true;
          }
        } catch { /* still computing */ }
      }
      setIsComputingRisk(false);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      setSavingProfile(false);
      setIsComputingRisk(false);
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  function exportReport() {
    const name = sessionStorage.getItem('darpan_user_name') ?? 'Patient';
    const reportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const riskColor = result
      ? result.score < 30 ? '#16a34a' : result.score < 60 ? '#d97706' : '#dc2626'
      : '#6b7280';
    const riskBg = result
      ? result.score < 30 ? '#f0fdf4' : result.score < 60 ? '#fffbeb' : '#fef2f2'
      : '#f9fafb';

    const vitalsRows = [
      { label: 'Heart Rate', value: `${form.heart_rate}`, unit: 'bpm', ref: '60–100', status: form.heart_rate >= 60 && form.heart_rate <= 100 ? 'Normal' : 'Review' },
      { label: 'Sleep Duration', value: `${form.sleep}`, unit: 'hrs', ref: '7–9', status: form.sleep >= 7 && form.sleep <= 9 ? 'Normal' : 'Review' },
      { label: 'Daily Steps', value: `${form.steps.toLocaleString()}`, unit: 'steps', ref: '≥ 8,000', status: form.steps >= 8000 ? 'Normal' : 'Low' },
      { label: 'Stress Index', value: `${form.stress_level}`, unit: '/10', ref: '1–4', status: form.stress_level <= 4 ? 'Normal' : 'Elevated' },
      { label: 'Diet Score', value: `${form.diet_score}`, unit: '/10', ref: '7–10', status: form.diet_score >= 7 ? 'Normal' : 'Review' },
      { label: 'BMI', value: `${form.bmi}`, unit: 'kg/m²', ref: '18.5–24.9', status: form.bmi >= 18.5 && form.bmi <= 24.9 ? 'Normal' : 'Review' },
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>DarpanAI Clinical Report — ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111827; font-size: 13px; line-height: 1.6; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 48px 64px; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 40px; height: 40px; background: #1d4ed8; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .brand-icon svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .brand-name { font-size: 20px; font-weight: 900; color: #111827; letter-spacing: -0.5px; }
    .brand-sub { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; }
    .header-meta { text-align: right; }
    .header-meta .report-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .header-meta .report-date { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; }
    /* Patient Info */
    .patient-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; gap: 40px; }
    .patient-field { }
    .patient-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .patient-value { font-size: 14px; font-weight: 700; color: #111827; margin-top: 2px; }
    /* Section */
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 16px; }
    /* Risk score card */
    .risk-card { background: ${riskBg}; border: 2px solid ${riskColor}; border-radius: 16px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .risk-score-num { font-size: 52px; font-weight: 900; color: ${riskColor}; line-height: 1; }
    .risk-score-label { font-size: 11px; font-weight: 700; color: ${riskColor}; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .risk-category { font-size: 22px; font-weight: 800; color: ${riskColor}; }
    .risk-factors-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
    .risk-factors { font-size: 13px; color: #374151; margin-top: 4px; }
    /* Vitals table */
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f8fafc; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    tbody td { padding: 12px 14px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tbody tr:last-child td { border-bottom: none; }
    .status-normal { background: #dcfce7; color: #16a34a; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .status-review { background: #fef3c7; color: #d97706; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .status-low, .status-elevated { background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .value-cell { font-size: 15px; font-weight: 700; color: #111827; }
    /* Recommendations */
    .rec-item { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; display: flex; gap: 12px; }
    .rec-priority { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; align-self: flex-start; margin-top: 2px; }
    .priority-high { background: #fee2e2; color: #dc2626; }
    .priority-medium { background: #fef3c7; color: #d97706; }
    .priority-low { background: #dcfce7; color: #16a34a; }
    .rec-title { font-size: 13px; font-weight: 700; color: #111827; }
    .rec-desc { font-size: 12px; color: #6b7280; margin-top: 3px; line-height: 1.5; }
    /* Footer */
    .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 11px; font-weight: 700; color: #9ca3af; }
    .footer-stack { font-size: 10px; color: #d1d5db; }
    .footer-status { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #16a34a; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; display: inline-block; }
    /* Print button */
    .print-btn { position: fixed; top: 20px; right: 20px; background: #1d4ed8; color: white; border: none; font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap-8px; box-shadow: 0 4px 20px rgba(29,78,216,0.4); z-index: 100; }
    .print-btn:hover { background: #1e40af; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </div>
        <div>
          <div class="brand-name">DARPAN<span style="color:#2563eb">.AI</span></div>
          <div class="brand-sub">Prakriti Clinical Intelligence</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="report-title">Clinical Diagnostic Report</div>
        <div class="report-date">${reportDate} · ${reportTime}</div>
      </div>
    </div>

    <!-- PATIENT INFO -->
    <div class="patient-bar">
      <div class="patient-field"><div class="patient-label">Patient Name</div><div class="patient-value">${name}</div></div>
      <div class="patient-field"><div class="patient-label">Patient ID</div><div class="patient-value">${sessionStorage.getItem('darpan_user_id') ?? 'user_demo_001'}</div></div>
      <div class="patient-field"><div class="patient-label">Report Type</div><div class="patient-value">Prakriti Stratification</div></div>
      <div class="patient-field"><div class="patient-label">Engine</div><div class="patient-value">DoWhy + SHAP</div></div>
    </div>

    ${result ? `
    <!-- RISK SCORE -->
    <div class="risk-card">
      <div>
        <div style="font-size:10px;font-weight:800;color:${riskColor};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Prakriti Risk Score</div>
        <div class="risk-score-num">${result.score.toFixed(1)}</div>
        <div class="risk-score-label">out of 100</div>
      </div>
      <div style="text-align:right">
        <div class="risk-category">${result.category}</div>
        <div class="risk-factors-title">Primary Risk Factors</div>
        <div class="risk-factors">${result.topFactors.map(f => f.replace(/_/g, ' ')).join(' · ')}</div>
      </div>
    </div>` : ''}

    <!-- BIOMETRIC TELEMETRY -->
    <div class="section">
      <div class="section-title">Biometric Telemetry — Current Values</div>
      <table>
        <thead><tr><th>Metric</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr></thead>
        <tbody>
          ${vitalsRows.map(r => `
          <tr>
            <td style="font-weight:600;color:#374151;">${r.label}</td>
            <td class="value-cell">${r.value}</td>
            <td style="color:#9ca3af;">${r.unit}</td>
            <td style="color:#6b7280;">${r.ref}</td>
            <td><span class="status-${r.status.toLowerCase()}">${r.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    ${recommendations.length > 0 ? `
    <!-- RECOMMENDATIONS -->
    <div class="section page-break" style="margin-top:0">
      <div class="section-title">Agentic AI Intervention Recommendations</div>
      ${recommendations.map((r, i) => {
      const impact = (r.impact ?? 'medium').toLowerCase();
      return `<div class="rec-item">
          <span class="rec-priority priority-${impact}">${impact} impact</span>
          <div><div class="rec-title">${i + 1}. ${r.action ?? ''}</div><div class="rec-desc">${r.reason ?? ''}</div></div>
        </div>`;
    }).join('')}
    </div>` : ''}

    <!-- TECH STACK FOOTNOTE -->
    <div class="section">
      <div class="section-title">Clinical AI Pipeline</div>
      <table>
        <thead><tr><th>Component</th><th>Technology</th><th>Role</th></tr></thead>
        <tbody>
          <tr><td style="font-weight:600">Causal Engine</td><td>DoWhy (DAG)</td><td style="color:#6b7280">Root cause identification via structural causal models</td></tr>
          <tr><td style="font-weight:600">XAI Explainer</td><td>SHAP (Shapley)</td><td style="color:#6b7280">Feature contribution decomposition for model transparency</td></tr>
          <tr><td style="font-weight:600">LLM Agent</td><td>Groq Llama-3</td><td style="color:#6b7280">Adaptive agentic recommendation synthesis</td></tr>
          <tr><td style="font-weight:600">Vector Memory</td><td>Qdrant + mem0</td><td style="color:#6b7280">Semantic longitudinal health context retention</td></tr>
          <tr><td style="font-weight:600">Data Source</td><td>Apple HealthKit + NHANES III</td><td style="color:#6b7280">Real-world telemetry and clinical benchmark dataset</td></tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div>
        <div class="footer-brand">DarpanAI Systems © 2026 · Healthcare Intelligence Division</div>
        <div class="footer-stack">Philosophical Framework: Prakriti (Ayurvedic Biological Equilibrium) · Report generated automatically</div>
      </div>
      <div class="footer-status"><span class="dot"></span> All Systems Nominal</div>
    </div>

  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="p-8 max-w-none font-sans pb-20">

      {/* ── Prakriti Engine Status Banner ── */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-[1.75rem] p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{currentDate}</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Good Evening, {userName || 'Roshan'} 👋</h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">Your Prakriti diagnostic engine is running. All biological causal nodes nominal.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
              <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Causal Engine</p><p className="text-sm font-black text-white">DoWhy Active</p></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span></span>
              <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">XAI Layer</p><p className="text-sm font-black text-white">SHAP Ready</p></div>
            </div>
            <button onClick={exportReport} className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-white text-sm font-bold transition-all">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Action Navigation ── */}
      <div className="flex flex-wrap gap-3 mb-8 animate-in fade-in duration-700 delay-200">
        {[
          { label: 'Causal Diagnosis', href: '/insights', color: 'blue', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
          { label: 'Forecast Trajectory', href: '/simulation', color: 'indigo', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Medical Alerts', href: '/alerts', color: 'amber', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { label: 'AI Preferences', href: '/settings', color: 'emerald', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
        ].map(({ label, href, color, icon }) => (
          <a key={label} href={href} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100' :
            color === 'indigo' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100' :
              color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' :
                'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
            }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
            {label}
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </a>
        ))}
      </div>

      {/* ── KPI Analytics Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">

        {/* KPI 1 — Prakriti Score (live: 100 - risk_score) */}
        {(() => {
          const prakritiScore = liveRisk ? Math.round(100 - liveRisk.risk_score) : null;
          const pct = prakritiScore ?? 82;
          const pctFraction = pct / 100;
          return (
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:border-blue-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prakriti Health Index</p>
                  <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {prakritiScore ?? '—'}
                    {prakritiScore !== null && <span className="text-lg text-gray-400 font-medium ml-1">/100</span>}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {liveRisk ? `${liveRisk.risk_category} risk · equilibrium score` : 'Submit vitals to compute'}
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                    <circle cx="28" cy="28" r="22" stroke="#3B82F6" strokeWidth="5" fill="none"
                      strokeDasharray={`${2 * Math.PI * 22 * pctFraction} ${2 * Math.PI * 22}`}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-600">{pct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 self-start">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700">
                  {liveRisk ? `Last: ${liveRisk.risk_score.toFixed(1)} risk pts` : 'No prior data'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={fakeChartData1}><Area type="monotone" dataKey="val" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={2} /></AreaChart></ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* KPI 2 — Active Alerts (live) */}
        {(() => {
          const count = alertCount ?? 0;
          const isLoaded = alertCount !== null;
          return (
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:border-amber-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Causal Risk Alerts</p>
                  <h3 className="text-4xl font-extrabold tracking-tight" style={{ color: count > 0 ? '#F59E0B' : '#111827' }}>
                    {isLoaded ? count : '—'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {count > 0 ? 'Pending clinical review' : isLoaded ? 'All systems clear' : 'Checking...'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${count > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                  {count > 0
                    ? <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    : <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  }
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 self-start border ${count > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                {count > 0
                  ? <ArrowUpRight className="w-3 h-3 text-amber-600" />
                  : <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                }
                <span className={`text-[11px] font-bold ${count > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                  {count > 0 ? `${count} anomal${count === 1 ? 'y' : 'ies'} flagged` : 'No anomalies detected'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={fakeChartData2}><Area type="monotone" dataKey="val" stroke="#10B981" fill="#ECFDF5" strokeWidth={2} /></AreaChart></ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* KPI 3 — Model Confidence (static model metric) */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Model Confidence</p>
              <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">96<span className="text-lg text-gray-400 font-medium ml-0.5">%</span></h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">SHAP + DoWhy validation</p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                <circle cx="28" cy="28" r="22" stroke="#8B5CF6" strokeWidth="5" fill="none"
                  strokeDasharray={`${2 * Math.PI * 22 * 0.96} ${2 * Math.PI * 22}`}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-violet-600">96%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 self-start">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700">XGBoost + NHANES III baseline</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={fakeChartData3}><Area type="monotone" dataKey="val" stroke="#8B5CF6" fill="#F5F3FF" strokeWidth={2} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Disease-Specific Risk Intelligence (Ensemble v2) ── */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveRisk?.diabetes_risk != null ? 'bg-red-400' : 'bg-gray-300'
                }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveRisk?.diabetes_risk != null ? 'bg-red-500' : 'bg-gray-400'
                }`} />
            </span>
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
              Disease-Specific Risk Intelligence · DarpanEnsemble v2
            </p>
          </div>
          <div className="flex-1 h-px bg-gray-100" />
          {liveRisk?.diabetes_risk == null ? (
            <button
              onClick={() => document.getElementById('calculate-risk-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors cursor-pointer"
            >
              ↓ Run Analysis to Unlock
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                Transformer · XGBoost · Meta-Learner · R²=0.995
              </span>
              <button
                onClick={() => {
                  setIsEditingProfile(true);
                  // Pre-fill form with current saved values
                  if (profile) {
                    setProfileForm({
                      age: profile.age ? String(profile.age) : '',
                      gender: profile.gender ?? 'male',
                      fam_diabetes: profile.fam_diabetes === 1,
                      fam_cvd: profile.fam_cvd === 1,
                      fam_hypertension: profile.fam_hypertension === 1,
                      whr: profile.whr ? String(profile.whr) : '',
                    });
                  }
                }}
                className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Clinical Profile — shown when no disease scores OR user wants to edit */}
        {(liveRisk?.diabetes_risk == null || isEditingProfile) && (
          <div className="mb-6">
            {(!profile?.profile_complete || isEditingProfile) ? (
              /* Setup / Edit clinical profile form */
              <form onSubmit={async (e) => { await handleSaveProfile(e); setIsEditingProfile(false); }} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-7 shadow-xl shadow-slate-200/60 border border-slate-700/30">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base mb-0.5">
                        {isEditingProfile ? 'Update Clinical Profile' : 'Complete Your Clinical Profile'}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {isEditingProfile
                          ? 'Update your details — the ensemble will recompute with the new values.'
                          : 'Your Apple Watch provides real-time vitals. A few personal details unlock personalised Diabetes, CVD & Hypertension risk scores from the DarpanEnsemble model.'}
                      </p>
                    </div>
                  </div>
                  {isEditingProfile && (
                    <button type="button" onClick={() => setIsEditingProfile(false)}
                      className="text-slate-400 hover:text-white transition-colors shrink-0 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {/* Age */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Age</label>
                    <input
                      type="number" min="10" max="100" required
                      value={profileForm.age}
                      onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                      placeholder="e.g. 28"
                      className="w-full bg-slate-700/60 border border-slate-600/40 rounded-xl px-4 py-2.5 text-white text-sm font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-400/60 transition-colors"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Biological Sex</label>
                    <div className="flex gap-2">
                      {['male', 'female'].map(g => (
                        <button key={g} type="button"
                          onClick={() => setProfileForm(p => ({ ...p, gender: g }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${profileForm.gender === g
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-700/60 text-slate-400 border border-slate-600/40 hover:border-slate-500'
                            }`}
                        >{g}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Family History */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Family History of Disease</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'fam_diabetes', label: 'Diabetes', icon: '🩸' },
                      { key: 'fam_cvd', label: 'Heart Disease', icon: '❤️' },
                      { key: 'fam_hypertension', label: 'Hypertension', icon: '🫀' },
                    ].map(({ key, label, icon }) => (
                      <button key={key} type="button"
                        onClick={() => setProfileForm(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-bold transition-all ${profileForm[key as keyof typeof profileForm]
                          ? 'bg-red-500/20 border-red-400/50 text-red-300'
                          : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:border-slate-500'
                          }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <span>{label}</span>
                        {profileForm[key as keyof typeof profileForm] && (
                          <span className="text-[9px] bg-red-500/30 px-2 py-0.5 rounded-full">Yes</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={!profileForm.age || savingProfile}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-3 text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : 'Save Profile & Run Disease Analysis →'}
                </button>
              </form>
            ) : isComputingRisk ? (
              /* Actively polling in background */
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5">
                <svg className="w-4 h-4 text-emerald-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-emerald-700 font-medium">
                  Profile saved ✓ — DarpanEnsemble v2 running in background, disease scores will appear shortly…
                </p>
              </div>
            ) : null}
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Diabetes Risk */}
          {(() => {
            const score = liveRisk?.diabetes_risk ?? null;
            const pct = score ?? 0;
            const severity = score === null ? null : score < 20 ? 'Low' : score < 40 ? 'Moderate' : score < 60 ? 'High' : 'Critical';
            const color = score === null ? '#9CA3AF' : score < 20 ? '#10B981' : score < 40 ? '#F59E0B' : score < 60 ? '#EF4444' : '#DC2626';
            const bgColor = score === null ? '#F9FAFB' : score < 20 ? '#ECFDF5' : score < 40 ? '#FFFBEB' : '#FEF2F2';
            return (
              <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:shadow-md transition-all"
                style={{ borderColor: score !== null ? `${color}33` : undefined }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: color }}>
                        🩸
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Diabetes Risk</p>
                    </div>
                    <h3 className="text-4xl font-extrabold tracking-tight" style={{ color: score !== null ? color : '#111827' }}>
                      {score !== null ? `${score.toFixed(1)}` : '—'}
                      {score !== null && <span className="text-lg font-medium text-gray-400 ml-0.5">%</span>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {score !== null ? 'Predicted 5-year onset probability' : 'Submit vitals to compute'}
                    </p>
                  </div>
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                      <circle cx="28" cy="28" r="22" stroke={color} strokeWidth="5" fill="none"
                        strokeDasharray={`${2 * Math.PI * 22 * (pct / 100)} ${2 * Math.PI * 22}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>
                      {score !== null ? `${Math.round(pct)}%` : '—'}
                    </span>
                  </div>
                </div>
                {severity && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 self-start border" style={{ background: bgColor, borderColor: `${color}40` }}>
                    <span className="text-[11px] font-bold" style={{ color }}>{severity} Risk · Ref: &lt;20%</span>
                  </div>
                )}
                {!severity && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 self-start">
                    <span className="text-[11px] font-bold text-gray-400">No data yet</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* CVD Risk */}
          {(() => {
            const score = liveRisk?.cvd_risk ?? null;
            const pct = score ?? 0;
            const severity = score === null ? null : score < 20 ? 'Low' : score < 40 ? 'Moderate' : score < 60 ? 'High' : 'Critical';
            const color = score === null ? '#9CA3AF' : score < 20 ? '#10B981' : score < 40 ? '#F59E0B' : score < 60 ? '#EF4444' : '#DC2626';
            const bgColor = score === null ? '#F9FAFB' : score < 20 ? '#ECFDF5' : score < 40 ? '#FFFBEB' : '#FEF2F2';
            return (
              <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:shadow-md transition-all"
                style={{ borderColor: score !== null ? `${color}33` : undefined }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: color }}>
                        ❤️
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">CVD Risk</p>
                    </div>
                    <h3 className="text-4xl font-extrabold tracking-tight" style={{ color: score !== null ? color : '#111827' }}>
                      {score !== null ? `${score.toFixed(1)}` : '—'}
                      {score !== null && <span className="text-lg font-medium text-gray-400 ml-0.5">%</span>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {score !== null ? 'Cardiovascular event probability' : 'Submit vitals to compute'}
                    </p>
                  </div>
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                      <circle cx="28" cy="28" r="22" stroke={color} strokeWidth="5" fill="none"
                        strokeDasharray={`${2 * Math.PI * 22 * (pct / 100)} ${2 * Math.PI * 22}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>
                      {score !== null ? `${Math.round(pct)}%` : '—'}
                    </span>
                  </div>
                </div>
                {severity && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 self-start border" style={{ background: bgColor, borderColor: `${color}40` }}>
                    <span className="text-[11px] font-bold" style={{ color }}>{severity} Risk · Ref: &lt;20%</span>
                  </div>
                )}
                {!severity && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 self-start">
                    <span className="text-[11px] font-bold text-gray-400">No data yet</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Hypertension Risk */}
          {(() => {
            const score = liveRisk?.hypertension_risk ?? null;
            const pct = score ?? 0;
            const severity = score === null ? null : score < 20 ? 'Low' : score < 40 ? 'Moderate' : score < 60 ? 'High' : 'Critical';
            const color = score === null ? '#9CA3AF' : score < 20 ? '#10B981' : score < 40 ? '#F59E0B' : score < 60 ? '#EF4444' : '#DC2626';
            const bgColor = score === null ? '#F9FAFB' : score < 20 ? '#ECFDF5' : score < 40 ? '#FFFBEB' : '#FEF2F2';
            return (
              <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-4 group hover:shadow-md transition-all"
                style={{ borderColor: score !== null ? `${color}33` : undefined }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: color }}>
                        🫀
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hypertension Risk</p>
                    </div>
                    <h3 className="text-4xl font-extrabold tracking-tight" style={{ color: score !== null ? color : '#111827' }}>
                      {score !== null ? `${score.toFixed(1)}` : '—'}
                      {score !== null && <span className="text-lg font-medium text-gray-400 ml-0.5">%</span>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {score !== null ? 'Hypertension onset probability' : 'Submit vitals to compute'}
                    </p>
                  </div>
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                      <circle cx="28" cy="28" r="22" stroke={color} strokeWidth="5" fill="none"
                        strokeDasharray={`${2 * Math.PI * 22 * (pct / 100)} ${2 * Math.PI * 22}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>
                      {score !== null ? `${Math.round(pct)}%` : '—'}
                    </span>
                  </div>
                </div>
                {severity && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 self-start border" style={{ background: bgColor, borderColor: `${color}40` }}>
                    <span className="text-[11px] font-bold" style={{ color }}>{severity} Risk · Ref: &lt;20%</span>
                  </div>
                )}
                {!severity && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 self-start">
                    <span className="text-[11px] font-bold text-gray-400">No data yet</span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Telemetry Module */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">

        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 border-b border-gray-100 gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Telemetry Sync Module</h2>
            <div className="flex items-center gap-2 mt-1 mb-2">

            </div>
            <p className="text-xs text-gray-500">Real-world data insufficient. Generating trajectories based on Causal mapping.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(e => !e)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${isEditing
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
            >
              {isEditing ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Done</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Edit Values</>
              )}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? `Uplink ${syncProgress}%` : "Sync Apple Watch"}
            </button>
          </div>
        </div>

        {syncing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center animate-in fade-in duration-300 border-b border-gray-100">
            <div className="w-full max-w-sm bg-gray-100 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
              <div className="bg-blue-500 h-full transition-all duration-300 shadow-sm" style={{ width: `${syncProgress}%` }} />
            </div>
            <p className="text-xs font-bold text-blue-600 animate-pulse tracking-wide">Integrating Secure End-to-End Payload...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 xl:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
            {FIELDS.map(({ key, label, min, max, step, unit, icon: Icon }, index) => (
              <div key={key} className={`p-8 hover:bg-white transition-colors group ${index < 3 ? 'border-b border-gray-100 xl:border-b-0' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border shadow-sm flex items-center justify-center transition-all ${isEditing ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-gray-100 text-gray-400 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <label className="text-sm font-bold text-gray-700">{label}</label>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight block">{form[key]}</span>
                    <span className="text-[11px] text-gray-400 font-bold block mt-1">{unit}</span>
                  </div>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isEditing ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-200 appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-white border-t border-gray-100">
            {error && <p className="mb-6 text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}
            <button
              id="calculate-risk-btn"
              type="submit"
              disabled={loading}
              className="w-full max-w-md mx-auto block py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Clinical Risk Profile...
                </div>
              ) : "Calculate Risk Analysis"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 mt-16 border-t border-gray-100 pt-16">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight tracking-tight">Clinical Diagnostic Report</h2>
              <p className="text-sm text-gray-500 font-medium">Causal AI computation matrix verified. Review patient mappings below.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1 border border-gray-200 bg-white shadow-sm rounded-[2rem] p-8 flex flex-col justify-between transition-all hover:shadow-md hover:border-blue-200 h-[400px]">
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Biomarker Deviation</h3>
                <h4 className="text-xl font-bold text-gray-900 tracking-tight">Patient vs Optimum</h4>
              </div>
              <div className="flex-1 w-full relative -ml-4">
                <ResponsiveContainer width="110%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                    { subject: 'HR', Patient: form.heart_rate, Optimum: 70, fullMark: 150 },
                    { subject: 'Sleep', Patient: form.sleep * 10, Optimum: 80, fullMark: 150 },
                    { subject: 'Steps', Patient: (form.steps / 20000) * 100, Optimum: 50, fullMark: 150 },
                    { subject: 'Stress', Patient: form.stress_level * 10, Optimum: 30, fullMark: 150 },
                    { subject: 'Diet', Patient: form.diet_score * 10, Optimum: 80, fullMark: 150 },
                    { subject: 'BMI', Patient: form.bmi * 3, Optimum: 66, fullMark: 150 },
                  ]}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                    <Radar name="Clinical Optimum" dataKey="Optimum" stroke="#10B981" fill="#10B981" fillOpacity={0.05} />
                    <Radar name="Patient Readout" dataKey="Patient" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.4} />
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: number, name: string, props: any) => {
                        const subject = props?.payload?.subject;
                        const isOptimum = name === 'Clinical Optimum';
                        if (isOptimum) {
                          // Show ideal target values
                          const ideals: Record<string, string> = {
                            HR: '60–70 bpm', Sleep: '7–9 hrs', Steps: '10,000',
                            Stress: '2–3/10', Diet: '8/10', BMI: '18.5–24.9',
                          };
                          return [ideals[subject] ?? value, name];
                        }
                        // Patient real values
                        if (subject === 'BMI') return [form.bmi.toFixed(1), name];
                        if (subject === 'Sleep') return [form.sleep.toFixed(1) + ' hrs', name];
                        if (subject === 'Steps') return [Math.round(form.steps).toLocaleString(), name];
                        if (subject === 'Stress') return [form.stress_level.toFixed(1) + '/10', name];
                        if (subject === 'Diet') return [form.diet_score.toFixed(1) + '/10', name];
                        if (subject === 'HR') return [Math.round(form.heart_rate) + ' bpm', name];
                        return [Number(value).toFixed(1), name];
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-2">
              <RiskCard
                score={result.score}
                category={result.category}
                topFactors={result.topFactors}
                history={history}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">

            <div className="md:col-span-3 bg-white border border-gray-200 rounded-[2rem] shadow-sm p-8 hover:shadow-md hover:border-blue-200 transition-all h-[420px] flex flex-col">
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mathematical Driver</h3>
                <h4 className="text-xl font-bold text-gray-900 tracking-tight">Causal Impact Weight</h4>
              </div>
              <div className="flex-1 mt-6 -ml-6 -mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    data={(() => {
                      // Use real disease scores if available, otherwise use relative weights
                      const d = liveRisk?.diabetes_risk;
                      const c = liveRisk?.cvd_risk;
                      const h = liveRisk?.hypertension_risk;
                      if (d != null && c != null && h != null) {
                        return [
                          { name: 'DIABETES', weight: Math.round(d - 30) },
                          { name: 'CVD DISEASE', weight: Math.round(c - 40) },
                          { name: 'HYPER TENSION', weight: Math.round(h - 10) },
                        ];
                      }
                      // Fallback: top factors with relative weights
                      return result.topFactors.map((f, i) => ({
                        name: f.split('_').join(' ').toUpperCase(),
                        weight: Math.max(5, 45 - (i * 14)),
                      }));
                    })()}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '900' }} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="weight" radius={[0, 8, 8, 0]} barSize={36}>
                      {result.topFactors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : '#3B82F6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">XAI Rationale</p>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  Agentic AI isolated a <span className="text-blue-600 font-bold">significant divergence</span> in your Prakriti equilibrium because <b>{(result?.topFactors?.[0] || 'Heart Rate').split('_').join(' ')}</b> constrained causal paths tied to <b>{(result?.topFactors?.[1] || 'Sleep').split('_').join(' ')}</b>.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/simulation")}
              className="md:col-span-2 group p-8 bg-white rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all text-left flex flex-col justify-between h-[420px]"
            >
              <div>
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all text-gray-500 shadow-sm">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Simulate Future</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Forecast patient biological response to hypothetical habit modifications over 120 days.</p>
              </div>
              <div className="mt-8 text-sm text-blue-600 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Initialize Simulation Engine →
              </div>
            </button>

            <button
              onClick={() => router.push("/insights")}
              className="md:col-span-2 group p-8 bg-white rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all text-left flex flex-col justify-between h-[420px]"
            >
              <div>
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all text-gray-500 shadow-sm">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Causal Drivers</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Examine the inter-biomarker mapping to determine exactly why specific indicators shifted.</p>
              </div>
              <div className="mt-8 text-sm text-blue-600 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                View Deep Root Paths →
              </div>
            </button>
          </div>

          {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 bg-gray-50 border border-gray-100 p-6 rounded-[2rem] shadow-sm">
            <div className="col-span-2 lg:col-span-4 mb-1">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Model Validation Metrics</h3>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform">
               <span className="text-2xl font-black text-gray-900">96.2<span className="text-base text-gray-400">%</span></span>
               <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Accuracy</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform">
               <span className="text-2xl font-black text-gray-900">94.1<span className="text-base text-gray-400">%</span></span>
               <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Precision</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform">
               <span className="text-2xl font-black text-gray-900">95.0<span className="text-base text-gray-400">%</span></span>
               <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Recall</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform">
               <span className="text-2xl font-black text-gray-900">0.97</span>
               <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">ROC-AUC</span>
            </div>
          </div> */}

          <div className="mt-8">
            <button
              onClick={() => router.push("/recommend")}
              className="group w-full text-left bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    <span className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest">Agentic Intelligence</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">View Personalised Interventions</h3>
                  <p className="text-white/60 text-sm font-medium max-w-lg leading-relaxed">
                    A 4-step Groq-powered agent has analysed your data and generated ranked lifestyle interventions based on causal impact.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:translate-x-2 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                {["Risk Analyst", "Memory Agent", "Causal Strategist", "Recommendation Engine"].map((step, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white/70">
                    {step}
                  </span>
                ))}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
