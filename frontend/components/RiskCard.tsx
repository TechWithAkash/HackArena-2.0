"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { Shield, ChevronDown, Activity, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Props {
  score: number;
  category: string;
  topFactors: string[];
  history?: { timestamp: string; risk_score: number }[];
}

const CATEGORY_STYLES: Record<string, { badge: string; text: string; bg: string; chart: string; border: string }> = {
  Low:      { badge: "bg-[#00D4A0]/10 text-[#00D4A0] border-[#00D4A0]/20", text: "text-[#00D4A0]", bg: "bg-[#00D4A0]/10", chart: "#00D4A0", border: "border-[#00D4A0]/20" },
  Moderate: { badge: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20", text: "text-[#F5A623]", bg: "bg-[#F5A623]/10", chart: "#F5A623", border: "border-[#F5A623]/20" },
  High:     { badge: "bg-[#E5534B]/10 text-[#E5534B] border-[#E5534B]/20", text: "text-[#E5534B]", bg: "bg-[#E5534B]/10", chart: "#E5534B", border: "border-[#E5534B]/20" },
  Critical: { badge: "bg-[#E5534B]/15 text-[#E5534B] border-[#E5534B]/25", text: "text-[#E5534B]", bg: "bg-[#E5534B]/15", chart: "#E5534B", border: "border-[#E5534B]/25" },
};

export default function RiskCard({ score, category, topFactors, history = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Moderate;
  const pct = Math.min(100, Math.max(0, score));

  const chartData = [...history]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(h => ({
      score: h.risk_score,
      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-bg-surface rounded-xl border border-border-main p-6 md:p-8 relative overflow-hidden transition-all hover:border-border-hover shadow-[0_0_24px_rgba(0,0,0,0.4)]"
    >
      {/* Upper Grid Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
        <div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            ● AI DIAGNOSTIC STATE
          </span>
          <h2 className="text-xl font-semibold text-white tracking-tight font-display mt-1">Current Risk Analysis</h2>
        </div>
        <span className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border font-mono ${style.badge}`}>
          {category} Risk
        </span>
      </div>

      {/* Main Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-6 relative z-10">
        <div className="md:col-span-4 flex justify-center md:justify-start">
          <div className="relative w-32 h-32 flex flex-col items-center justify-center">
            {/* SVG Precision Progress ring */}
            <svg className="absolute w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" stroke="#1E2330" strokeWidth="5.5" fill="none" />
              <motion.circle 
                cx="60" 
                cy="60" 
                r="50" 
                stroke={style.chart} 
                strokeWidth="5.5" 
                fill="none"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round" 
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-44 font-semibold text-white font-mono leading-none">{Math.round(score)}</p>
              <p className="text-[9px] font-bold text-text-secondary mt-1.5 uppercase tracking-widest font-mono">Score / 100</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex justify-between items-end mb-1 text-[11px] font-mono text-text-secondary">
              <span>Risk Density Path</span>
              <span className={`font-semibold ${style.text}`}>{pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#1E2330] h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: style.chart }}
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2 font-mono">
              Primary Causal Factors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topFactors.map((factor) => (
                <span key={factor} className="text-[11px] font-mono font-medium px-2.5 py-1 bg-bg-elevated text-text-secondary rounded border border-border-main hover:border-border-hover transition-colors">
                  {factor.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Explanation Area */}
      <div className="border-t border-border-main/50 pt-4 mt-4 relative z-10">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[12px] font-semibold text-text-secondary hover:text-white transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Explainable AI Clinical Insights
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 text-xs text-text-secondary leading-relaxed bg-bg-elevated/40 rounded border border-border-main p-4"
          >
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1 font-body">
                <p className="font-semibold text-white">Causal Rationale</p>
                <p>
                  The model calculated a {score}% risk score by identifying structural causal links between your latest vitals. The most heavy causal pathways originate from {topFactors.map(f => f.replace(/_/g, ' ')).join(', ')}. Addressing these will result in the most optimal risk reduction.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Trend AreaChart block */}
      {chartData.length > 1 && (
        <div className="pt-6 border-t border-border-main/50 mt-6 relative z-10">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4 font-mono">Historical Risk Trajectory</p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={`colorRisk-${score}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={style.chart} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={style.chart} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    background: '#181C24',
                    border: '1px solid #1E2330', 
                    fontSize: '11px', 
                    fontFamily: 'IBM Plex Mono',
                    color: '#F0F2F7'
                  }}
                  itemStyle={{ color: '#F0F2F7' }}
                  labelStyle={{ color: '#8B92A5', marginBottom: '4px' }}
                  formatter={(value) => [`${value} pts`, 'Risk Score']}
                  labelFormatter={(label, items) => {
                    const time = items?.[0]?.payload?.time;
                    return `Recorded: ${time || label}`;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={style.chart} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#colorRisk-${score})`} 
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
