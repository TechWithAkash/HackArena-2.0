"use client";

import { useEffect, useState } from "react";
import { api, type MemoryResponse } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Brain, Send, Trash2, Database, GitBranch, Bell, Clock, RefreshCw, AlertTriangle
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Telegram Connect Component ──
function TelegramConnect({ userId }: { userId: string }) {
  const [status, setStatus] = useState<{ linked: boolean; username?: string; linked_at?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchStatus() {
    try {
      const r = await fetch(`${BASE}/telegram/status?user_id=${encodeURIComponent(userId)}`);
      setStatus(await r.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchStatus(); }, [userId]);

  // Poll for link completion
  useEffect(() => {
    if (!token || status?.linked) return;
    const iv = setInterval(async () => {
      const r = await fetch(`${BASE}/telegram/status?user_id=${encodeURIComponent(userId)}`);
      const s = await r.json();
      setStatus(s);
      if (s.linked) { setToken(null); clearInterval(iv); }
    }, 3000);
    return () => clearInterval(iv);
  }, [token, status?.linked]);

  async function generateToken() {
    setGenerating(true);
    try {
      const r = await fetch(`${BASE}/telegram/generate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const d = await r.json();
      setToken(d.token);
    } catch {}
    setGenerating(false);
  }

  async function handleUnlink() {
    if (!confirm("Disconnect Telegram? You will stop receiving alerts.")) return;
    await fetch(`${BASE}/telegram/unlink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setStatus({ linked: false });
    setToken(null);
  }

  function copyCmd() {
    if (!token) return;
    navigator.clipboard.writeText(`/start ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="h-24 flex items-center justify-center">
      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {status?.linked ? (
        <div className="flex items-center justify-between p-4 bg-bg-elevated border border-border-main rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00D4A0]/10 border border-[#00D4A0]/20 flex items-center justify-center text-[#00D4A0]">
              <span className="w-2.5 h-2.5 bg-[#00D4A0] rounded-full live-dot" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white">Connected to Telegram</p>
                <span className="text-[10px] text-success font-mono">✓ ACTIVE</span>
              </div>
              <p className="text-[11px] text-[#8B92A5] font-mono mt-0.5">
                Since 09/05/2026 // @{status.username || 'PatientUplinkBot'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleUnlink} 
            className="text-[11px] font-mono text-danger hover:brightness-110 border border-danger/30 px-3 py-1.5 rounded transition-all cursor-pointer bg-danger/5"
          >
            Disconnect
          </button>
        </div>
      ) : token ? (
        <div className="space-y-4">
          <div className="p-4 bg-bg-elevated border border-border-main rounded-xl space-y-3 font-mono">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Step 1 — Authenticate with Bot</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Open Telegram and send this command payload to <span className="font-semibold text-white">@darpanAi_bot</span>:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#0A0C10] border border-border-main rounded px-3 py-2 text-xs font-bold text-primary tracking-wider">
                /start {token}
              </code>
              <button
                onClick={copyCmd}
                className="shrink-0 px-4 py-2 bg-primary hover:brightness-110 text-white text-[11px] font-semibold uppercase tracking-wider transition-all rounded cursor-pointer"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />
              ))}
            </div>
            <p className="text-[10px] text-[#8B92A5] font-mono uppercase tracking-wide">Waiting for handshake...</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-bg-elevated border border-border-main rounded-xl">
          <div>
            <p className="text-xs font-semibold text-white">Telegram Integration Off</p>
            <p className="text-[11px] text-[#8B92A5] mt-0.5">Link Telegram to enable biometric push alerts.</p>
          </div>
          <button
            onClick={generateToken}
            disabled={generating}
            className="px-4 py-2 bg-primary hover:brightness-110 text-white text-[11px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50 rounded cursor-pointer"
          >
            {generating ? "Initializing..." : "Link Bot Channel"}
          </button>
        </div>
      )}

      {/* 3 alert type cards in a sub-row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Critical Risk Alert", threshold: "Risk score ≥ 80", color: "bg-[#E5534B]" },
          { label: "High Risk Alert", threshold: "Risk score ≥ 60", color: "bg-[#F5A623]" },
          { label: "Anomaly Detected", threshold: "Sensor outliers", color: "bg-[#4F8EF7]" }
        ].map((item) => (
          <div key={item.label} className="p-3.5 bg-bg-elevated border border-border-main rounded-xl text-center space-y-1">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.color} live-dot`} />
            <p className="text-[12px] font-semibold text-white">{item.label}</p>
            <p className="text-[11px] text-text-muted font-mono">{item.threshold}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<MemoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [userId, setUserId] = useState("user_demo_001");
  const [activeModeler, setActiveModeler] = useState<"SCM" | "PROXY">("SCM");

  useEffect(() => {
    const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    setUserId(uid);
  }, []);

  const fetchMemories = () => {
    const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    api.getMemories(uid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  async function handleClear() {
    if (!confirm("Are you sure? This will wipe the DarpanAI model's memory of your patterns, potentially reducing diagnostic accuracy.")) return;
    setClearing(true);
    try {
      const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
      await api.clearMemories(uid);
      setData({ user_id: uid, memories: [] });
    } catch (e: any) {
      alert("Failed to clear: " + e.message);
    } finally {
      setClearing(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="w-6 h-6 text-primary animate-spin mb-3" />
      <p className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider">Syncing agent control states...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* ── Page Header (Dark Navy Styled Card) ── */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 rounded-xl border border-border-main"
        style={{ background: 'linear-gradient(135deg, #10141D 0%, #080B0F 100%)' }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <p className="text-[10px] font-mono text-success uppercase tracking-wider">
              ● NEURAL SYNAPSE CONNECTION ACTIVE
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-display">
            Agent Control Center
          </h1>
          <p className="text-text-secondary text-sm font-body">
            Manage your digital twin's cognitive memory vectors, causal boundaries, and alerts dispatch systems.
          </p>
        </div>

        <div className="flex gap-4 shrink-0 bg-bg-surface/60 border border-border-main rounded-lg p-4 font-mono">
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">CAUSAL LATENCY</p>
            <p className="text-18 font-semibold text-white">18ms</p>
          </div>
          <div className="border-l border-border-main" />
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">LOGIC NODES</p>
            <p className="text-18 font-semibold text-white">7 Active</p>
          </div>
        </div>
      </motion.div>

      {/* ── Semantic Memory Store (mem0) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface rounded-xl border border-border-main p-6 md:p-8 shadow-[0_0_24px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-row items-center justify-between border-b border-border-main/50 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shadow-sm shrink-0">
              <Brain size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
                SEMANTIC MEMORY STORE (MEMO)
              </span>
              <h3 className="text-sm font-semibold text-white font-display mt-0.5">Neural Cache</h3>
            </div>
          </div>
          
          <button
            onClick={handleClear}
            disabled={clearing || !data?.memories.length}
            className="text-[11px] font-mono text-danger hover:underline disabled:opacity-35 cursor-pointer"
          >
            Clear All Memory
          </button>
        </div>

        <div className="space-y-3">
          {!data?.memories.length ? (
            <div className="py-12 text-center bg-[#181C24]/30 rounded-lg border border-dashed border-border-main flex flex-col items-center justify-center space-y-2">
              <Database className="w-8 h-8 text-text-muted animate-pulse" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide font-mono">The neural memory database is empty</p>
              <p className="text-[10px] text-text-muted font-body">Log wearable check-ins or submit health data to generate memory profiles.</p>
            </div>
          ) : (
            data.memories.map((m, idx) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3.5 rounded-lg bg-bg-elevated border border-border-main/60 hover:border-border-hover transition-colors flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary mt-0.5">
                  <span className="text-xs font-mono">{(idx + 1).toString().padStart(2, "0")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white leading-relaxed font-body">"{m.memory}"</p>
                  {m.metadata?.timestamp && (
                    <p className="text-[10px] text-text-secondary font-mono mt-1.5 flex items-center gap-1">
                      <Clock size={11} className="text-text-muted" />
                      Logged {new Date(m.metadata.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Telegram Alerts Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface rounded-xl border border-border-main p-6 md:p-8 shadow-[0_0_24px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-main/50">
          <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shadow-sm">
            <Bell size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              TELEGRAM ALERTS DISPATCH
            </span>
            <h3 className="text-sm font-semibold text-white font-display mt-0.5">Connected to Telegram</h3>
          </div>
        </div>
        <TelegramConnect userId={userId} />
      </motion.div>

      {/* ── Two-Column Bottom Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left — Clinical Output Parameters */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface rounded-xl border border-border-main p-6 md:p-8 flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              CLINICAL OUTPUT PARAMETERS
            </span>
            <h4 className="text-sm font-semibold text-white font-display">Model Personalities</h4>
            <p className="text-xs text-text-secondary leading-relaxed">Adjust response format tones matching user style preferences.</p>
          </div>

          <div className="flex bg-bg-elevated border border-border-main rounded-lg p-1 mt-6 relative">
            <button 
              onClick={() => setActiveModeler("SCM")}
              className={`flex-1 py-2 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                activeModeler === "SCM" 
                  ? "bg-primary text-white" 
                  : "text-text-secondary hover:text-white"
              }`}
            >
              PRAKRITI MODELER
            </button>
            <button 
              onClick={() => setActiveModeler("PROXY")}
              className={`flex-1 py-2 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                activeModeler === "PROXY" 
                  ? "bg-primary text-white" 
                  : "text-text-secondary hover:text-white"
              }`}
            >
              EMPATHETIC PROXY
            </button>
          </div>
        </motion.div>

        {/* Right — Deployed Cloud Infrastructure */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface rounded-xl border border-border-main p-6 md:p-8 space-y-4 shadow-[0_0_24px_rgba(0,0,0,0.3)]"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
              DEPLOYED CLOUD INFRASTRUCTURE
            </span>
            <h4 className="text-sm font-semibold text-white font-display">Infrastructure Stack</h4>
          </div>

          <div className="space-y-2 pt-1 font-mono text-[13px]">
            {[
              { service: "LLM AGENT", tech: "Groq LLaMA-3", ping: "−12ms Ping", pingColor: "text-success", color: "bg-success" },
              { service: "SEMANTIC VDB", tech: "Qdrant Vector DB", ping: "Indexed", pingColor: "text-primary", color: "bg-primary" },
              { service: "CAUSAL LOGIC", tech: "DoWhy DAG Engine", ping: "100% DAY", pingColor: "text-success", color: "bg-success" },
              { service: "XAI EXPLAINER", tech: "SHAP Explainers", ping: "Active", pingColor: "text-success", color: "bg-success" }
            ].map((item) => (
              <div key={item.service} className="flex items-center justify-between p-3.5 bg-bg-elevated border border-border-main rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color} live-dot`} />
                  <span className="text-white font-semibold">{item.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">{item.tech}</span>
                  <span className={`text-[11px] ${item.pingColor} font-bold`}>{item.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

    </div>
  );
}
