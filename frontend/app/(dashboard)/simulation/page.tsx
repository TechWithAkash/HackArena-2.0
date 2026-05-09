"use client";

import { useEffect, useState } from "react";
import { api, type SimulationResponse, type Recommendation, type AgentMeta } from "@/lib/api";
import SimulationChart from "@/components/SimulationChart";
import AgentTrace from "@/components/AgentTrace";

export default function SimulationPage() {
  const [sim, setSim] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState(true);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [agentDone, setAgentDone] = useState(false);
  const [userId, setUserId] = useState("");

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
    <div className="p-8 space-y-8 animate-in fade-in duration-700 mb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              Live Trajectory Engine Active
            </p>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Prakriti Trajectory Simulation
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Real-time simulation modelling a 120-day physical horizon using live Causal AI.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 hover:shadow-md hover:border-blue-200 transition-all">
        <SimulationChart
          scenarios={sim.scenarios}
          timelineDays={sim.timeline_days}
          projectedReduction={sim.projected_risk_reduction}
        />
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScenarioCard
          label="Current Baseline"
          description="Your risk trajectory if current behaviours continue uninterrupted."
          reduction={0}
          interventions={[]}
          color="#9CA3AF"
        />
        <ScenarioCard
          label="Target Improvement"
          description="Achievable risk mitigation via targeted agentic lifestyle optimisations."
          reduction={sim.projected_risk_reduction.improved}
          interventions={recs.slice(0, 2).map((r) => r.action)}
          color="#60A5FA"
        />
        <ScenarioCard
          label="Optimal Equilibrium"
          description="Mathematical minimisation of all modifiable causal risk nodes."
          reduction={sim.projected_risk_reduction.optimal}
          interventions={recs.map((r) => r.action)}
          color="#10B981"
        />
      </div>

      {/* Agent section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gray-100" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">
            Agentic Intelligence
          </p>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <p className="text-xs text-gray-400 mb-4 text-center">
          A 4-step Groq-powered agent analyses your health data in real-time and synthesises personalised interventions.
        </p>

        {userId && (
          <AgentTrace userId={userId} onComplete={handleAgentComplete} />
        )}
      </div>

      {/* Recommendations — appear after agent finishes */}
      {agentDone && recs.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Agentic Intervention Plan
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Personalised interventions generated live by the Cognitive Health Agent.
              </p>
            </div>
            {agent && (
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <ConfidenceBadge level={agent.agent_confidence} />
              </div>
            )}
          </div>

          {/* Agent reasoning banner */}
          {agent?.reasoning && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Agent Reasoning
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{agent.reasoning}</p>
              {agent.primary_lever && (
                <div className="mt-2 inline-flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                    Primary lever:
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold capitalize">
                    {agent.primary_lever.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {recs.map((rec, idx) => (
              <div
                key={rec.priority}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-gray-100 hover:bg-gray-50/50 hover:border-blue-100 transition-all group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Priority badge */}
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-sm font-black flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                    <p className="text-base font-bold text-gray-900 leading-snug">{rec.action}</p>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md shrink-0">
                      {rec.timeframe}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed max-w-3xl mb-2">{rec.reason}</p>

                  {rec.causal_mechanism && (
                    <p className="text-xs text-indigo-500 italic mb-3">
                      ↳ {rec.causal_mechanism}
                    </p>
                  )}

                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {rec.impact} impact
                  </span>
                </div>

                {rec.estimated_risk_reduction != null && rec.estimated_risk_reduction > 0 && (
                  <div className="flex sm:flex-col items-center justify-center sm:justify-start border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 shrink-0 mt-4 sm:mt-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 hidden sm:block">
                      Mitigation
                    </p>
                    <span className="text-2xl font-black text-emerald-500">
                      −{rec.estimated_risk_reduction.toFixed(1)}
                      <span className="text-xs text-emerald-300 ml-0.5">pts</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tools used footer */}
          {agent && (
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Tools used:
              </span>
              {agent.tools_called.map((t) => (
                <span key={t} className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const config = {
    high: { label: "High Confidence", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    medium: { label: "Medium Confidence", color: "text-amber-700 bg-amber-50 border-amber-200" },
    low: { label: "Low Confidence", color: "text-red-600 bg-red-50 border-red-200" },
  }[level] ?? { label: level, color: "text-gray-500 bg-gray-50 border-gray-100" };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}

function ScenarioCard({ label, color, description, reduction, interventions }: {
  label: string; color: string; description: string; reduction: number; interventions: string[];
}) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between group h-full">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <span className="text-sm font-bold text-gray-800 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4 font-medium">{description}</p>
        {interventions.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Agent Actions
            </p>
            <ul className="space-y-1.5">
              {interventions.slice(0, 2).map((inv, i) => (
                <li key={i} className="text-xs text-gray-500 font-medium flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 mt-1" />
                  <span className="truncate">{inv}</span>
                </li>
              ))}
              {interventions.length > 2 && (
                <li className="text-[10px] text-blue-500 font-bold ml-3.5">
                  +{interventions.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="pt-4 border-t border-gray-50 flex items-end justify-between mt-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projected Drop</p>
        {reduction > 0 ? (
          <p className="text-2xl font-black text-emerald-500 group-hover:scale-105 transition-transform">
            −{reduction.toFixed(1)}%
          </p>
        ) : (
          <p className="text-2xl font-black text-gray-400">0.0%</p>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading simulation…</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center gap-4">
      <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">No simulation data yet</p>
        <p className="text-xs text-gray-400 mt-1">Submit your vitals from the Dashboard first.</p>
      </div>
      <a href="/dashboard" className="text-xs font-bold text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
        Go to Dashboard →
      </a>
    </div>
  );
}
