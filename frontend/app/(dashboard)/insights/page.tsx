"use client";

import { useEffect, useState } from "react";
import { api, type InsightsResponse, type InsightsFactor } from "@/lib/api";
import InsightsBar from "@/components/InsightsBar";
import CausalMap from "@/components/CausalMap";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

function EmptyState() {
  const router = useRouter();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-border-main rounded-xl bg-bg-surface p-8"
    >
      <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border-main flex items-center justify-center mb-4 text-primary shadow-sm">
        <Cpu className="w-6 h-6 animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-white font-display">No Root-Cause Analysis Available</h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-6 leading-relaxed font-body">
        Submit your biometric telemetry on the dashboard to calculate and map structural health relationships.
      </p>
      <button 
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
      >
        Go to Dashboard <ArrowLeft className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function deriveFactors(shap: Record<string, number>): {
  drivers: InsightsFactor[];
  protective: InsightsFactor[];
} {
  const drivers: InsightsFactor[] = [];
  const protective: InsightsFactor[] = [];
  for (const [factor, contribution] of Object.entries(shap)) {
    const entry: InsightsFactor = { factor, contribution, description: getFactorExplanation(factor, contribution) };
    if (contribution > 0) drivers.push(entry);
    else protective.push(entry);
  }
  drivers.sort((a, b) => b.contribution - a.contribution);
  protective.sort((a, b) => a.contribution - b.contribution);
  return { drivers, protective };
}

function getFactorExplanation(factor: string, value: number): string {
  const label = factor.replace(/_/g, " ");
  if (value > 0) {
    return `Elevated ${label} creates a positive risk contribution, driving system models out of equilibrium constraints.`;
  }
  return `Optimal ${label} behaves as a biological protector, stabilizing metabolic pathways and reducing overall health variance.`;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    api.getInsights(userId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="w-6 h-6 text-primary animate-spin mb-3" />
      <p className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider">Deconstructing causal dependencies...</p>
    </div>
  );

  if (error || !data) return <EmptyState />;

  const { drivers, protective } = deriveFactors(data.shap_contributions ?? {});

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
              ● LIVE CAUSAL RELATIONSHIP MATRIX ACTIVE
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-display">
            Prakriti Root-Cause Intelligence
          </h1>
          <p className="text-text-secondary text-sm font-body">
            Deconstruct biological dependencies. Using SHAP values and directed graph links, the platform maps how biometric factors affect health risk.
          </p>
        </div>
      </motion.div>

      {/* ── Causal Relationship Map (directed acyclic graph) ── */}
      <CausalMap 
        primaryCause={data.primary_cause} 
        causalChain={data.causal_chain} 
        shapContributions={data.shap_contributions}
      />

      {/* ── Root Cause Identification Card (green-tinted) ── */}
      {data.primary_cause && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface border-l-4 border-l-success border border-border-main rounded-xl p-6 md:p-8 shadow-[0_0_24px_rgba(0,0,0,0.3)] relative overflow-hidden group"
        >
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-success/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
                MATHEMATICAL IDENTIFICATION OF ROOT CAUSE
              </span>
              <h2 className="text-28 font-semibold text-white font-display capitalize">
                {data.primary_cause.replace(/_/g, " ")}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-text-secondary font-mono">Causal Path:</span> 
              <span className="text-[12px] font-mono text-success bg-[#1A2820] border border-[#00D4A0]/20 px-3 py-1 rounded-md">
                {data.causal_chain || `${data.primary_cause} → health_risk`}
              </span>
            </div>

            <p className="text-[14px] text-text-secondary leading-relaxed font-body mt-2">
              The causal engine has isolated <span className="text-success font-semibold capitalize">{data.primary_cause.replace(/_/g, " ")}</span> as the primary independent driver of systemic variance. Initiating lifestyle edits targeting this parameter cascades positive mitigations downstream across all connected causal nodes.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── SHAP Value Decomposition ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-main/60 pb-3">
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            SHAP VALUE DECOMPOSITION
          </span>
          <span className="text-[10px] font-bold text-text-muted bg-bg-surface border border-border-main px-2.5 py-1 rounded font-mono uppercase tracking-wider">
            Verified Attribution
          </span>
        </div>

        <InsightsBar drivers={drivers} protective={protective} />
      </div>

    </div>
  );
}

function RefreshCw({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      style={{ width: size, height: size }}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M21 20v-5h-.581" />
    </svg>
  );
}
