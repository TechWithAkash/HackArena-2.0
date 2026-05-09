"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  score: number;
  category: string;
  topFactors: string[];
  history?: { timestamp: string; risk_score: number }[];
}

const CATEGORY_STYLES: Record<string, { ring: string; badge: string; bar: string; chart: string }> = {
  Low:      { ring: "ring-[#22C55E]", badge: "bg-[#ECFDF5] text-[#16A34A]", bar: "bg-[#22C55E]", chart: "#22C55E" },
  Moderate: { ring: "ring-yellow-400", badge: "bg-yellow-50 text-yellow-700", bar: "bg-yellow-400", chart: "#FACC15" },
  High:     { ring: "ring-orange-400", badge: "bg-orange-50 text-orange-700", bar: "bg-orange-400", chart: "#FB923C" },
  Critical: { ring: "ring-red-500",    badge: "bg-red-50 text-red-700",       bar: "bg-red-500", chart: "#EF4444" },
};

export default function RiskCard({ score, category, topFactors, history = [] }: Props) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Moderate;
  const pct = Math.min(100, Math.max(0, score));

  // Sort history by date (from oldest to newest)
  const chartData = [...history]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(h => ({
      score: h.risk_score,
      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
         <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Health State Analysis</p>
            <h2 className="text-xl font-bold text-gray-900">Current Risk Index</h2>
         </div>
         <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${style.badge}`}>
            {category}
          </span>
      </div>

      <div className="flex items-center gap-8 mb-8">
        <div className={`relative w-28 h-28 rounded-full ring-8 ring-offset-4 ring-offset-white ${style.ring} flex flex-col items-center justify-center shadow-inner transition-all duration-700`}>
          <p className="text-3xl font-black text-gray-900 leading-none">{Math.round(score)}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Points</p>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Risk Density</span>
            <span className="text-[11px] font-bold text-gray-900">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5 overflow-hidden">
            <div className={`h-2.5 rounded-full ${style.bar} transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${pct}%` }} />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {topFactors.map((f) => (
              <span key={f} className="text-[10px] font-bold px-3 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 group hover:border-[#22C55E]/30 transition-colors">
                {f.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="pt-6 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">30-Day Predictive Trend</p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={style.chart} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={style.chart} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={style.chart} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRisk)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
