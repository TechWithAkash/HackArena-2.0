"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldAlert, Heart, Clock, ChevronRight } from "lucide-react";

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

const SEV_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  critical: { bg: "bg-danger/10",    border: "border-danger/25",    text: "text-danger",    dot: "bg-danger",    label: "Critical Alert" },
  high:     { bg: "bg-danger/10",    border: "border-danger/20",    text: "text-danger",    dot: "bg-danger",    label: "High Severity" },
  medium:   { bg: "bg-warning/10",   border: "border-warning/25",   text: "text-warning",   dot: "bg-warning",   label: "Medium Alert" },
  moderate: { bg: "bg-warning/10",   border: "border-warning/20",   text: "text-warning",   dot: "bg-warning",   label: "Moderate Alert" },
  low:      { bg: "bg-success/10", border: "border-success/25",  text: "text-success", dot: "bg-success", label: "Low Severity" },
};

const DEFAULT_STYLE = { bg: "bg-bg-surface", border: "border-border-main", text: "text-text-secondary", dot: "bg-text-muted", label: "System Info" };

export default function AlertBanner({ alerts, onAcknowledge }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-surface border border-border-main rounded-[24px] p-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-text-primary tracking-tight font-display">Physiological Balance Nominal</p>
            <p className="text-xs text-text-secondary font-medium font-body">No critical exceptions or outliers detected by the anomaly layer.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {alerts.map((alert, index) => {
          const s = SEV_STYLES[alert.severity?.toLowerCase()] ?? DEFAULT_STYLE;
          const label = alert.metric ?? "Telemetry";
          return (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className={`${s.bg} border ${s.border} rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0 mt-1">
                  <span className={`w-3.5 h-3.5 rounded-full ${s.dot} block`} />
                  <span className={`absolute inset-0 w-3.5 h-3.5 rounded-full ${s.dot} block animate-ping opacity-60`} />
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-text-primary uppercase tracking-wide font-display">
                      {label.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${s.bg} ${s.text} ${s.border} font-mono`}>
                      {s.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-secondary leading-relaxed font-medium max-w-xl font-body">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-wider flex-wrap font-mono">
                    <span className="flex items-center gap-1">
                      Observed: <span className="text-text-primary font-black font-mono">{alert.value}</span>
                    </span>
                    {alert.timestamp && (
                      <span className="flex items-center gap-1 text-text-secondary font-medium lowercase">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="w-full md:w-auto bg-bg-elevated hover:bg-border-hover border border-border-main text-text-primary hover:text-white rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 shrink-0"
                >
                  Clear Node <ChevronRight className="w-3 h-3 text-text-secondary" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
