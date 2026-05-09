"use client";

import { useEffect, useState } from "react";
import { api, type AlertsResponse } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";

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
      // Optimistic update or refresh
      fetchAlerts();
    } catch (e: any) {
      alert("Failed to acknowledge: " + e.message);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <p className="text-sm text-red-600 font-bold">{error}</p>
    </div>
  );

  if (!data) return null;

  const criticalCount = data.alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;

  return (
    <div className="p-8 space-y-10 pb-20">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clinical Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Anomalies and out-of-range vitals detected by Aura's diagnostic layers.</p>
        </div>
        {data.alerts.length > 0 && (
          <div className="text-right px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{data.alerts.length} Total</p>
            {criticalCount > 0 && (
              <p className="text-sm text-red-500 font-extrabold">{criticalCount} Critical</p>
            )}
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
        <AlertBanner 
          alerts={data.alerts} 
          onAcknowledge={handleAcknowledge}
        />
      </div>

      <div className="bg-gray-100/50 rounded-3xl p-6 border border-gray-100 mt-12">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Diagnostic Accuracy</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Alerts are generated using a three-layer validation stack: 
          (1) Absolute clinical bounds, (2) Rolling personal Z-Scores, and (3) Isolation Forest unsupervised learning. 
          Acknowledge alerts to help Aura refine her sensitivity to your unique patterns.
        </p>
      </div>
    </div>
  );
}
