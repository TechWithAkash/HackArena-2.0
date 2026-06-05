"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Recommendation, AgentMeta } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STEP_CONFIG: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: "text-[#4F8EF7]",    bg: "bg-[#4F8EF7]/10",    border: "border-[#4F8EF7]/20" },
  2: { color: "text-[#8B5CF6]",    bg: "bg-[#8B5CF6]/10",    border: "border-[#8B5CF6]/20" },
  3: { color: "text-[#F5A623]",    bg: "bg-[#F5A623]/10",    border: "border-[#F5A623]/20" },
  4: { color: "text-[#00D4A0]",    bg: "bg-[#00D4A0]/10",    border: "border-[#00D4A0]/20" },
};

interface StepState {
  step: number;
  agent: string;
  icon: string;
  description?: string;
  summary?: string;
  detail?: Record<string, unknown>;
  status: "waiting" | "running" | "complete";
}

interface AgentTraceProps {
  userId: string;
  onComplete: (recs: Recommendation[], agent: AgentMeta, riskScore?: number) => void;
}

export default function AgentTrace({ userId, onComplete }: AgentTraceProps) {
  const [steps, setSteps] = useState<StepState[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId) return;

    setPhase("running");
    setSteps([]);

    const url = `${BASE}/recommend/stream?user_id=${encodeURIComponent(userId)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "step_start") {
        setSteps((prev) => [
          ...prev,
          {
            step: data.step,
            agent: data.agent,
            icon: data.icon,
            description: data.description,
            status: "running",
          },
        ]);
      }

      if (data.type === "step_complete") {
        setSteps((prev) =>
          prev.map((s) =>
            s.step === data.step
              ? { ...s, summary: data.summary, status: "complete", detail: data }
              : s
          )
        );
      }

      if (data.type === "complete") {
        setPhase("done");
        es.close();
        onComplete(data.recommendations ?? [], data.agent ?? {}, data.risk_score);
      }

      if (data.type === "error") {
        setPhase("error");
        setErrorMsg(data.message ?? "Agent failed");
        es.close();
      }
    };

    es.onerror = () => {
      if (phase !== "done") {
        setPhase("error");
        setErrorMsg("Connection to agent lost. Ensure the backend is running.");
        es.close();
      }
    };

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (phase === "error") {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-5 text-center">
        <p className="text-sm font-bold text-danger mb-1 font-display">Agent Pipeline Error</p>
        <p className="text-xs text-text-secondary font-mono">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-xl border border-border-main overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-main/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            COGNITIVE HEALTH PIPELINE
          </span>
          <h3 className="text-sm font-semibold text-white font-display mt-0.5">4-Step Agentic Pipeline</h3>
        </div>
        <div className="flex items-center gap-2">
          {phase === "running" && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-success uppercase tracking-widest font-mono">
                Live
              </span>
            </>
          )}
          {phase === "done" && (
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono bg-bg-elevated px-2 py-0.5 rounded">
              Complete
            </span>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border-main/40 relative">
        {phase === "running" && steps.length === 0 && (
          <div className="px-6 py-5 flex items-center gap-3">
            <RefreshCw className="w-3.5 h-3.5 text-success animate-spin" />
            <p className="text-xs text-text-secondary font-mono uppercase">Initialising agentic components…</p>
          </div>
        )}

        {steps.map((step, idx) => {
          const cfg = STEP_CONFIG[step.step] ?? STEP_CONFIG[1];
          return (
            <div
              key={step.step}
              className="px-6 py-4 flex items-start gap-4 relative"
            >
              {/* Vertical Connector lines */}
              {idx < steps.length - 1 && (
                <div className="absolute left-[38px] top-12 bottom-0 w-[1px] bg-border-main/50 pointer-events-none" />
              )}

              {/* Icon / status */}
              <div className={`relative flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
                {step.status === "running" ? (
                  <div className={`w-3 h-3 border-2 border-border-main/20 border-t-current ${cfg.color} rounded-full animate-spin`} />
                ) : (
                  <span className="text-sm leading-none">{step.icon}</span>
                )}
                {step.status === "complete" && (
                  <span className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#111318] ${cfg.border} border flex items-center justify-center`}>
                    <svg className={`w-2 h-2 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[11px] font-bold ${cfg.color} uppercase tracking-wider font-mono`}>
                    Step {step.step}
                  </p>
                  <span className="text-xs text-text-secondary font-medium font-body">{step.agent}</span>
                </div>

                {step.status === "running" && (
                  <p className="text-xs text-text-muted italic font-body">{step.description}</p>
                )}

                {step.status === "complete" && step.summary && (
                  <p className="text-xs text-text-primary leading-relaxed font-body">{step.summary}</p>
                )}

                {/* Step specific detail parameters */}
                {step.status === "complete" && step.step === 3 && step.detail && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                    {(step.detail as any).lever && (
                      <span className="font-semibold text-warning bg-warning/5 border border-warning/20 px-2 py-0.5 rounded">
                        Lever: {(step.detail as any).lever}
                      </span>
                    )}
                    {(step.detail as any).mechanism && (
                      <span className="text-text-secondary truncate max-w-xs">
                        {(step.detail as any).mechanism}
                      </span>
                    )}
                  </div>
                )}

                {step.status === "complete" && step.step === 2 && step.detail && (
                  <p className="text-[10px] text-[#8B5CF6] font-mono mt-1 italic">
                    {(step.detail as any).insight}
                  </p>
                )}
              </div>

              {/* Step number in monospace */}
              <span className="text-[10px] font-mono text-text-muted tabular-nums pt-1">
                {String(step.step).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {phase === "done" && (
        <div className="px-6 py-3 bg-[#00D4A0]/5 border-t border-[#00D4A0]/10 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            Agent analysis complete — Groq · {steps.length} steps · 3 LLM calls
          </span>
        </div>
      )}
    </div>
  );
}
