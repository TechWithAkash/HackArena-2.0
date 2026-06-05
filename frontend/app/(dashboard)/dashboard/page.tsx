"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, type HealthDataInput, type RiskResponse, type Recommendation, type UserProfile } from "@/lib/api";
import { 
  Heart, Moon, Zap, Activity, Radio, Compass, Bell, Shield, 
  Printer, ArrowUpRight, ChevronRight, RefreshCw, Sparkles, LogIn 
} from "lucide-react";
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line
} from "recharts";

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
  { key: "sleep", label: "Sleep Duration", min: 0, max: 12, step: 0.5, unit: "hrs", icon: Moon },
  { key: "steps", label: "Daily Steps", min: 0, max: 30000, step: 100, unit: "steps", icon: Activity },
  { key: "stress_level", label: "Stress Level", min: 1, max: 10, step: 1, unit: "/10", icon: Zap },
  { key: "diet_score", label: "Diet Score", min: 1, max: 10, step: 1, unit: "/10", icon: Sparkles },
  { key: "bmi", label: "BMI", min: 15, max: 50, step: 0.1, unit: "kg/m²", icon: Activity },
];

const DEFAULTS: Omit<HealthDataInput, "user_id"> = {
  heart_rate: 72, sleep: 7, steps: 8000, stress_level: 4, diet_score: 6, bmi: 23.5,
};

