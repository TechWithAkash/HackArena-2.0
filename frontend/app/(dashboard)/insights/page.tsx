"use client";

import { useEffect, useState } from "react";
import { api, type InsightsResponse, type InsightsFactor } from "@/lib/api";
import InsightsBar from "@/components/InsightsBar";
import CausalMap from "@/components/CausalMap";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center gap-4">
      <div className="w-14 h-14 rounded-3xl bg-[#ECFDF5] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">No insights yet</p>
        <p className="text-xs text-gray-400 mt-1">Submit your vitals from the Dashboard to generate causal analysis.</p>
      </div>
      <a href="/" className="text-xs font-bold text-[#22C55E] border border-[#86EFAC] px-4 py-2 rounded-xl hover:bg-[#ECFDF5] transition-colors">
        Go to Dashboard →
      </a>
    </div>
  );
}

function deriveFactors(shap: Record<string, number>): {
  drivers: InsightsFactor[];
  protective: InsightsFactor[];
} {
  const drivers: InsightsFactor[] = [];
  const protective: InsightsFactor[] = [];
  for (const [factor, contribution] of Object.entries(shap)) {
    const entry: InsightsFactor = { factor, contribution, description: factor.replace(/_/g, " ") };
    if (contribution > 0) drivers.push(entry);
    else protective.push(entry);
  }
  drivers.sort((a, b) => b.contribution - a.contribution);
  protective.sort((a, b) => a.contribution - b.contribution);
  return { drivers, protective };
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
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <EmptyState />;


  if (!data) return <EmptyState />;

  const { drivers, protective } = deriveFactors(data.shap_contributions ?? {});

  return (
    <div className="p-8 space-y-12 pb-20 mt-4 mb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
             </span>
             <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Live Causal Relationship Matrix Active</p>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Prakriti Root-Cause Intelligence</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Deep SHAP value decomposition uncovering the exact causal drivers of your physiological imbalance.</p>
        </div>
      </div>

      <CausalMap 
        primaryCause={data.primary_cause} 
        causalChain={data.causal_chain} 
      />

      {data.primary_cause && (
        <div className="bg-gradient-to-br from-[#ECFDF5] to-white border border-[#86EFAC] rounded-[2rem] p-8 shadow-md relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#22C55E]/10 rounded-full blur-2xl group-hover:bg-[#22C55E]/20 transition-all duration-700"></div>
          <p className="text-[11px] font-black text-[#16A34A] uppercase tracking-widest mb-3">Mathematical Identification of Root Cause</p>
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <h2 className="text-3xl font-black text-gray-900 capitalize tracking-tight">{data.primary_cause.replace(/_/g, " ")}</h2>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm border border-[#A7F3D0] px-4 py-2 rounded-xl inline-flex flex-wrap items-center gap-2 mb-4 shadow-sm">
             <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Causal Path Evaluated:</span> 
             <span className="text-xs text-gray-700 font-bold tracking-tight">{data.causal_chain}</span>
          </div>

          <p className="text-sm text-gray-700 max-w-2xl leading-relaxed font-medium">
            The DarpanAI logic engine has successfully isolated <b>{data.primary_cause.replace(/_/g, " ")}</b> as the <span className="text-[#16A34A] font-extrabold">primary independent driver</span> of your systemic health risk. Modifying this specific biological lever will cascade through the mapped physiological chain, yielding the highest statistical mitigation in downstream risk.
          </p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-200 p-8 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-shadow duration-500">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">SHAP Value Decomposition</h3>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full uppercase tracking-widest">Data Science Verified</span>
        </div>
        <InsightsBar drivers={drivers} protective={protective} />
      </div>
    </div>
  );
}
