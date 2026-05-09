"use client";

import { useEffect, useState } from "react";
import { api, type MemoryResponse, type MemoryItem } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Telegram Connect Component ─────────────────────────────────────────────────
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

  // Poll for link completion while token is shown
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
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {status?.linked ? (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Connected to Telegram</p>
              {status.username && <p className="text-xs text-emerald-600">@{status.username}</p>}
              {status.linked_at && (
                <p className="text-[10px] text-emerald-500 font-mono">
                  Since {new Date(status.linked_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleUnlink} className="text-[10px] font-bold text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors">
            Disconnect
          </button>
        </div>
      ) : token ? (
        <div className="space-y-3">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Step 1 — Open Telegram</p>
            <p className="text-xs text-indigo-700 font-medium mb-3">
              Message <span className="font-black">@darpanAi_bot</span> on Telegram and send this command:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-indigo-800 tracking-wider">
                /start {token}
              </code>
              <button
                onClick={copyCmd}
                className="shrink-0 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wide hover:bg-indigo-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Waiting for you to send the command on Telegram…</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
          <div>
            <p className="text-sm font-bold text-gray-700">Not Connected</p>
            <p className="text-xs text-gray-400 mt-0.5">Link Telegram to receive real-time health alerts</p>
          </div>
          <button
            onClick={generateToken}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate Link Code"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "🔴", label: "Critical Risk Alert", desc: "Risk ≥ 80" },
          { icon: "🟠", label: "High Risk Alert", desc: "Risk ≥ 60" },
          { icon: "⚠️", label: "Anomaly Detected", desc: "Abnormal vitals" },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <p className="text-lg mb-1">{item.icon}</p>
            <p className="text-[10px] font-bold text-gray-700">{item.label}</p>
            <p className="text-[9px] text-gray-400 font-medium">{item.desc}</p>
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

  useEffect(() => {
    const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    setUserId(uid);
  }, []);

  const fetchMemories = () => {
    const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    api.getMemories(userId)
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
      const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
      await api.clearMemories(userId);
      setData({ user_id: userId, memories: [] });
    } catch (e: any) {
      alert("Failed to clear: " + e.message);
    } finally {
      setClearing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 space-y-10 pb-20 animate-in fade-in duration-1000">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden mb-4">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Neural Synapse Connection Active</p>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Agentic Control Center</h1>
            <p className="text-indigo-200 text-sm mt-2 font-medium max-w-lg">Manage DarpanAI's cognitive context, causal constraints, and technical infrastructure pipelines.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-6">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Causal Latency</p>
               <p className="text-xl font-black text-white font-mono">18<span className="text-sm text-slate-400 ml-1">ms</span></p>
             </div>
             <div className="w-px bg-white/10"></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logic Nodes</p>
               <p className="text-xl font-black text-white font-mono">7<span className="text-sm text-slate-400 ml-1">Active</span></p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Agentic Context State</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Semantic Memory Store (mem0)</p>
          </div>
          <button
            onClick={handleClear}
            disabled={clearing || !data?.memories.length}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
          >
            {clearing ? "Wiping..." : "Clear All Memory"}
          </button>
        </div>

        <div className="space-y-4">
          {!data?.memories.length ? (
            <div className="py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500 font-bold">The DarpanAI memory cache is currently empty.</p>
              <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest">Start logging telemetry to build agentic context.</p>
            </div>
          ) : (
            data.memories.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:border-[#22C55E]/20">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#22C55E]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{m.memory}"</p>
                    {m.metadata?.timestamp && (
                        <p className="text-[10px] text-gray-300 mt-2 font-mono uppercase">Recorded {new Date(m.metadata.timestamp).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Telegram Alerts</h2>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-bold">Real-time push notifications · AI chat on Telegram</p>
          </div>
        </div>
        <TelegramConnect userId={userId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
           <h3 className="text-sm font-extrabold text-gray-900 mb-2 uppercase tracking-widest">Clinical Output Parameters</h3>
           <p className="text-xs text-gray-500 mb-6 leading-relaxed">Adjust DarpanAI's diagnostic mapping styling for your check-ins.</p>
           <div className="flex gap-2">
             <button className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-[10px] font-black uppercase tracking-wider shadow-sm">Prakriti Modeler</button>
             <button className="flex-1 py-3 px-3 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors">Empathetic Proxy</button>
           </div>
        </div>
        
        <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
           <h3 className="text-sm font-extrabold text-gray-900 mb-2 uppercase tracking-widest">Deployed Cloud Infrastructure</h3>
           <p className="text-xs text-gray-500 mb-5 leading-relaxed">Current core engineering stack leveraged by the DarpanAI engine.</p>
           <div className="grid grid-cols-1 gap-3">
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span><span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">LLM Agent: Groq Llama-3</span></div>
               <span className="text-[10px] font-mono text-emerald-600 font-bold">~12ms Ping</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span><span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Semantic VDB: Qdrant</span></div>
               <span className="text-[10px] font-mono text-emerald-600 font-bold">Indexed</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span><span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Causal Logic: DoWhy</span></div>
               <span className="text-[10px] font-mono text-blue-600 font-bold">100% DAG</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span><span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">XAI Explainer: SHAP</span></div>
               <span className="text-[10px] font-mono text-blue-600 font-bold">Active</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
