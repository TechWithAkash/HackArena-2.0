"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, Compass, TrendingDown } from "lucide-react";

interface Recommendation {
  priority: number;
  action: string;
  reason: string;
  impact: string;
  timeframe: string;
  estimated_risk_reduction?: number;
}

interface Props {
  recommendations: Recommendation[];
  method?: string;
}

const IMPACT_STYLES: Record<string, { border: string; text: string; bg: string; dot: string }> = {
  high:   { border: "border-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  medium: { border: "border-amber-200",   text: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-500" },
  low:    { border: "border-slate-200",   text: "text-slate-600",   bg: "bg-slate-50",   dot: "bg-slate-400" },
};

export default function RecommendationCard({ recommendations, method }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-[24px] border border-gray-200/80 shadow-premium p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            AI Intervention Core
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">Recommended Actions</h3>
        </div>
        {method && (
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
            {method}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {recommendations.slice(0, 3).map((rec, index) => {
          const style = IMPACT_STYLES[rec.impact?.toLowerCase()] ?? IMPACT_STYLES.low;
          return (
            <motion.div 
              key={rec.priority}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                0{rec.priority}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-snug mb-1">{rec.action}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-3.5">{rec.reason}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {rec.impact?.toUpperCase()} IMPACT
                  </span>
                  
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/40">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {rec.timeframe}
                  </span>
                  
                  {rec.estimated_risk_reduction != null && rec.estimated_risk_reduction > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      −{rec.estimated_risk_reduction.toFixed(1)} PTS RISK
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
