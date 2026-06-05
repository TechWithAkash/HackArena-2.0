"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Activity, CheckCircle2 } from "lucide-react";

function MarkdownText({ content, className }: { content: string, className?: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**")) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*")) return <em key={i} className="text-text-secondary font-medium">{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });
  };
  return (
    <div className={`leading-relaxed space-y-2.5 ${className || 'text-[13px] text-text-secondary font-body'}`}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        if (line.match(/^#+\s/)) return <h4 key={i} className="font-semibold text-white mt-4 mb-2 text-sm font-display">{line.replace(/^#+\s/, "")}</h4>;
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-2" />
              <span>{renderInline(line.replace(/^[\-\*]\s*/, ""))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

const DEFAULT_USER = "user_demo_001";

interface ModelEval {
  model: string;
  scores: {
    clinical_accuracy: number;
    structural_clarity: number;
    actionability: number;
    preciseness: number;
  };
  overall: number;
  critique: string;
  thought_process?: string;
}

const ARENA_MODELS = [
  { id: "gptoss", name: "GPT OSS 120B", tag: "openai/gpt-oss-120b", color: "#4F8EF7" },
  { id: "llama", name: "Llama 3.3 Flagship", tag: "llama-3.3-70b-versatile", color: "#8B5CF6" },
  { id: "qwen", name: "Qwen 32B Benchmark", tag: "qwen/qwen3-32b", color: "#F5A623" },
];

export default function ArenaPage() {
  const [query, setQuery] = useState("Based on my latest vitals, what is the safest way to lower my blood pressure without medication?");
  const [isBattling, setIsBattling] = useState(false);
  const [phase, setPhase] = useState<"idle" | "generating" | "evaluating" | "complete">("idle");
  
  const [responses, setResponses] = useState<Record<string, string>>({ gptoss: "", llama: "", qwen: "" });
  const [evaluations, setEvaluations] = useState<Record<string, ModelEval | null>>({ gptoss: null, llama: null, qwen: null });
  const [winner, setWinner] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const startBattle = () => {
    if (!query.trim()) return;
    
    setResponses({ gptoss: "", llama: "", qwen: "" });
    setEvaluations({ gptoss: null, llama: null, qwen: null });
    setWinner(null);
    setVerdict(null);
    setIsBattling(true);
    setPhase("generating");

    const userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("darpan_user_id") || DEFAULT_USER : DEFAULT_USER;
    const url = `http://localhost:8000/arena/stream?query=${encodeURIComponent(query)}&user_id=${userId}`;
    
    const sse = new EventSource(url);
    eventSourceRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        
        switch (data.type) {
          case "chunk":
            setResponses((prev) => ({
              ...prev,
              [data.model]: (prev[data.model] || "") + data.text
            }));
            break;
            
          case "generation_complete":
            setPhase("evaluating");
            break;
            
          case "evaluation_complete":
            const results = data.evaluations;
            const evalDict: Record<string, ModelEval> = {};
            results.forEach((r: any) => { evalDict[r.model] = r; });
            setEvaluations(evalDict);
            setWinner(data.winner);
            setVerdict(data.verdict);
            setPhase("complete");
            setIsBattling(false);
            sse.close();
            break;
            
          case "error":
             console.error("Arena error:", data.error);
             break;
        }
      } catch (err) {
        console.error("Failed to parse SSE", err);
      }
    };

    sse.onerror = () => {
      sse.close();
      setIsBattling(false);
      setPhase("idle");
    };
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const renderProgress = (val: number, color: string) => (
    <div className="w-full h-[6px] bg-[#1E2330] rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${val}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border-main"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <p className="text-[10px] font-mono text-success uppercase tracking-wider">
              ● AUTOMATED LLM BENCHMARK
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-display">
            ⚔ Model Arena
          </h1>
          <p className="text-text-secondary text-sm font-body">
            Submit query prompts to compare multiple clinical large language models. The evaluator judge scores outputs on accuracy and precision metrics.
          </p>
        </div>

        {phase !== "idle" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4.5 py-2 bg-bg-elevated text-white rounded-lg border border-border-main flex items-center gap-2.5 shrink-0"
          >
            {phase === "generating" && <div className="w-3.5 h-3.5 rounded-full border-2 border-t-white border-r-white border-b-white/20 border-l-white/20 animate-spin" />}
            {phase === "evaluating" && <Activity className="w-3.5 h-3.5 text-warning animate-pulse" />}
            {phase === "complete" && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
              {phase === "generating" ? "Generating Model Responses..." :
               phase === "evaluating" ? "Judge Scoring Outputs..." :
               "Evaluation Complete"}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Query Input Field Row ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-3 items-stretch"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isBattling}
          className="flex-1 bg-[#181C24] border border-[#1E2330] rounded-lg h-12 px-4 text-[15px] font-body text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          placeholder="Enter a clinical query context or question..."
        />
        <button
          onClick={startBattle}
          disabled={isBattling || !query.trim()}
          className="shrink-0 h-12 bg-black hover:brightness-110 active:scale-[0.99] border border-border-main text-white px-6 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Swords size={14} /> Let them battle ▶
        </button>
      </motion.div>

      {/* ── Model Arena Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {ARENA_MODELS.map((model) => {
          const isWinner = winner === model.id;
          const evalData = evaluations[model.id];
          const hasResponse = responses[model.id] && responses[model.id].trim().length > 0;

          return (
            <motion.div 
              key={model.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col bg-[#111318] rounded-xl border border-border-main transition-all duration-355 relative overflow-hidden min-h-[500px] ${
                isWinner ? "ring-2 ring-warning/30 border-warning/45" : ""
              }`}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: model.color }} />
              
              {/* Header block */}
              <div className="p-5 border-b border-border-main/50 flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-semibold text-white font-display flex items-center gap-2">
                    {model.name}
                    {isWinner && <Trophy size={14} className="text-warning fill-warning/20" />}
                  </h3>
                  <p className="text-[12px] font-mono text-text-muted mt-0.5">{model.tag}</p>
                </div>
                {evalData && (
                  <span className="text-24 font-semibold text-white font-mono leading-none">
                    {evalData.overall.toFixed(1)}<span className="text-[10px] text-text-muted font-bold ml-0.5">/10</span>
                  </span>
                )}
              </div>

              {/* Outputs Box / Response Area */}
              <div className="flex-1 overflow-y-auto p-5 max-h-[360px] min-h-[200px] border-b border-border-main/50 relative">
                {hasResponse ? (
                  <div className="relative">
                    <MarkdownText content={responses[model.id].replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim()} />
                    {isBattling && phase === "generating" && (
                      <span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse" />
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted text-[13px] font-body italic">
                    {phase === "idle" ? "Waiting for query..." : "Awaiting API Response..."}
                  </div>
                )}
              </div>

              {/* Judge evaluation details */}
              <div className={`p-5 transition-all duration-300 ${
                evalData ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0 p-0 overflow-hidden"
              }`}>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-3 block font-mono">
                  Nano Judge Scorecard
                </span>

                {evalData && (
                  <div className="space-y-3">
                    {[
                      { key: 'clinical_accuracy', title: 'Clinical Accuracy', color: '#4F8EF7' },
                      { key: 'structural_clarity', title: 'Clarity', color: '#8B5CF6' },
                      { key: 'actionability', title: 'Actionability', color: '#00D4A0' },
                      { key: 'preciseness', title: 'Preciseness', color: '#E5534B' },
                    ].map((metric) => {
                      const scoreVal = evalData.scores[metric.key as keyof typeof evalData.scores] ?? 0;
                      return (
                        <div key={metric.key}>
                          <div className="flex justify-between text-[10px] font-mono text-text-secondary mb-1 uppercase tracking-wider">
                            <span>{metric.title}</span>
                            <span>{scoreVal}%</span>
                          </div>
                          {renderProgress(scoreVal, metric.color)}
                        </div>
                      );
                    })}

                    <div className="border-t border-border-main/50 pt-3 mt-2">
                      <p className="text-[12px] font-semibold text-text-secondary italic leading-relaxed">
                        "{evalData.critique}"
                      </p>

                      {evalData.thought_process && (
                        <details className="mt-3 group">
                          <summary className="text-[9px] font-bold text-text-muted cursor-pointer hover:text-white select-none list-none flex items-center gap-1 font-mono">
                            <span className="transition-transform group-open:rotate-90">▶</span> Evaluation Thoughts
                          </summary>
                          <div className="mt-2 p-3 bg-bg-elevated border border-border-main rounded-md max-h-36 overflow-y-auto">
                            <MarkdownText content={evalData.thought_process} className="text-[10px] text-text-secondary font-mono" />
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Latency footer */}
              <div className="px-5 py-2.5 bg-bg-elevated/20 border-t border-border-main/30 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>LATENCY</span>
                <span>{hasResponse ? "~180ms" : "0ms"}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Winner Final Verdict Banner ── */}
      <AnimatePresence>
        {phase === "complete" && verdict && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 shadow-[0_0_24px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_120%,rgba(245,158,11,0.05),transparent_50%)] pointer-events-none" />
            <div className="flex flex-col md:flex-row gap-5 relative z-10 items-start">
              <div className="bg-warning/10 border border-warning/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-6 h-6 text-warning animate-bounce" />
              </div>
              <div className="space-y-2.5 flex-1">
                <h4 className="text-[10px] font-bold text-warning uppercase tracking-widest font-mono">
                  Supreme Judge Final Verdict
                </h4>
                <div className="text-xs text-text-secondary leading-relaxed font-body bg-bg-elevated border border-border-main p-4 rounded-xl">
                  "{verdict}"
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                  Winner: {ARENA_MODELS.find((m) => m.id === winner)?.name || winner}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
