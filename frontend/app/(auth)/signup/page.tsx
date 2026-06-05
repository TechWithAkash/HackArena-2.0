"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Mail, UserPlus, HeartPulse, Sparkles, RefreshCw, Cpu, Activity } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("35");
  const [gender, setGender] = useState("male");
  const [bmi, setBmi] = useState("23.5");
  const [whr, setWhr] = useState("0.85");
  const [sleep, setSleep] = useState("7.0");
  const [steps, setSteps] = useState("8000");
  const [stress, setStress] = useState("4");
  const [diet, setDiet] = useState("6");
  
  // Initialization ticks for Step 4
  const [initStage, setInitStage] = useState(0);

  useEffect(() => {
    if (step === 4) {
      const timers = [
        setTimeout(() => setInitStage(1), 800),
        setTimeout(() => setInitStage(2), 1600),
        setTimeout(() => setInitStage(3), 2400),
        setTimeout(() => setInitStage(4), 3200),
        setTimeout(() => {
          sessionStorage.setItem("darpan_user_id", "user_demo_001");
          sessionStorage.setItem("darpan_user_name", name || "Roshan");
          router.push("/dashboard");
        }, 4200),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-primary/20 selection:text-primary relative overflow-hidden font-body text-text-primary">
      
      {/* Inline styles for ECG heartbeat animation */}
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
              <pattern id="grid-signup" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F0F2F7" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-signup)" />
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
              Registration Pipeline Active
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-muted">
            SYS.VER // 2.4.0
          </span>
        </div>

        {/* Main Terminal Mock Graphic */}
        <div className="relative z-10 my-auto space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 px-3 py-1 rounded-full text-success font-mono text-[10px] font-bold uppercase tracking-wider">
              <Cpu size={12} className="animate-pulse" /> Calibration Engine
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">
              Darpan<span className="text-primary">AI</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              Step through our registration wizard to initialize your wearable sensors, lifestyle factors, and biomarker baseline coefficients.
            </p>
          </div>

          {/* Heartbeat ECG simulator */}
          <div className="bg-bg-surface border border-border-main rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-success" />
                <span className="font-display font-semibold text-xs text-white uppercase tracking-wider">Baseline Diagnostic Sync</span>
              </div>
              <span className="font-mono text-[11px] font-black text-success">Calibrating...</span>
            </div>
            <div className="h-16 relative overflow-hidden bg-bg-base/50 rounded-lg border border-border-main/40 flex items-center">
              <svg className="w-full h-full text-success/80" viewBox="0 0 600 80" fill="none">
                <path 
                  className="animate-ecg" 
                  d="M0 40 L120 40 L130 25 L140 55 L150 40 L260 40 L270 20 L280 65 L290 5 L300 45 L310 40 L450 40 L460 30 L470 50 L480 40 L600 40" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
          </div>

          {/* Metrics Checklist */}
          <div className="space-y-2 font-mono text-[11px] text-text-secondary">
            <div className="flex justify-between border-b border-border-main/40 pb-1.5">
              <span>Sensor Signal Rate:</span>
              <span className="text-white">100 Hz</span>
            </div>
            <div className="flex justify-between border-b border-border-main/40 pb-1.5">
              <span>Telemetry Node Sync:</span>
              <span className="text-white">Awaiting Profile</span>
            </div>
            <div className="flex justify-between border-b border-border-main/40 pb-1.5">
              <span>Predictive Models Active:</span>
              <span className="text-white">CVD, Diabetes, Hypertension</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>INTEGRITY CHECK // PASSED</span>
          <span>© 2026 DARPAN.AI</span>
        </div>

      </div>

      {/* ── Right Column: Signup Card ── */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 relative">
        
        {/* Glow Radial Orbs */}
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-success/5 rounded-full blur-[100px] pointer-events-none" />

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

        {/* Centered Form Wizard Container */}
        <div className="my-auto mx-auto w-full max-w-[420px] relative z-10 space-y-6">
          
          {/* Step Progress Tracker */}
          {step < 4 && (
            <div className="w-full flex items-center justify-between pb-3 border-b border-border-main">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">Step {step} of 3</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      s === step ? "w-6 bg-primary" : s < step ? "w-2 bg-success" : "w-2 bg-border-main"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.form 
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={nextStep}
                className="space-y-4"
              >
                <div className="space-y-2 text-center lg:text-left">
                  <div className="mx-auto lg:mx-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-3">
                    <UserPlus size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-tight">
                    Register Patient Node
                  </h2>
                  <p className="text-xs text-text-secondary font-body">
                    Create a secure profile for twin integration.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Patient Full Name</label>
                  <div className="relative flex items-center">
                    <User size={14} className="absolute left-3.5 text-text-muted" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Roshan Ajith" 
                      className="bg-bg-surface border border-border-main pl-10 pr-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white placeholder-text-muted"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Primary Email</label>
                  <div className="relative flex items-center">
                    <Mail size={14} className="absolute left-3.5 text-text-muted" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="roshan@darpan.ai" 
                      className="bg-bg-surface border border-border-main pl-10 pr-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white placeholder-text-muted"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Secure Password</label>
                  <div className="relative flex items-center">
                    <Lock size={14} className="absolute left-3.5 text-text-muted" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="bg-bg-surface border border-border-main pl-10 pr-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white placeholder-text-muted tracking-widest"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-semibold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-[0.98] mt-2 shadow-sm"
                >
                  Initialize Twin Profile
                </button>
              </motion.form>
            )}

            {/* STEP 2: HEALTH BASELINE */}
            {step === 2 && (
              <motion.form 
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={nextStep}
                className="space-y-4"
              >
                <div className="space-y-2 text-center lg:text-left">
                  <div className="mx-auto lg:mx-0 w-10 h-10 rounded-xl bg-success/10 border border-success/25 flex items-center justify-center text-success mb-3">
                    <HeartPulse size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-tight">
                    Health Baseline
                  </h2>
                  <p className="text-xs text-text-secondary font-body">
                    Provide baseline parameters to calibrate the twin.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Age</label>
                    <input 
                      type="number" 
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="bg-bg-surface border border-border-main px-3.5 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white cursor-pointer"
                    >
                      <option className="bg-bg-surface text-white" value="male">Male</option>
                      <option className="bg-bg-surface text-white" value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">BMI</label>
                    <input 
                      type="text" 
                      required
                      value={bmi}
                      onChange={(e) => setBmi(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">WHR (Waist-Hip)</label>
                    <input 
                      type="text" 
                      required
                      value={whr}
                      onChange={(e) => setWhr(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="flex-1 h-11 bg-bg-surface border border-border-main text-text-secondary hover:text-white hover:bg-border-hover font-semibold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-semibold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: LIFESTYLE & INITIALIZE */}
            {step === 3 && (
              <motion.form 
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={nextStep}
                className="space-y-4"
              >
                <div className="space-y-2 text-center lg:text-left">
                  <div className="mx-auto lg:mx-0 w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-3">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-white font-display tracking-tight leading-tight">
                    Lifestyle Profile
                  </h2>
                  <p className="text-xs text-text-secondary font-body">
                    Calibrate daily wearable variables.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Sleep Hours</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Steps</label>
                    <input 
                      type="number" 
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Stress (1-10)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      value={stress}
                      onChange={(e) => setStress(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-wider">Diet (1-10)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      value={diet}
                      onChange={(e) => setDiet(e.target.value)}
                      className="bg-bg-surface border border-border-main px-4 py-3 h-11 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg w-full text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="flex-1 h-11 bg-bg-surface border border-border-main text-text-secondary hover:text-white hover:bg-border-hover font-semibold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 h-11 bg-success hover:bg-success/90 text-bg-base font-bold text-[13px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Create Twin Node
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: INITIALIZATION ANIMATION */}
            {step === 4 && (
              <motion.div 
                key="step-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center justify-center py-6 text-center"
              >
                <RefreshCw className="w-12 h-12 text-primary animate-spin mb-8" />
                
                <h2 className="text-xl font-semibold text-white font-display mb-6">
                  Creating Digital Health Twin...
                </h2>
                
                <div className="flex flex-col gap-3.5 w-full max-w-sm text-left font-mono text-[13px]">
                  {[
                    "Patient Identity Verified",
                    "SHAP Explainer Configured",
                    "Forecast Trajectories Pre-calculated",
                    "Causal Network Generated Successfully"
                  ].map((stageText, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: initStage >= idx ? 1 : 0.25, 
                        x: initStage >= idx ? 0 : -10 
                      }}
                      className="flex items-center gap-2.5 text-white font-medium"
                    >
                      {initStage > idx ? (
                        <span className="w-4.5 h-4.5 rounded-full bg-success/10 border border-success/25 text-success flex items-center justify-center text-[10px] font-bold">✓</span>
                      ) : (
                        <span className="w-4.5 h-4.5 rounded-full border border-border-main flex items-center justify-center text-[10px]" />
                      )}
                      {stageText}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div className="w-full text-center border-t border-border-main pt-4 mt-2 text-[12px] text-text-secondary">
              Existing Patient?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Access Portal
              </Link>
            </div>
          )}

        </div>

        {/* Footer Help */}
        <div className="text-[10px] text-text-muted text-center relative z-10">
          Need support? Contact IT diagnostic administration.
        </div>

      </div>

    </div>
  );
}