export default function Dashboard() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  const [userName, setUserName] = useState('');
  const [result, setResult] = useState<{
    score: number;
    category: string;
    topFactors: string[];
  } | null>(null);
  const [history, setHistory] = useState<RiskResponse[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [liveRisk, setLiveRisk] = useState<RiskResponse | null>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);

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
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const fetchHistory = () => {
    api.getRiskHistory(DEFAULT_USER).then(setHistory).catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
    const name = sessionStorage.getItem('darpan_user_name');
    if (name) setUserName(name);

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

    api.getRisk(DEFAULT_USER)
      .then(async (risk) => {
        if (risk.diabetes_risk != null) {
          setLiveRisk(risk);
          setResult({ score: risk.risk_score, category: risk.risk_category, topFactors: risk.top_risk_factors });
          return;
        }
        try {
          const hist = await api.getRiskHistory(DEFAULT_USER);
          const withScores = hist.find((r: any) => r.diabetes_risk != null || r.cvd_risk != null);
          if (withScores) {
            setLiveRisk(withScores);
            setResult({ score: withScores.risk_score, category: withScores.risk_category, topFactors: withScores.top_risk_factors });
          } else {
            setLiveRisk(risk);
          }
        } catch {
          setLiveRisk(risk);
        }
      })
      .catch(() => { });

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
      .catch(() => { });

    api.getAlerts(DEFAULT_USER)
      .then((d) => setAlertCount(d.alerts.length))
      .catch(() => { });
  }, []);

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

      const getBestRisk = async () => {
        const latest = await api.getRisk(DEFAULT_USER);
        if (latest.diabetes_risk != null) return latest;
        try {
          const hist = await api.getRiskHistory(DEFAULT_USER);
          const withScores = hist.find((r: any) => r.diabetes_risk != null);
          if (withScores) return { ...latest, ...withScores };
        } catch { }
        return latest;
      };

      let shownInitial = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
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
          if (candidate.diabetes_risk != null && shownInitial) {
            setLiveRisk(candidate);
            break;
          }
        } catch { }
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
      setProfile(saved);
      setSavingProfile(false);

      setIsComputingRisk(true);
      try {
        const latest = await api.getLatestHealth(DEFAULT_USER);
        await api.submitHealth(latest);
      } catch { }

      let found = false;
      for (let i = 0; i < 6 && !found; i++) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          const risk = await api.getRisk(DEFAULT_USER);
          if (risk.diabetes_risk != null) {
            setLiveRisk(risk);
            setResult({ score: risk.risk_score, category: risk.risk_category, topFactors: risk.top_risk_factors });
            fetchHistory();
            found = true;
          }
        } catch { }
      }
      setIsComputingRisk(false);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      setSavingProfile(false);
      setIsComputingRisk(false);
    }
  }

  function exportReport() {
    const name = sessionStorage.getItem('darpan_user_name') ?? 'Roshan';
    const reportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const riskColor = result
      ? result.score < 30 ? '#00D4A0' : result.score < 60 ? '#F5A623' : '#E5534B'
      : '#4A5168';
    const riskBg = '#111318';

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
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; background: #0A0C10; color: #F0F2F7; font-size: 13px; line-height: 1.6; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #0A0C10 !important; color: #F0F2F7 !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .page { max-width: 800px; margin: 0 auto; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #1E2330; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-name { font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 600; color: #fff; }
    .brand-sub { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #00D4A0; text-transform: uppercase; letter-spacing: 1.5px; }
    .header-meta { text-align: right; }
    .header-meta .report-title { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B92A5; text-transform: uppercase; }
    .header-meta .report-date { font-size: 13px; font-weight: 500; color: #F0F2F7; margin-top: 4px; }
    .patient-bar { background: #111318; border: 1px solid #1E2330; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; gap: 40px; }
    .patient-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #4A5168; text-transform: uppercase; }
    .patient-value { font-size: 14px; font-weight: 500; color: #F0F2F7; margin-top: 2px; }
    .section { margin-bottom: 28px; }
    .section-title { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #00D4A0; text-transform: uppercase; border-bottom: 1px solid #1E2330; padding-bottom: 8px; margin-bottom: 16px; }
    .risk-card { background: #111318; border: 1px solid #1E2330; border-radius: 12px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .risk-score-num { font-family: 'IBM Plex Mono', monospace; font-size: 52px; font-weight: 600; color: #fff; line-height: 1; }
    .risk-score-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B92A5; text-transform: uppercase; margin-top: 4px; }
    .risk-category { font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 600; color: ${riskColor}; }
    .risk-factors-title { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B92A5; text-transform: uppercase; margin-top: 6px; }
    .risk-factors { font-size: 13px; color: #8B92A5; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #111318; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8B92A5; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1px solid #1E2330; }
    tbody td { padding: 12px 14px; border-bottom: 1px solid #1E2330; font-size: 13px; color: #F0F2F7; }
    .status-normal { color: #00D4A0; font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; }
    .status-review { color: #F5A623; font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; }
    .status-low, .status-elevated { color: #E5534B; font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; }
    .value-cell { font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 600; color: #fff; }
    .footer { border-top: 1px solid #1E2330; padding-top: 20px; margin-top: 32px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 11px; color: #8B92A5; }
    .footer-stack { font-size: 10px; color: #4A5168; }
    .footer-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #00D4A0; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #00D4A0; display: inline-block; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #4F8EF7; color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; z-index: 100; }
    .print-btn:hover { background: #3b7ad6; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div>
          <div class="brand-name">DARPAN.AI</div>
          <div class="brand-sub">Prakriti Clinical Intelligence</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="report-title">Clinical Diagnostic Report</div>
        <div class="report-date">${reportDate} · ${reportTime}</div>
      </div>
    </div>

    <div class="patient-bar">
      <div class="patient-field"><div class="patient-label">Patient Name</div><div class="patient-value">${name}</div></div>
      <div class="patient-field"><div class="patient-label">Patient ID</div><div class="patient-value">${sessionStorage.getItem('darpan_user_id') ?? 'user_demo_001'}</div></div>
      <div class="patient-field"><div class="patient-label">Report Type</div><div class="patient-value">Prakriti Stratification</div></div>
      <div class="patient-field"><div class="patient-label">Engine</div><div class="patient-value">DoWhy + SHAP</div></div>
    </div>

    ${result ? `
    <div class="risk-card">
      <div>
        <div style="font-size:10px;font-family:'IBM Plex Mono',monospace;color:#8B92A5;text-transform:uppercase;margin-bottom:8px;">Prakriti Risk Score</div>
        <div class="risk-score-num">${result.score.toFixed(1)}</div>
        <div class="risk-score-label">out of 100</div>
      </div>
      <div style="text-align:right">
        <div class="risk-category">${result.category}</div>
        <div class="risk-factors-title">Primary Risk Factors</div>
        <div class="risk-factors">${result.topFactors.map(f => f.replace(/_/g, ' ')).join(' · ')}</div>
      </div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Biometric Telemetry — Current Values</div>
      <table>
        <thead><tr><th>Metric</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr></thead>
        <tbody>
          ${vitalsRows.map(r => `
          <tr>
            <td style="font-weight:500;color:#F0F2F7;">${r.label}</td>
            <td class="value-cell">${r.value}</td>
            <td style="color:#8B92A5;">${r.unit}</td>
            <td style="color:#4A5168;">${r.ref}</td>
            <td><span class="status-${r.status.toLowerCase()}">${r.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

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

  const staticDate = "09/05/2026";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* ── Top Header Bar ── */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-main"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-white font-display">
            Good evening, {userName || 'Roshan'} 👋
          </h1>
          <p className="text-[12px] font-mono text-text-secondary tracking-tight">
            <span className="text-success inline-block w-2 h-2 rounded-full bg-success mr-2 live-dot" />
            SYSTEM NOMINAL // COGNITIVE DETECTOR ACTIVE // CAUSAL SHAP ATTRIBUTION READY
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-bg-surface border border-border-main text-[11px] font-mono text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-primary live-dot" />
              DoWhy Active
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-bg-surface border border-border-main text-[11px] font-mono text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-success live-dot" />
              SHAP Ready
            </div>
          </div>
          
          <button 
            onClick={exportReport}
            className="px-4 h-9 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer size={14} /> 
            Export PDF
          </button>
        </div>
      </motion.div>

      {/* ── Page 1 — Patient Vitals Dashboard Grid ── */}
      
      {/* Header Stats Row (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 — Prakriti Health Index */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors duration-200 card-animate flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              PRAKRITI HEALTH INDEX
            </div>
            <div className="flex items-baseline">
              <span className="text-48 font-semibold text-white font-mono leading-none">
                {liveRisk ? Math.round(100 - liveRisk.risk_score) : '68'}
              </span>
              <span className="text-24 text-text-secondary font-mono">/100</span>
            </div>
            <p className="text-[12px] text-text-secondary font-body">
              {liveRisk ? `${liveRisk.risk_category} risk` : 'Moderate risk'} · equilibrium score
            </p>
          </div>
          
          <div className="relative w-[80px] h-[80px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="#1E2330" strokeWidth="5.5" fill="none" />
              <motion.circle 
                cx="40" 
                cy="40" 
                r="34" 
                stroke="#4F8EF7" 
                strokeWidth="5.5" 
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - (liveRisk ? (100 - liveRisk.risk_score) : 68) / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round" 
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-primary font-mono">
              {liveRisk ? Math.round(100 - liveRisk.risk_score) : '68'}%
            </span>
          </div>
        </div>

        {/* Card 2 — Causal Risk Alerts */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors duration-200 card-animate flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              CAUSAL RISK ALERTS
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell size={20} className="text-warning" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warning live-dot" />
              </div>
              <span className="px-2.5 py-1 bg-warning/10 border border-warning/20 text-warning text-[11px] font-semibold rounded-md font-mono">
                {alertCount ?? 20} anomalies flagged
              </span>
            </div>
            <p className="text-[12px] text-text-secondary">
              Pending clinical review
            </p>
          </div>
        </div>

        {/* Card 3 — Model Confidence */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors duration-200 card-animate flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              MODEL CONFIDENCE
            </div>
            <div className="text-32 font-semibold text-success font-mono leading-none">
              96%
            </div>
            <p className="text-[12px] text-text-secondary">
              SHAP + DoWhy validation
            </p>
            <div className="inline-block px-2 py-0.5 bg-[#181C24] border border-border-main text-[9px] text-text-secondary font-mono rounded">
              XGBoost + NHANES III baseline
            </div>
          </div>

          <div className="relative w-[80px] h-[80px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="#1E2330" strokeWidth="5.5" fill="none" />
              <motion.circle 
                cx="40" 
                cy="40" 
                r="34" 
                stroke="#00D4A0" 
                strokeWidth="5.5" 
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - 96 / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round" 
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-success font-mono">
              96%
            </span>
          </div>
        </div>
      </div>

      {/* Disease Risk Cards Row (3 cards — Diabetes / CVD / Hypertension) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'diabetes_risk', title: 'Diabetes Risk', defaultVal: 32.4 },
          { key: 'cvd_risk', title: 'CVD Disease Risk', defaultVal: 45.6 },
          { key: 'hypertension_risk', title: 'Hypertension Risk', defaultVal: 18.2 }
        ].map(({ key, title, defaultVal }) => {
          const score = liveRisk ? (liveRisk[key as keyof RiskResponse] as number | null) : null;
          const hasVal = score !== null;
          const val = hasVal ? score : defaultVal;
          
          // Color & Tier Setup
          const tier = val > 40 ? "HIGH RISK" : val > 20 ? "MODERATE RISK" : "LOW RISK";
          const colorClass = val > 40 ? "text-danger" : val > 20 ? "text-warning" : "text-success";
          const bgClass = val > 40 ? "bg-danger" : val > 20 ? "bg-warning" : "bg-success";
          const glowColor = val > 40 ? "rgba(229,83,75,0.15)" : val > 20 ? "rgba(245,166,35,0.15)" : "rgba(0,212,160,0.15)";
          
          return (
            <div 
              key={key}
              style={{ transition: 'all 200ms ease' }}
              className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover relative overflow-hidden group flex flex-col justify-between min-h-[160px]"
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 16px 2px ${glowColor}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold text-success uppercase tracking-wider font-mono">
                  {title}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-semibold ${
                  val > 40 ? 'bg-danger/10 text-danger border border-danger/20' : 
                  val > 20 ? 'bg-warning/10 text-warning border border-warning/20' : 
                  'bg-success/10 text-success border border-success/20'
                }`}>
                  {tier}
                </span>
              </div>

              <div className="my-3">
                <span className="text-36 font-semibold text-white font-mono leading-none">
                  {val.toFixed(1)}%
                </span>
                <div className="w-full bg-[#1E2330] h-1 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${bgClass}`}
                  />
                </div>
              </div>

              {!hasVal && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full text-center py-1.5 border border-dashed border-border-main hover:border-primary text-[10px] text-text-secondary hover:text-white rounded transition-colors font-mono uppercase"
                >
                  Submit vitals to compute
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Telemetry Sync Module */}
      <div className="bg-bg-surface border border-border-main rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-20 font-semibold text-white font-display">Telemetry Sync</h2>
            <p className="text-xs text-text-secondary mt-0.5">Adjust wearable telemetry streams to recalculate system models live.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 bg-bg-elevated border border-border-main text-text-secondary hover:text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              {isEditing ? 'Done' : 'Edit Inputs'}
            </button>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 bg-[#181C24] hover:bg-[#1E2330] border border-border-main text-primary text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              Sync Apple Watch
            </button>
          </div>
        </div>

        {/* Sync Progress line */}
        {syncing && (
          <div className="w-full bg-[#1E2330] h-[2px] rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${syncProgress}%`, transition: 'width 200ms ease' }} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FIELDS.map(({ key, label, min, max, step, unit, icon: Icon }) => (
              <div key={key} className="bg-bg-elevated/40 border border-border-main/50 rounded-xl p-4.5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-success" />
                    <span className="text-[13px] text-text-secondary font-medium">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-28 font-semibold text-white font-mono leading-none">
                      {form[key]}
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono ml-1">{unit}</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-2">
                    <input 
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={form[key]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-[#1E2330] rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center pt-2">
            {error && (
              <p className="w-full max-w-md text-xs text-danger bg-danger/10 border border-danger/20 p-3 rounded-lg mb-4 text-center font-mono uppercase">
                {error}
              </p>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:brightness-110 active:scale-[0.99] text-white font-medium text-[15px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Risk Analysis...
                </>
              ) : 'Calculate Risk Analysis'}
            </button>
          </div>
        </form>
      </div>

      {/* Clinical Diagnostic Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left — Biomarker Radar Chart */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              BIOMARKER RADAR PLOT
            </span>
            <h3 className="text-lg font-semibold text-white font-display mt-1">Biomarker Coordinates</h3>
          </div>

          <div className="flex-1 w-full h-[240px] my-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                { subject: 'HR', Patient: form.heart_rate, Optimum: 70 },
                { subject: 'Sleep', Patient: form.sleep * 10, Optimum: 80 },
                { subject: 'Steps', Patient: (form.steps / 25000) * 100, Optimum: 60 },
                { subject: 'Stress', Patient: form.stress_level * 10, Optimum: 25 },
                { subject: 'Diet', Patient: form.diet_score * 10, Optimum: 85 },
                { subject: 'BMI', Patient: form.bmi * 2, Optimum: 46 },
              ]}>
                <PolarGrid stroke="#1E2330" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B92A5', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <Radar name="Optimum" dataKey="Optimum" stroke="#00D4A0" strokeDasharray="3 3" fill="none" />
                <Radar name="Patient" dataKey="Patient" stroke="#4F8EF7" strokeWidth={2} fill="#4F8EF7" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border-main pt-4">
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[11px] text-text-secondary font-mono">Patient Current</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2.5 h-2.5 rounded bg-transparent border border-dashed border-success" />
              <span className="text-[11px] text-text-secondary font-mono">Optimum Target</span>
            </div>
          </div>
        </div>

        {/* Right — Current Risk Index */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-6 flex flex-col justify-between min-h-[420px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
                CURRENT RISK INDEX
              </span>
              <h3 className="text-lg font-semibold text-white font-display mt-1">Homeostasis Deviations</h3>
            </div>
            <span className="px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 font-mono text-[9px] font-semibold rounded">
              MODERATE
            </span>
          </div>

          <div className="flex items-center justify-center gap-8 py-4">
            {/* Circular Gauge */}
            <div className="relative w-[120px] h-[120px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1E2330" strokeWidth="6" fill="none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="#F5A623" 
                  strokeWidth="6" 
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - 32 / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-32 font-semibold text-white font-mono leading-none">32</span>
                <span className="text-[9px] text-text-muted font-mono tracking-wider mt-1">POINTS</span>
              </div>
            </div>

            {/* Sparkline Graph */}
            <div className="flex-1 h-20 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { day: 0, val: 45 }, { day: 5, val: 43 }, { day: 10, val: 38 }, 
                  { day: 15, val: 40 }, { day: 20, val: 35 }, { day: 25, val: 32 }, 
                  { day: 30, val: 32 }
                ]}>
                  <Line type="monotone" dataKey="val" stroke="#F5A623" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <span className="absolute bottom-0 right-0 text-[8px] font-mono text-text-muted">30-DAY TREND</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border-main">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-text-secondary mb-1">
                <span>RISK DENSITY</span>
                <span>31.56%</span>
              </div>
              <div className="w-full bg-[#1E2330] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: '31.56%' }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['diabetes', 'cardiovascular disease', 'hypertension'].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-bg-elevated border border-border-main text-[11px] text-text-secondary font-mono rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Causal Impact Weight Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left card — Causal Impact Weight */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col justify-between min-h-[260px]">
          <div>
            <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              MATHEMATICAL DRIVER
            </span>
            <h3 className="text-16 font-semibold text-white font-display mt-1">Causal Impact Weight</h3>
          </div>

          <div className="space-y-3 my-4">
            {[
              { label: 'DIABETES', pct: 64, color: 'bg-danger' },
              { label: 'CVD DISEASE', pct: 48, color: 'bg-warning' },
              { label: 'HYPERTENSION', pct: 28, color: 'bg-primary' }
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                  <span>{item.label}</span>
                  <span>{item.pct}%</span>
                </div>
                <div className="w-full bg-[#1E2330] h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-text-secondary font-body">
            Attribution matrices indicate <span className="font-bold text-danger">significant divergence</span> in your glucose response and <span className="font-bold text-danger">diabetes</span> metrics.
          </p>
        </div>

        {/* Center card — Simulate Future */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col justify-between min-h-[260px]">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center">
              <Radio size={20} className="text-success" />
            </div>
            <h3 className="text-22 font-semibold text-white font-display mt-2">Simulate Future</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Model biological trajectories by adjusting parameters over a 120-day predictive timeline.
            </p>
          </div>
          <button 
            onClick={() => router.push("/simulation")}
            className="text-[13px] text-success font-medium flex items-center gap-1 hover:underline mt-4 cursor-pointer"
          >
            Initialize Simulation Engine <ChevronRight size={14} />
          </button>
        </div>

        {/* Right card — Causal Drivers */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col justify-between min-h-[260px]">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Compass size={20} className="text-primary" />
            </div>
            <h3 className="text-22 font-semibold text-white font-display mt-2">Causal Drivers</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Trace network directed acyclic graphs to map biometric node dependencies.
            </p>
          </div>
          <button 
            onClick={() => router.push("/insights")}
            className="text-[13px] text-primary font-medium flex items-center gap-1 hover:underline mt-4 cursor-pointer"
          >
            View Deep Root Paths <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* View Personalised Interventions Banner */}
      <div 
        className="rounded-xl border border-border-main p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #1A1F35 0%, #0F1420 100%)' }}
        onClick={() => router.push("/recommend")}
      >
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            AGENTIC INTELLIGENCE
          </span>
          <h3 className="text-24 font-semibold text-white font-display">
            View Personalised Interventions
          </h3>
          <p className="text-[13px] text-text-secondary max-w-xl">
            A 4-step AI orchestration model has synthesized customized recommendations matching your SCM root imbalances.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Risk Analyst', 'Memory Agent', 'Causal Strategist', 'Recommendation Engine'].map(chip => (
              <span key={chip} className="px-2.5 py-1 bg-[#181C24] border border-border-main text-[11px] text-text-secondary font-mono rounded">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <button 
          className="w-11 h-11 bg-primary hover:brightness-110 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}
