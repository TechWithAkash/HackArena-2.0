"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Trophy, Swords, Shield, HeartPulse, AlignLeft, Activity, Target, CheckCircle2 } from "lucide-react";
function MarkdownText({ content, className }: { content: string, className?: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**")) return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*")) return <em key={i} className="text-gray-800">{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });
  };
  return (
    <div className={`leading-relaxed space-y-2 ${className || 'text-sm text-gray-700'}`}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.match(/^#+\s/)) return <h4 key={i} className="font-bold text-gray-900 mt-2 mb-1 text-[1.1em]">{line.replace(/^#+\s/, "")}</h4>;
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full shrink-0 mt-2" />
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
  { id: "gptoss", name: "GPT OSS 120B Flagship", tag: "openai/gpt-oss-120b", color: "from-blue-500 to-cyan-500", border: "border-cyan-200" },
  { id: "llama", name: "Llama 3.3 Flagship", tag: "llama-3.3-70b-versatile", color: "from-indigo-500 to-violet-500", border: "border-indigo-200" },
  { id: "qwen", name: "Qwen 32B Benchmark", tag: "qwen/qwen3-32b", color: "from-orange-500 to-amber-500", border: "border-orange-200" },
];

export default function ArenaPage() {
  const [query, setQuery] = useState("Based on my latest vitals, what is the safest way to lower my blood pressure without medication?");
  const [isBattling, setIsBattling] = useState(false);
  const [phase, setPhase] = useState<"idle" | "generating" | "evaluating" | "complete">("idle");
  
  // Model state
  const [responses, setResponses] = useState<Record<string, string>>({ gptoss: "", llama: "", qwen: "" });
  const [evaluations, setEvaluations] = useState<Record<string, ModelEval | null>>({ gptoss: null, llama: null, qwen: null });
  const [winner, setWinner] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const startBattle = () => {
    if (!query.trim()) return;
    
    // Reset state
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
            // In the backend we yield this twice now (before and after evaluation).
            // We just ensure we are in evaluation phase if not already complete.
            if (setPhase) setPhase("evaluating");
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
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{ width: `${val}%` }} />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] flex flex-col font-sans">
      
      {/* ── Header Area ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                  Automated LLM Benchmark
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <Swords className="w-7 h-7 text-gray-400" /> Model Arena
              </h1>
            </div>

            {/* Status Badge */}
            {phase !== "idle" && (
              <div className="px-4 py-2 bg-gray-900 text-white rounded-xl shadow-lg border border-gray-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                 {phase === "generating" && <div className="w-4 h-4 rounded-full border-2 border-t-white border-r-white border-b-white/20 border-l-white/20 animate-spin" />}
                 {phase === "evaluating" && <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />}
                 {phase === "complete" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                 <span className="text-xs font-bold uppercase tracking-widest">
                   {phase === "generating" ? "Models Racing..." :
                    phase === "evaluating" ? "Nano Judge Analyzing..." :
                    "Benchmarking Complete"}
                 </span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isBattling}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner disabled:opacity-50"
              placeholder="Enter a clinical scenario or question..."
            />
            <button
              onClick={startBattle}
              disabled={isBattling || !query.trim()}
              className="shrink-0 flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Play className="w-4 h-4" fill="currentColor" /> Let them battle
            </button>
          </div>
        </div>
      </div>

      {/* ── Arena Columns ── */}
      <div className="flex-1 overflow-x-auto p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {ARENA_MODELS.map((model) => {
            const isWinner = winner === model.id;
            const evalData = evaluations[model.id];

            return (
              <div 
                key={model.id}
                className={`flex flex-col bg-white rounded-[2rem] border transition-all duration-700 h-full max-h-[75vh] 
                  ${isWinner ? "border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.2)] scale-[1.02] z-10" : "border-gray-200 shadow-sm"}
                `}
              >
                {/* Model Header */}
                <div className={`p-5 px-6 border-b border-gray-100 rounded-t-[2rem] flex items-center justify-between relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${model.color}`} />
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                       {model.name}
                       {isWinner && <Trophy className="w-5 h-5 text-amber-500 ml-1" fill="currentColor" />}
                    </h3>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{model.tag}</p>
                  </div>
                  {evalData && (
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">
                        {evalData.overall.toFixed(1)}<span className="text-base text-gray-400 font-bold ml-1">/10</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Model Output (Streaming Text) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {responses[model.id] ? (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-600">
                      <MarkdownText content={responses[model.id].replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim()} className="" />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm">
                      {phase === "idle" ? "Waiting for query..." : "Awaiting API connection..."}
                    </div>
                  )}
                </div>

                {/* Judge's Scorecard Panel */}
                <div className={`border-t border-gray-100 p-6 bg-white rounded-b-[2rem] transition-all duration-700 overflow-hidden ${
                  evalData ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 p-0 border-transparent"
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[9px] font-black uppercase tracking-widest">
                       Nano Judge Eval
                    </span>
                  </div>

                  {evalData && (
                    <div className="space-y-4">
                      {/* KPI 1 */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-500"/> Clinical Accuracy</span>
                          <span>{evalData.scores.clinical_accuracy}%</span>
                        </div>
                        {renderProgress(evalData.scores.clinical_accuracy, "from-blue-400 to-blue-500")}
                      </div>
                      
                      {/* KPI 2 */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5 text-indigo-500"/> Structural Clarity</span>
                          <span>{evalData.scores.structural_clarity}%</span>
                        </div>
                        {renderProgress(evalData.scores.structural_clarity, "from-indigo-400 to-indigo-500")}
                      </div>

                      {/* KPI 3 */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-500"/> Actionability</span>
                          <span>{evalData.scores.actionability}%</span>
                        </div>
                        {renderProgress(evalData.scores.actionability, "from-emerald-400 to-emerald-500")}
                      </div>

                      {/* KPI 4 */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-rose-500"/> Preciseness</span>
                          <span>{evalData.scores.preciseness}%</span>
                        </div>
                        {renderProgress(evalData.scores.preciseness, "from-rose-400 to-rose-500")}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2">
                        <p className="text-[11px] font-medium text-gray-800 italic leading-snug">
                          "{evalData.critique}"
                        </p>
                        {evalData.thought_process && (
                          <details className="group mt-1">
                            <summary className="text-[10px] font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1 select-none">
                              <span className="group-open:rotate-90 transition-transform text-[8px]">▶</span> View Evaluation Thinking
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto overscroll-contain border border-gray-100">
                              <MarkdownText content={evalData.thought_process} className="text-[10px] text-gray-500 font-mono" />
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        
        {/* ── Supreme Judge Final Verdict ── */}
        {phase === "complete" && verdict && (
          <div className="max-w-[1400px] mx-auto mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white border-2 border-amber-300 rounded-[2rem] p-8 shadow-[0_10px_40px_-10px_rgba(251,191,36,0.3)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="flex items-start gap-6 relative z-10">
                <div className="shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                  <Trophy className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">FINAL VERDICT</h2>
                  <div className="text-sm font-medium text-gray-700 leading-relaxed italic bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                    "{verdict}"
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      Winner Declared: {ARENA_MODELS.find((m) => m.id === winner)?.name || winner}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
