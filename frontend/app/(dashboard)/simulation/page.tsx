"use client";

import { useEffect, useState } from "react";
import { api, type SimulationResponse, type Recommendation, type AgentMeta } from "@/lib/api";
import SimulationChart from "@/components/SimulationChart";
import AgentTrace from "@/components/AgentTrace";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SimulationPage() {
  const [sim, setSim] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState(true);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [agentDone, setAgentDone] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    setUserId(uid);

    api.getSimulation(uid)
      .then(setSim)
      .catch(console.error)
      .finally(() => setSimLoading(false));
  }, []);

  function handleAgentComplete(
    newRecs: Recommendation[],
    newAgent: AgentMeta,
  ) {
    setRecs(newRecs);
    setAgent(newAgent);
    setAgentDone(true);
  }

  if (simLoading) return <LoadingState />;
  if (!sim) return <EmptyState />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border-main"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <p className="text-[10px] font-mono text-success uppercase tracking-wider">
              ● LIVE TRAJECTORY ENGINE ACTIVE
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-display">
            Prakriti Trajectory Simulation
          </h1>
          <p className="text-text-secondary text-sm font-body">
            Model physical homeostasis changes across a 120-day horizon based on habit parameters.
          </p>
        </div>
      </motion.div>

      {/* ── Risk Simulation Chart (Full Width Card) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 hover:border-border-hover transition-colors"
      >
        <SimulationChart
          scenarios={sim.scenarios}
          timelineDays={sim.timeline_days}
          projectedReduction={sim.projected_risk_reduction}
        />
      </motion.div>

      {/* ── 3-Column Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 — Current Baseline */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-text-muted" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                CURRENT BASELINE
              </span>
            </div>
            <p className="text-[12px] text-text-secondary font-body">
              Your risk trajectory if current wearable behaviours continue uninterrupted.
            </p>
          </div>
          <div className="pt-4 border-t border-border-main/50 mt-4 flex items-baseline justify-between">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">Est. Drop</span>
            <span className="text-36 font-semibold text-text-muted font-mono leading-none">0.0%</span>
          </div>
        </motion.div>

        {/* Card 2 — Target Improvement */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono">
                TARGET IMPROVEMENT
              </span>
            </div>
            <p className="text-[12px] text-text-secondary font-body">
              Achievable risk mitigation via targeted agentic lifestyle adjustments.
            </p>
          </div>
          <div className="pt-4 border-t border-border-main/50 mt-4 flex items-baseline justify-between">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider font-mono">Est. Drop</span>
            <span className="text-36 font-semibold text-primary font-mono leading-none">
              −{sim.projected_risk_reduction.improved.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        {/* Card 3 — Optimal Equilibrium */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-border-hover transition-colors flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
                OPTIMAL EQUILIBRIUM
              </span>
            </div>
            <p className="text-[12px] text-text-secondary font-body">
              Mathematical minimisation of all modifiable causal risk nodes.
            </p>
          </div>
          <div className="pt-4 border-t border-border-main/50 mt-4 flex items-baseline justify-between">
            <span className="text-[9px] font-bold text-success uppercase tracking-wider font-mono">Est. Drop</span>
            <span className="text-36 font-semibold text-success font-mono leading-none">
              −{sim.projected_risk_reduction.optimal.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Agentic Pipeline Section ── */}
      <div className="space-y-6 pt-6 border-t border-border-main">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            AGENTIC INTELLIGENCE
          </span>
          <h2 className="text-20 font-semibold text-white font-display">
            4-Step Agentic Pipeline
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed font-body">
            The active diagnostic agent processes history datasets and structural pathways to isolate clinical interventions.
          </p>
        </div>

        {userId && (
          <div className="max-w-3xl mx-auto">
            <AgentTrace userId={userId} onComplete={handleAgentComplete} />
          </div>
        )}
      </div>

      {/* ── Generated Intervention Recommendations ── */}
      <AnimatePresence>
        {agentDone && recs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-main/60 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-white font-display">
                  Agentic Intervention Plan
                </h2>
                <p className="text-xs text-text-secondary mt-1 font-body">
                  Ranked list of modifications generated for your digital twin parameters.
                </p>
              </div>
              {agent && (
                <div className="mt-3 sm:mt-0">
                  <ConfidenceBadge level={agent.agent_confidence} />
                </div>
              )}
            </div>

            {/* Agent reasoning block */}
            {agent?.reasoning && (
              <div className="bg-bg-elevated rounded-xl p-5 border border-border-main flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest font-mono">
                    AI Agent Explanation
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-xl font-body">{agent.reasoning}</p>
                </div>
                {agent.primary_lever && (
                  <div className="flex flex-col justify-center items-start shrink-0 relative z-10">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono mb-1">
                      Primary Biological Lever
                    </span>
                    <span className="text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg capitalize tracking-wide font-mono">
                      {agent.primary_lever.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations List */}
            <div className="space-y-4">
              {recs.map((rec, idx) => (
                <motion.div
                  key={rec.priority}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex flex-col md:flex-row gap-6 p-6 rounded-xl border border-border-main bg-bg-elevated/40 hover:bg-[#181C24] hover:border-border-hover transition-colors group"
                >
                  {/* Priority indicator */}
                  <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-main text-primary text-xs font-bold font-mono flex items-center justify-center shrink-0 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                    0{idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                      <p className="text-sm font-semibold text-white font-body leading-snug">{rec.action}</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-text-secondary bg-bg-elevated border border-border-main px-2.5 py-1 rounded-md shrink-0">
                        <Clock size={12} className="text-text-muted" />
                        {rec.timeframe}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed max-w-3xl mb-3 font-body">{rec.reason}</p>

                    {rec.causal_mechanism && (
                      <p className="text-[10px] text-primary font-mono mb-3 bg-[#4F8EF7]/5 px-2.5 py-1 rounded border border-[#4F8EF7]/10 inline-block">
                        ↳ {rec.causal_mechanism}
                      </p>
                    )}

                    <div className="mt-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {rec.impact} impact
                      </span>
                    </div>
                  </div>

                  {rec.estimated_risk_reduction != null && rec.estimated_risk_reduction > 0 && (
                    <div className="flex md:flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border-main pt-4 md:pt-0 md:pl-6 shrink-0 mt-4 md:mt-0">
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono mb-1.5 hidden md:block">
                        Est. Reduction
                      </p>
                      <span className="text-2xl font-semibold text-success flex items-baseline gap-0.5 font-mono">
                        −{rec.estimated_risk_reduction.toFixed(1)}
                        <span className="text-xs text-success/80 ml-0.5 uppercase font-bold">pts</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Tools list footer */}
            {agent && (
              <div className="mt-6 pt-4 border-t border-border-main flex items-center gap-3 flex-wrap">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Model Tools Invoked:
                </span>
                {agent.tools_called.map((t) => (
                  <span key={t} className="text-[9px] font-mono font-semibold text-text-secondary bg-bg-elevated border border-border-main px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const config = {
    high: { label: "High Confidence", color: "text-success bg-success/10 border-success/20" },
    medium: { label: "Medium Confidence", color: "text-warning bg-warning/10 border-warning/20" },
    low: { label: "Low Confidence", color: "text-danger bg-danger/10 border-danger/20" },
  }[level] ?? { label: level, color: "text-text-secondary bg-bg-elevated border-border-main" };
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border font-mono ${config.color}`}>
      {config.label}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="w-6 h-6 text-primary animate-spin mb-3" />
      <p className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider">Modeling physical trajectory projection...</p>
    </div>
  );
}

function EmptyState() {
  const router = useRouter();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-border-main rounded-xl bg-bg-surface p-8"
    >
      <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border-main flex items-center justify-center mb-4 text-primary shadow-sm">
        <Radio className="w-6 h-6 animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-white font-display">No Trajectory Models Calculated</h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-6 leading-relaxed font-body">
        Submit your biometric telemetry on the dashboard to calculate and model 120-day physiological projections.
      </p>
      <button 
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
      >
        Go to Dashboard <ArrowLeft className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
