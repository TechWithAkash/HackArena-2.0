"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, Heart, Activity, ShieldAlert, Cpu } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleDemoLogin() {
    sessionStorage.setItem("darpan_user_id", "user_demo_001");
    sessionStorage.setItem("darpan_user_name", "Roshan");
    router.push("/dashboard");
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleDemoLogin();
  }

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-primary/20 selection:text-primary relative overflow-hidden font-body text-text-primary">
      
      {/* Inline styles for ECG heartbeat animation and layout details */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ecg-pulse {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-ecg {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: ecg-pulse 12s linear infinite;
        }
      `}} />

      {/* ── Left Column: Digital Twin Medical Terminal ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0B0D13] border-r border-border-main relative flex-col justify-between p-12 overflow-hidden select-none">
        
        {/* Schematic Blueprint Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F0F2F7" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Top Header info */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="font-mono text-[10px] font-bold tracking-widest text-success uppercase">
              Twin Core Online
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-muted">
            SYS.VER // 2.4.0
          </span>
        </div>

        {/* Main Terminal Mock Graphic */}
        <div className="relative z-10 my-auto space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
              <Cpu size={12} className="animate-pulse" /> AI Causal Core
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">
              Darpan<span className="text-primary">AI</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              A clinical-grade healthcare intelligence platform using causal AI pipelines to construct your digital twin.
            </p>
          </div>

          {/* Heartbeat ECG simulator */}
          <div className="bg-bg-surface border border-border-main rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-danger" />
                <span className="font-display font-semibold text-xs text-white uppercase tracking-wider">Live Twin Waveform</span>
              </div>
              <span className="font-mono text-[11px] font-black text-danger">72 BPM</span>
            </div>
            <div className="h-16 relative overflow-hidden bg-bg-base/50 rounded-lg border border-border-main/40 flex items-center">
              <svg className="w-full h-full text-danger/80" viewBox="0 0 600 80" fill="none">
                <path 
                  className="animate-ecg" 
                  d="M0 40 L120 40 L130 20 L140 60 L150 40 L260 40 L270 20 L280 65 L290 5 L300 45 L310 40 L450 40 L460 20 L470 60 L480 40 L600 40" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
          </div>

          {/* Explainability Coefficient Mock */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "BMI Node", val: "23.5", indicator: "neutral", desc: "Z-score 0.1" },
              { label: "Systolic BP", val: "128", indicator: "warning", desc: "elevated" },
              { label: "SHAP Conf.", val: "94.2%", indicator: "success", desc: "optimal" },
            ].map((node, i) => (
              <div key={i} className="bg-bg-surface border border-border-main rounded-xl p-3.5 space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary block font-mono">{node.label}</span>
                <span className="text-base font-black font-mono block text-white">{node.val}</span>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    node.indicator === "success" ? "bg-success" : node.indicator === "warning" ? "bg-warning" : "bg-text-secondary"
                  }`} />
                  <span className="text-[8px] font-bold text-text-muted font-mono uppercase">{node.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>SECURED // SHA-256</span>
          <span>© 2026 DARPAN.AI</span>
        </div>

      </div>

      {/* ── Right Column: Login Portal ── */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 relative">
        
        {/* Glow Radial Orbs */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[20%] w-[350px] h-[350px] bg-success/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Return Home Link */}
        <div className="flex justify-between items-center relative z-10">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-bg-surface border border-border-main"
          >
            ← Home
          </Link>
          <span className="lg:hidden font-extrabold tracking-tight font-display text-white text-lg">
            Darpan<span className="text-primary">AI</span>
          </span>
        </div>

        {/* Centered Login Card */}
        <div className="my-auto mx-auto w-full max-w-[420px] relative z-10 space-y-6">
          
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto lg:mx-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-3">
              <Fingerprint size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-tight">
              Provider Access
            </h2>
            <p className="text-xs text-text-secondary font-body">
              Authenticate to sync with your digital twin node.
            </p>
          </div>

          {/* Try Demo Button */}
          <button
            onClick={handleDemoLogin}
            type="button"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer font-display font-medium text-[14px] hover:brightness-[1.1] hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-primary/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Try Demo — Login as Roshan →
          </button>

          {/* Divider */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-border-main" />
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              or sign in manually
            </span>
            <div className="flex-1 h-[1px] bg-border-main" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">
                Provider Email
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.roshan@darpan.ai" 
                className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white placeholder-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">
                  Security Passkey
                </label>
                <span className="text-[11px] text-primary font-bold hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white placeholder-text-muted tracking-widest"
              />
            </div>

            <button 
              type="submit" 
              className="w-full h-11 bg-white hover:bg-slate-100 text-[#0F1420] font-semibold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-[0.98] mt-2 shadow-sm"
            >
              Sign In Securely
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-[12px] text-text-secondary font-body text-center pt-2">
            New Provider?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Register Identity
            </Link>
          </div>

        </div>

        {/* Footer Help */}
        <div className="text-[10px] text-text-muted text-center relative z-10">
          Need support? Contact IT diagnostic administration.
        </div>

      </div>

    </div>
  );
}
