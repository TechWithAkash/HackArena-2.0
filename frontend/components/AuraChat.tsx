"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function AuraChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userInput = input.trim();
    const userMsg: ChatMessage = { role: "user", content: userInput };

    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
      const history = messages
        .filter((m) => !m.streaming)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: userInput,
          history,
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
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + evt.content,
                  };
                }
                return updated;
              });
            }

            if (evt.type === "done" || evt.type === "error") {
              const errorContent = evt.type === "error" ? evt.message ?? "Something went wrong." : null;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: errorContent ?? last.content,
                    streaming: false,
                  };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: "I'm having a brief connection issue. Can you try again in a moment?",
              streaming: false,
            };
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  }

  function handleClose() {
    abortRef.current?.abort();
    setIsOpen(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Darpan AI</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Cognitive Health Twin</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Hello, I'm Aura.</p>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                    Ask me anything about your current risk parameters or physical habits.
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white border border-slate-200/60 text-slate-800 shadow-sm rounded-tl-none"
                    }`}
                  >
                    {m.content}
                    {m.streaming && m.content && (
                      <span className="inline-block w-1.5 h-3.5 bg-slate-400 rounded-sm animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading &&
                messages[messages.length - 1]?.role === "assistant" &&
                messages[messages.length - 1]?.content === "" && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/60 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Talk to Aura..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 cursor-pointer ${
          isOpen ? "bg-slate-900 rotate-90" : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
