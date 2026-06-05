"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Paperclip, Send, AlertTriangle, FileText, Heart, Moon, Zap, 
  Lightbulb, RefreshCw, Activity, ArrowUpRight, Cpu 
} from "lucide-react";
import { api, type DocSession, type HealthDataInput } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const INITIAL_CHIPS = [
  "What's driving my risk score?",
  "Explain my causal chain",
  "What if my stress drops to 3?",
  "Which metric should I fix first?",
];

const DOC_CHIPS = [
  "Summarise this report",
  "What are the abnormal values?",
  "What do these results mean for me?",
  "What should I do about this?",
];

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: `**Hello, I'm Darpan** — your Cognitive Health Twin.

I have access to your health profile including risk scores, SHAP values, causal relationships, and simulation projections.

You can also **upload any clinical document** (PDF, image, text) and I will extract findings directly, cross-referencing with your live baseline telemetry.

Ask me anything about your parameters.`,
};

const ACCEPTED_TYPES = ".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.csv";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<string[]>(INITIAL_CHIPS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userId, setUserId] = useState("");
  const [docSession, setDocSession] = useState<DocSession | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [vitals, setVitals] = useState<HealthDataInput | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const uid = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    setUserId(uid);

    api.getLatestHealth(uid)
      .then(setVitals)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleUpload(file: File) {
    if (!file || !userId) return;
    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("file", file);

      const res = await fetch(`${BASE}/chat/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Upload failed");

      setDocSession(data);
      setChips(DOC_CHIPS);

      const sysMsg: Message = {
        id: `doc-${Date.now()}`,
        role: "assistant",
        content: `📄 **Document loaded: ${data.filename}**\n\nI've read and indexed ${data.chunk_count} sections. You can now ask questions about the document, and I'll cross-reference it with your live health profile.\n\n_Preview: ${data.preview.slice(0, 150)}..._`,
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err: any) {
      setUploadError(err.message ?? "Failed to process document");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  async function handleRemoveDoc() {
    if (!docSession) return;
    await fetch(`${BASE}/chat/upload/${docSession.session_id}`, { method: "DELETE" });
    setDocSession(null);
    setChips(INITIAL_CHIPS);
    const sysMsg: Message = {
      id: `undoc-${Date.now()}`,
      role: "assistant",
      content: "Document removed. I'm back to answering from your live health profile.",
    };
    setMessages((prev) => [...prev, sysMsg]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() { setDragOver(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !userId) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };
      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      const history = messages
        .filter((m) => m.id !== "welcome" && !m.id.startsWith("doc-") && !m.id.startsWith("undoc-"))
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${BASE}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            message: text.trim(),
            history,
            doc_session_id: docSession?.session_id ?? null,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "token") {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: m.content + evt.content } : m)
                );
              }
              if (evt.type === "done") {
                setChips(evt.chips?.length ? evt.chips : (docSession ? DOC_CHIPS : INITIAL_CHIPS));
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
              }
              if (evt.type === "error") {
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId ? { ...m, content: evt.message, streaming: false } : m
                ));
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, content: "Connection failed. Please try again.", streaming: false } : m
          ));
        }
      } finally {
        setIsStreaming(false);
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
      }
    },
    [userId, messages, isStreaming, docSession]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="max-w-7xl mx-auto pb-6 relative h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 items-stretch"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drag-over overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-[#4F8EF7]/10 backdrop-blur-sm border-2 border-dashed border-[#4F8EF7] rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <FileText className="w-12 h-12 text-[#4F8EF7] mx-auto animate-bounce" />
            <p className="text-white font-bold text-sm uppercase tracking-wider font-display">Drop medical document here</p>
            <p className="text-text-secondary text-xs font-mono">PDF, Image, or CSV data sheet</p>
          </div>
        </div>
      )}

      {/* Left Column: Chat Conversation */}
      <div className="flex-1 bg-bg-surface border border-border-main rounded-xl flex flex-col overflow-hidden h-full">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-border-main/50 flex items-center justify-between shrink-0 bg-[#0D0F15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#4F8EF7] flex items-center justify-center text-white shadow-sm shrink-0">
              <Lightbulb size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-white font-display">Darpan AI</h2>
              <p className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">
                COGNITIVE HEALTH TWIN · DOCUMENT RAG · GROQ
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isStreaming}
              className="px-3 h-8 bg-transparent hover:bg-bg-elevated border border-border-main text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {uploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="text-[12px]">Upload report ↑</span>
              )}
            </button>
            
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D4A0]/10 border border-[#00D4A0]/20 text-[#00D4A0] text-[9px] font-mono uppercase tracking-wider font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" /> Live
            </span>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#0A0C10]/40">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Upload error banner if any */}
        {uploadError && (
          <div className="px-5 py-3 bg-danger/10 border-t border-danger/20 flex items-center gap-2 text-danger text-[10px] font-bold uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto text-text-muted hover:text-white font-black">Dismiss</button>
          </div>
        )}

        {/* Suggestion Chips */}
        {!isStreaming && (
          <div className="px-5 py-3 border-t border-border-main/40 overflow-x-auto shrink-0 bg-[#0D0F15] scrollbar-none">
            <div className="flex gap-2">
              {chips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="h-[34px] px-4 rounded-full bg-[#181C24] border border-[#1E2330] hover:border-[#4F8EF7] text-text-secondary hover:text-white text-[13px] font-body transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Console */}
        <div className="p-4 border-t border-border-main/50 bg-[#0D0F15] shrink-0 space-y-3">
          <div className="bg-[#181C24] border border-[#1E2330] rounded-xl h-[52px] px-3.5 flex items-center gap-3 focus-within:border-[#4F8EF7]/55 transition-colors">
            <Paperclip 
              size={16} 
              className="text-text-muted cursor-pointer hover:text-white transition-colors"
              onClick={() => fileInputRef.current?.click()}
            />
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask about your health data..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-[14px] font-body text-white placeholder-text-muted outline-none max-h-12 py-3 disabled:opacity-50"
            />

            {isStreaming ? (
              <button
                onClick={handleStop}
                className="w-9 h-9 rounded-full bg-danger/10 border border-danger/20 text-danger flex items-center justify-center hover:bg-danger/20 transition-all cursor-pointer shrink-0"
              >
                <div className="w-3 h-3 bg-danger rounded-sm" />
              </button>
            ) : (
              <AnimatePresence>
                {(input.trim() || inputFocused) && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="w-9 h-9 rounded-full bg-[#4F8EF7] hover:brightness-110 disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    <Send size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-start gap-2.5 bg-[#F5A623]/5 border-l-[3px] border-l-[#F5A623] rounded-md px-3.5 py-2.5">
            <AlertTriangle size={16} className="text-[#F5A623] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8B92A5] font-body leading-relaxed">
              Medical Disclaimer: DarpanAI answers are informational and not diagnostic health treatments. Always verify predictions with professionals.
            </p>
          </div>
        </div>

      </div>

      {/* Right Column: Digital Twin Context Summary */}
      <div className="w-full lg:w-80 bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col gap-5 shrink-0 h-full overflow-y-auto shadow-[0_0_24px_rgba(0,0,0,0.3)]">
        <div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            Twin Parameters
          </span>
          <h4 className="text-sm font-semibold text-white font-display">Active Context</h4>
        </div>

        {/* Vitals Summary logs */}
        {vitals ? (
          <div className="space-y-4">
            <div className="bg-[#181C24] border border-border-main rounded-lg p-3.5 space-y-3 font-mono">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block border-b border-border-main/50 pb-2">
                Biometric Telemetry
              </span>
              {[
                { label: "Heart Rate", val: Math.round(vitals.heart_rate), unit: "bpm", icon: Heart, color: "text-danger" },
                { label: "Sleep", val: Number(vitals.sleep.toFixed(1)), unit: "hrs", icon: Moon, color: "text-primary" },
                { label: "Steps", val: Math.round(vitals.steps).toLocaleString(), unit: "steps", icon: Activity, color: "text-success" },
                { label: "Stress Level", val: vitals.stress_level, unit: "/10", icon: Zap, color: "text-warning" },
              ].map(({ label, val, unit, icon: Icon, color }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                  </span>
                  <span className="text-white font-semibold">{val} <span className="text-[10px] text-text-muted">{unit}</span></span>
                </div>
              ))}
            </div>

            {docSession ? (
              <div className="bg-[#00D4A0]/5 border border-[#00D4A0]/20 text-white rounded-lg p-3.5 space-y-2">
                <span className="text-[9px] font-bold text-success uppercase tracking-widest block border-b border-[#00D4A0]/10 pb-2 font-mono">
                  Document RAG Indexed
                </span>
                <div className="flex items-start gap-2 text-xs">
                  <FileText className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold truncate max-w-[180px]">{docSession.filename}</p>
                    <p className="text-[10px] text-success mt-1 font-mono">{docSession.chunk_count} Sections Loaded</p>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveDoc}
                  className="w-full mt-2 bg-success hover:brightness-110 text-[#0A0C10] rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer font-mono"
                >
                  Detach Document
                </button>
              </div>
            ) : (
              <div className="bg-[#181C24]/50 border border-border-main rounded-lg p-4 text-center py-6 space-y-2.5">
                <FileText className="w-7 h-7 text-text-muted mx-auto" />
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">No Document Linked</p>
                <p className="text-[9px] text-text-muted leading-relaxed font-body">Drag medical files onto the chat to augment agent memory context.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
            No Baseline Telemetry
          </div>
        )}
      </div>

    </div>
  );
}

// ── Message Bubble ──

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div 
          className="max-w-[75%] bg-[#4F8EF7] text-white p-3.5 shadow-md font-body text-[14px]"
          style={{ borderRadius: "16px 16px 4px 16px" }}
        >
          <p className="leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const isThinking = message.streaming && !message.content;

  return (
    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
        <Lightbulb size={15} />
      </div>
      <div className="flex-1">
        <div className="bg-[#111318] border border-border-main border-l-[3px] border-l-[#00D4A0] rounded-lg p-5 shadow-sm space-y-2.5">
          <div className="text-[15px] font-display text-white">
            Hello, I'm <span className="font-semibold text-[#00D4A0]">Darpan</span>
          </div>

          {isThinking ? (
            <div className="flex items-center gap-1.5 py-1.5">
              <span className="w-1.5 h-1.5 bg-[#00D4A0] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#00D4A0] rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#00D4A0] rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <MarkdownText text={message.content} streaming={message.streaming} />
          )}
        </div>
      </div>
    </div>
  );
}

function MarkdownText({ text, streaming }: { text: string; streaming?: boolean }) {
  if (!text) return null;
  const lines = text.split("\n");
  
  return (
    <div className="text-[14px] text-text-secondary leading-[1.7] space-y-2.5 font-body">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return (
            <div key={i} className="flex items-start gap-2.5 ml-2.5">
              <span className="w-1.5 h-1.5 bg-[#00D4A0] rounded-full shrink-0 mt-2" />
              <span>{renderInline(line.replace(/^[•\-]\s*/, ""))}</span>
            </div>
          );
        }
        if (line.trim().startsWith("_") && line.trim().endsWith("_")) {
          return <p key={i} className="text-[10px] text-text-muted italic tracking-tight font-mono">{line.trim().slice(1, -1)}</p>;
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
      {streaming && (
        <span className="inline-block w-1.5 h-4 bg-primary rounded-sm animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Highlight RAG links or actions if bolded in primary color
    if (part.includes("upload") || part.includes("Upload")) {
      return <span key={i} className="text-[#4F8EF7] font-semibold">{part}</span>;
    }
    return part;
  });
}
