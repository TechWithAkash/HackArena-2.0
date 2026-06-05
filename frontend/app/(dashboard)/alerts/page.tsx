"use client";

import { useEffect, useState } from "react";
import { api, type AlertsResponse } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Cpu, RefreshCw } from "lucide-react";

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = () => {
    const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    api.getAlerts(userId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function handleAcknowledge(alertId: string) {
    try {
      await api.acknowledgeAlert(alertId);
      fetchAlerts();
    } catch (e: any) {
      alert("Failed to acknowledge: " + e.message);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-xs font-bold text-rose-600">
      {error}
    </div>
  );

  if (!data) return null;

  const criticalCount = data.alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* ── Page Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border-main/60"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
              Live Diagnostic Monitoring Stack
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary font-display tracking-tight flex items-center gap-3">
            Clinical Alerts
          </h1>
          <p className="text-text-secondary text-sm max-w-2xl font-medium leading-relaxed font-body">
            Monitor real-time biometric anomalies and out-of-bounds telemetry flagged by your digital health twin.
          </p>
        </div>

        {data.alerts.length > 0 && (
          <div className="flex gap-4 bg-bg-surface border border-border-main rounded-2xl p-4 shadow-sm shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">Total Anomalies</p>
              <p className="text-lg font-black text-text-primary font-mono">{data.alerts.length}</p>
            </div>
            {criticalCount > 0 && (
              <>
                <div className="border-l border-border-main" />
                <div className="text-right">
                  <p className="text-[9px] font-bold text-danger uppercase tracking-widest font-mono">High Severity</p>
                  <p className="text-lg font-black text-danger font-mono">{criticalCount}</p>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Active Alerts List ── */}
      <div className="space-y-4">
        <AlertBanner 
          alerts={data.alerts} 
          onAcknowledge={handleAcknowledge}
        />
      </div>

      {/* ── Clinical Explanation Panel ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface border border-border-main text-text-primary rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(79,142,247,0.05),transparent_50%)] pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 mt-0.5 animate-pulse">
          <Cpu className="w-5 h-5" />
        </div>
        
        <div className="space-y-2 relative z-10 font-body">
          <h4 className="text-xs font-black text-text-primary font-display uppercase tracking-wider">
            Diagnostic Verification Stack
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed font-medium max-w-3xl">
            Alert exceptions are evaluated by DarpanAI using a multi-tiered diagnostic algorithm: (1) absolute standard clinical thresholds, (2) user personal z-score history models, and (3) multi-variable clustering filters. Cleared nodes feed back into reinforcement parameters to calibrate model tolerances to your specific biology.
          </p>
        </div>
      </motion.div>

    </div>
  );
}
