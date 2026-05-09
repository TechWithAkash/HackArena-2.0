"use client";

interface Alert {
  id: string;
  metric: string;
  severity: string;
  message: string;
  value: number;
  timestamp?: string;
}

interface Props {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

const SEV_STYLES: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500",    label: "Critical" },
  high:     { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", label: "High" },
  medium:   { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", label: "Medium" },
  moderate: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", label: "Moderate" },
  low:      { bg: "bg-[#ECFDF5]", border: "border-[#86EFAC]",  dot: "bg-[#22C55E]", label: "Low" },
};

const DEFAULT_STYLE = { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", label: "Info" };

export default function AlertBanner({ alerts, onAcknowledge }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-[#ECFDF5] border border-[#86EFAC] rounded-3xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E] flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">All Systems Clear</p>
            <p className="text-xs text-gray-400">No anomalies detected in your recent health data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alerts.map((alert) => {
        const s = SEV_STYLES[alert.severity?.toLowerCase()] ?? DEFAULT_STYLE;
        const label = alert.metric ?? "Unknown";
        return (
          <div key={alert.id} className={`${s.bg} border ${s.border} rounded-[2rem] p-5 flex items-center justify-between group transition-all hover:scale-[1.01] shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className={`w-3 h-3 rounded-full ${s.dot} mt-1.5 animate-pulse`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">{label.replace(/_/g, " ")}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border ${s.border} text-gray-600`}>{s.label}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed max-w-lg">{alert.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] font-medium text-gray-400">Observed: <span className="text-gray-600 font-bold">{alert.value}</span></span>
                  {alert.timestamp && (
                    <span className="text-[11px] font-medium text-gray-300 italic">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </div>

            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="opacity-0 group-hover:opacity-100 px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-gray-400 hover:text-[#22C55E] hover:border-[#22C55E] transition-all shadow-sm"
              >
                Acknowledge
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
