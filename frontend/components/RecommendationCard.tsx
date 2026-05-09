"use client";

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

const IMPACT_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  high:   { dot: "bg-[#22C55E]", text: "text-[#16A34A]", bg: "bg-[#ECFDF5]" },
  medium: { dot: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50" },
  low:    { dot: "bg-gray-300",   text: "text-gray-500",   bg: "bg-gray-50" },
};

export default function RecommendationCard({ recommendations, method }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aura Recommendations</p>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">Your Action Plan</h3>
        </div>
        {method && (
          <span className="text-[10px] font-mono text-gray-300 px-2 py-1 bg-gray-50 rounded-lg">{method}</span>
        )}
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const s = IMPACT_STYLES[rec.impact?.toLowerCase()] ?? IMPACT_STYLES.low;
          return (
            <div key={rec.priority} className="flex gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-100 hover:shadow-sm transition-all">
              <div className="w-7 h-7 rounded-xl bg-[#ECFDF5] text-[#22C55E] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {rec.priority}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{rec.action}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{rec.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {rec.impact?.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                    ⏱ {rec.timeframe}
                  </span>
                  {rec.estimated_risk_reduction != null && rec.estimated_risk_reduction > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#ECFDF5] text-[#16A34A]">
                      −{rec.estimated_risk_reduction.toFixed(1)} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
