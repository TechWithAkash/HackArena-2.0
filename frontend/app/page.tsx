"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Activity, Cpu, Target, GitBranch, Sparkles, ChevronRight, 
  Heart, Database, ShieldCheck, Zap
} from "lucide-react";

// Intersection-Observer based Count Up for numerical stats
function CountUp({ start, end, duration, suffix = "" }: { start: number; end: number; duration: number; suffix?: string }) {
  const [count, setCount] = useState(start);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [triggered, start, end, duration]);

  return <span ref={elementRef} className="font-mono tabular-nums">{count}{suffix}</span>;
}

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup Demo Login Session
  function handleDemoLogin() {
    sessionStorage.setItem("darpan_user_id", "user_demo_001");
    sessionStorage.setItem("darpan_user_name", "Roshan");
    router.push("/dashboard");
  }

  // Floating particles canvas background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    // Initialise 35 drifting particle nodes
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.5 + 0.8,
        color: Math.random() > 0.4 ? "rgba(79, 142, 247, 0.25)" : "rgba(0, 212, 160, 0.25)"
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap particles around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Framer motion animation variants
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const clipPathWordVariants = {
    hidden: { clipPath: "inset(0 100% 0 0)", y: 15 },
    show: { 
      clipPath: "inset(0 0% 0 0)", 
      y: 0, 
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const } 
    }
  };

  const generalFadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-[#06080E] relative overflow-hidden font-body text-text-primary">
      
      {/* Dynamic drifting background particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />

      {/* Global CSS overrides for the moving grid and rotation perspective */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift-grid {
          from { background-position: 0 0; }
          to { background-position: 40px 40px; }
        }
        .animate-drift-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(79, 142, 247, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(79, 142, 247, 0.05) 1px, transparent 1px);
          animation: drift-grid 10s linear infinite;
        }
        @keyframes pulse-glow-radial {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.95; }
        }
        .animate-radial-pulse {
          animation: pulse-glow-radial 6s ease-in-out infinite alternate;
        }
        @keyframes float-rotate {
          0%   { transform: rotateX(18deg) rotateY(-12deg); }
          50%  { transform: rotateX(16deg) rotateY(6deg); }
          100% { transform: rotateX(18deg) rotateY(-12deg); }
        }
        .animate-float-rotate {
          transform-style: preserve-3d;
          animation: float-rotate 14s ease-in-out infinite;
        }
        @keyframes node-pulse-anim {
          0%, 100% { transform: scale(1); box-shadow: 0 0 35px rgba(229, 83, 75, 0.2); }
          50% { transform: scale(1.06); box-shadow: 0 0 50px rgba(229, 83, 75, 0.35); }
        }
        .animate-node-pulse {
          animation: node-pulse-anim 3.5s ease-in-out infinite;
        }
        @keyframes dash-flow-anim {
          to { stroke-dashoffset: -40; }
        }
        .animate-dash-flow {
          stroke-dasharray: 8 6;
          animation: dash-flow-anim 2s linear infinite;
        }
      `}} />

      {/* Grid Drift Overlay */}
      <div className="absolute inset-0 animate-drift-grid pointer-events-none z-0" />

      {/* Pulsing Central Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-radial from-primary/8 to-transparent rounded-full blur-[90px] animate-radial-pulse pointer-events-none z-0" />

      {/* ── Section 1: Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#1A2035] bg-[#06080E]/85 backdrop-blur-md flex items-center justify-between px-6 md:px-12 select-none">
        
        {/* Logo and Tag */}
        <div className="flex items-center gap-2.5">
          <svg className="w-7 h-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-sm tracking-tight font-display">
              DARPAN.AI
            </span>
            <span className="font-mono text-[8px] tracking-widest text-success uppercase font-bold">
              Health Twin
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-display text-[12px] font-semibold tracking-wider text-text-secondary">
          {["Platform", "Philosophy", "Technology", "Architecture"].map((link) => (
            <span key={link} className="hover:text-white transition-colors cursor-pointer">
              {link}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-text-secondary hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
            Sign In
          </Link>
          <button
            onClick={handleDemoLogin}
            className="bg-primary hover:brightness-110 text-white font-mono text-[11px] font-bold rounded-full py-2 px-4.5 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
            </span>
            Demo Link
          </button>
        </div>
      </nav>

      {/* ── Section 2: Hero Section ── */}
      <section className="relative z-10 pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 flex flex-col items-center"
        >
          {/* Status Badge */}
          <motion.div 
            variants={generalFadeUp}
            className="bg-success/5 border border-success/25 rounded-full px-4.5 py-1.5 flex items-center gap-2"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
            </span>
            <span className="font-mono text-[10px] font-bold text-success uppercase tracking-widest">
              Causal Logic Diagnostic Pipeline Active
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight leading-[0.92] text-white max-w-5xl">
            <motion.span variants={clipPathWordVariants} className="block">Your Digital</motion.span>
            <motion.span 
              variants={clipPathWordVariants} 
              className="block bg-gradient-to-r from-text-primary via-primary to-success bg-clip-text text-transparent pb-2"
            >
              Health Twin
            </motion.span>
          </h1>

          {/* Subheading Description */}
          <motion.p 
            variants={generalFadeUp}
            className="max-w-xl text-text-secondary text-sm md:text-base leading-relaxed font-body"
          >
            In Sanskrit, <span className="text-success font-mono">"Darpan"</span> denotes a mirror. We model personal biological equilibrium using SHAP attribution graphs and causal structural logic to identify vulnerabilities.
          </motion.p>

          {/* Technology Tags Row */}
          <motion.div 
            variants={generalFadeUp}
            className="flex flex-wrap justify-center gap-2 pt-2"
          >
            {[
              "PRAKRITI SCM", 
              "SHAP EXPLAINERS", 
              "DOWHY GRAPHS", 
              "APPLE HEALTHKIT", 
              "WEARABLE TELEMETRY"
            ].map((tag) => (
              <span 
                key={tag} 
                className="bg-[#131720]/40 border border-[#1A2035] hover:border-primary/40 rounded-full px-3 py-1.5 font-mono text-[9px] font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* CTA Group */}
          <motion.div 
            variants={generalFadeUp}
            className="flex flex-col sm:flex-row gap-3 pt-4 w-full sm:w-auto"
          >
            <button
              onClick={handleDemoLogin}
              className="h-12 px-7 bg-primary hover:bg-primary-hover text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              Launch Instant Sandbox <ChevronRight size={14} />
            </button>
            <Link 
              href="/signup" 
              className="h-12 px-7 border border-[#263050] hover:border-primary hover:bg-primary/8 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center"
            >
              Register Account
            </Link>
          </motion.div>

        </motion.div>

        {/* ── Section 2B: The 3D Hero Diagram ── */}
        <div className="w-full max-w-4xl h-[480px] mt-16 relative perspective-[1200px] flex items-center justify-center overflow-hidden">
          
          {/* Vanishing grid floor overlay */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-[linear-gradient(to_bottom,transparent,#06080E)] pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-48 opacity-[0.05] border-t border-primary/20 pointer-events-none [transform:rotateX(75deg)] bg-[size:30px_30px] bg-[linear-gradient(to_right,rgba(79,142,247,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,142,247,0.3)_1px,transparent_1px)] z-0" />

          {/* SVG Connector Lines - Static references overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 480">
            {/* STRESS -> RISK */}
            <path id="path-stress" d="M 220 120 L 400 240" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3.5" fill="#F5A623">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M 220 120 L 400 240" />
            </circle>

            {/* SLEEP -> RISK */}
            <path id="path-sleep" d="M 260 360 L 400 240" stroke="rgba(0,212,160,0.4)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3.5" fill="#00D4A0">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 260 360 L 400 240" />
            </circle>

            {/* DIET -> STRESS */}
            <path id="path-diet" d="M 400 80 L 220 120" stroke="rgba(0,212,160,0.3)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3" fill="#00D4A0">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 400 80 L 220 120" />
            </circle>

            {/* HEART RATE -> RISK */}
            <path id="path-hr" d="M 580 120 L 400 240" stroke="rgba(79,142,247,0.4)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3.5" fill="#4F8EF7">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 580 120 L 400 240" />
            </circle>

            {/* BMI -> RISK */}
            <path id="path-bmi" d="M 600 320 L 400 240" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3.5" fill="#8B5CF6">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 600 320 L 400 240" />
            </circle>

            {/* ACTIVITY -> BMI */}
            <path id="path-act" d="M 420 400 L 600 320" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" className="animate-dash-flow" fill="none" />
            <circle r="3" fill="#8B5CF6">
              <animateMotion dur="2.6s" repeatCount="indefinite" path="M 420 400 L 600 320" />
            </circle>

            {/* Ambient Hexagon Rings (depth references) */}
            <circle cx="400" cy="240" r="160" stroke="rgba(79,142,247,0.02)" strokeWidth="1" fill="none" />
            <circle cx="400" cy="240" r="240" stroke="rgba(79,142,247,0.015)" strokeWidth="1" fill="none" strokeDasharray="5 5" />
          </svg>

          {/* Interactive Floating 3D Node Scene */}
          <div className="w-full h-full absolute inset-0 animate-float-rotate flex items-center justify-center z-10 pointer-events-none">
            
            {/* Node: RISK (Central) */}
            <div className="absolute left-[calc(50%-44px)] top-[calc(50%-44px)] w-22 h-22 rounded-full bg-danger/15 border-2 border-danger/60 text-danger flex flex-col items-center justify-center z-30 animate-node-pulse pointer-events-auto">
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-danger/80">SCM Goal</span>
              <span className="font-display font-black text-xs uppercase tracking-widest text-white">Risk Node</span>
              <span className="font-mono text-[9px] text-danger mt-0.5">Y = 0.51</span>
            </div>

            {/* Node: STRESS */}
            <div className="absolute left-[20%] top-[20%] w-[72px] h-[72px] rounded-full bg-warning/10 border border-warning/50 text-warning flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(80px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">Stress</span>
              <span className="font-mono text-[9px] font-bold">X1 = 8/10</span>
              <span className="absolute -bottom-5 font-mono text-[8.5px] text-warning bg-warning/5 border border-warning/20 px-1.5 py-0.5 rounded">SHAP +0.24</span>
            </div>

            {/* Node: SLEEP */}
            <div className="absolute left-[24%] top-[70%] w-[68px] h-[68px] rounded-full bg-success/10 border border-success/50 text-success flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(50px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">Sleep</span>
              <span className="font-mono text-[9px] font-bold">X2 = 7h</span>
              <span className="absolute -bottom-5 font-mono text-[8.5px] text-success bg-success/5 border border-success/20 px-1.5 py-0.5 rounded">SHAP -0.18</span>
            </div>

            {/* Node: DIET */}
            <div className="absolute left-[45%] top-[10%] w-[60px] h-[60px] rounded-full bg-success/10 border border-success/40 text-success flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(30px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">Diet</span>
              <span className="font-mono text-[9px] font-bold">X3 = 6/10</span>
            </div>

            {/* Node: HEART RATE */}
            <div className="absolute left-[70%] top-[20%] w-[68px] h-[68px] rounded-full bg-primary/10 border border-primary/50 text-primary flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(40px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">Vitals</span>
              <span className="font-mono text-[9px] font-bold">X4 = 72bpm</span>
              <span className="absolute -bottom-5 font-mono text-[8.5px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded">SHAP +0.12</span>
            </div>

            {/* Node: BMI */}
            <div className="absolute left-[72%] top-[62%] w-[64px] h-[64px] rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/50 text-[#8B5CF6] flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(60px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">BMI</span>
              <span className="font-mono text-[9px] font-bold">X5 = 23.5</span>
            </div>

            {/* Node: ACTIVITY */}
            <div className="absolute left-[48%] top-[80%] w-[60px] h-[60px] rounded-full bg-text-secondary/10 border border-border-main text-text-secondary flex flex-col items-center justify-center z-20 pointer-events-auto [transform:translateZ(20px)] hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-[10px] uppercase text-white">Steps</span>
              <span className="font-mono text-[9px] font-bold">X6 = 8k</span>
            </div>

          </div>

        </div>

      </section>

      {/* ── Section 3: Stats Bar ── */}
      <section className="relative z-10 bg-[#0D1017] border-y border-[#1A2035] py-8 select-none">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-[#1A2035]">
          {[
            { value: 120, label: "Simulation Horizon", suffix: "-Day" },
            { value: 98, label: "Clinical Calibration", suffix: "% Conf" },
            { value: 7, label: "SCM Directed DAG", suffix: "-Node" },
            { value: 89, label: "Shapley XAI Attribution", suffix: "% Acc" },
          ].map((stat, i) => (
            <div key={i} className="text-center px-4 space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight leading-none">
                <CountUp start={0} end={stat.value} duration={1200} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Inference Pipeline ── */}
      <section className="relative z-10 py-28 px-8 border-b border-[#1A2035]">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-success text-[10px] font-mono font-bold uppercase tracking-widest">
              Inference Pipeline
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight">
              How DarpanAI Resolves Imbalances
            </h2>
            <p className="text-text-secondary text-xs max-w-xl mx-auto font-body">
              Four distinct technical diagnostic layers mapping wearable telemetry to causal mitigation paths.
            </p>
          </div>

          {/* Cards Pipeline Sequence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* SVG horizontal flow line (desktop only) */}
            <div className="hidden lg:block absolute top-[44px] left-10 right-10 h-[1.5px] bg-border-main/50 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-success/30 to-primary/30 bg-[length:20px_100%] animate-pulse" />
            </div>

            {[
              { num: "01 / 04", icon: Activity, title: "Wearable Sync", desc: "Secure ingestion of biometric logs (heart rate, sleep stages, daily steps, estimated diet, BMI)." },
              { num: "02 / 04", icon: GitBranch, title: "SCM Calibration", desc: "DoWhy constraints map biometrics to a directed acyclic graph to calculate actual causal node links." },
              { num: "03 / 04", icon: Target, title: "Attribution Explainer", desc: "SHAP decomposition calculates biological factors which drive overall Prakriti health risk deviation." },
              { num: "04 / 04", icon: Cpu, title: "Trajectory Simulation", desc: "Causal mitigations run through a 120-day predictive twin trajectory for optimal parameter configuration." }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-[#0D1017] border border-[#1A2035] hover:border-primary/50 hover:-translate-y-1 rounded-2xl p-6.5 relative z-10 transition-all duration-300 group shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/20 flex items-center justify-center text-success group-hover:scale-105 transition-transform">
                      <Icon size={18} />
                    </div>
                    <span className="font-mono text-[9px] font-bold text-success uppercase tracking-widest">{step.num}</span>
                  </div>
                  <h3 className="text-white font-extrabold text-base mt-4 font-display">{step.title}</h3>
                  <p className="text-text-secondary text-xs leading-relaxed font-body mt-2">{step.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── Section 5: Prakriti Paradigm (Split Section) ── */}
      <section className="relative z-10 py-28 px-8 border-b border-[#1A2035]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column Description */}
          <div className="space-y-6">
            <span className="text-success text-[10px] font-mono font-bold uppercase tracking-widest">
              Prakriti Paradigm
            </span>
            <h2 className="text-3.5xl md:text-4.5xl font-black text-white font-display tracking-tight leading-none">
              Ayurvedic Insights.<br />Modern Diagnostics.
            </h2>
            <p className="text-text-secondary text-xs leading-relaxed font-body">
              Ayurvedic clinical medicine has mapped biological interconnectedness for centuries under the Prakriti framework. DarpanAI formalizes these system dynamics using structural causal models (SCM).
            </p>
            <p className="text-text-secondary text-xs leading-relaxed font-body">
              Rather than treating symptoms in isolation, the logic engine traces causal deviations (e.g. stress loading triggering cardiac variations and BMI transitions) to help guide upstream modifications.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "VATA ADAPTATIONS", 
                "PITTA DIAGNOSTICS", 
                "KARMA BALANCING", 
                "PRAKRITI INDEXING"
              ].map((chip) => (
                <span 
                  key={chip} 
                  className="bg-warning/5 border border-warning/20 text-warning px-3 py-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Root Imbalance */}
            <div className="bg-[#0D1017] border border-[#1A2035] rounded-xl p-5 space-y-3 relative group">
              <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-wider block">Root Imbalance</span>
              <p className="text-white font-extrabold text-[15px] font-display">Stress load indicator</p>
              <div className="flex justify-between items-center mt-2.5">
                <span className="bg-danger/10 border border-danger/25 text-danger px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider">Primary Driver</span>
                <svg className="w-16 h-8 text-danger" viewBox="0 0 60 30" fill="none">
                  <path d="M0,25 Q15,5 30,20 T60,5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Card 2: Causal Dependency */}
            <div className="bg-[#0D1017] border border-[#1A2035] rounded-xl p-5 space-y-3 relative group">
              <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-wider block">Causal Dependency</span>
              <p className="text-white font-extrabold text-[15px] font-display">Stress → Sleep → BMI</p>
              <div className="flex justify-between items-center mt-2.5">
                <span className="bg-warning/10 border border-warning/25 text-warning px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider">Chain Path</span>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Heart size={10} className="text-danger" />
                  <span className="text-[10px] font-mono">→</span>
                  <Zap size={10} className="text-primary" />
                </div>
              </div>
            </div>

            {/* Card 3: Est. Optimal Motivation */}
            <div className="bg-[#0D1017] border border-[#1A2035] rounded-xl p-5 space-y-3 relative group">
              <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-wider block">Est. Optimal Motivation</span>
              <p className="text-2xl font-black text-success font-mono leading-none">-27.9% <span className="text-xs font-semibold text-text-secondary">risk</span></p>
              <div className="flex justify-between items-center mt-2.5">
                <span className="bg-success/10 border border-success/25 text-success px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider">120-Day Projection</span>
              </div>
            </div>

            {/* Card 4: Attribution Dimension */}
            <div className="bg-[#0D1017] border border-[#1A2035] rounded-xl p-5 space-y-3 relative group">
              <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-wider block">Attribution Dimension</span>
              <p className="text-white font-extrabold text-[15px] font-display">6 Biometric nodes</p>
              <div className="flex justify-between items-center mt-2.5">
                <span className="bg-primary/10 border border-primary/25 text-primary px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider">SHAP Decomposition</span>
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(6)].map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${
                      i === 0 ? "bg-danger" : i === 1 ? "bg-warning" : "bg-success"
                    }`} />
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section 6: "Designed for Clinical Discovery" (Feature Cards) ── */}
      <section className="relative z-10 py-28 px-8 bg-[#0D1017]">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-primary text-[10px] font-mono font-bold uppercase tracking-widest">
              Digital Replica Sandbox
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight">
              Designed for Clinical Discovery
            </h2>
            <p className="text-text-secondary text-xs max-w-xl mx-auto font-body">
              Analyze risk indicators, trace graph maps, and simulate forecast bounds directly inside the interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature Card 1 */}
            <div className="bg-[#131720] border border-[#1A2035] rounded-2xl p-7 flex flex-col justify-between min-h-[290px] relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300">
              {/* Highlight accent line top */}
              <div className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-primary to-success w-0 group-hover:w-full transition-all duration-300" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] font-bold text-primary bg-[#06080E] border border-border-main px-2 py-0.5 rounded">
                    /DASHBOARD
                  </span>
                  
                  {/* Mini Radar Chart */}
                  <svg className="w-14 h-14 text-primary opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300" viewBox="0 0 40 40">
                    <polygon points="20,5 35,15 30,35 10,35 5,15" fill="none" stroke="currentColor" strokeWidth="1" />
                    <polygon points="20,10 30,17 27,29 13,29 9,17" fill="rgba(79,142,247,0.2)" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>

                <h3 className="text-white font-extrabold text-lg font-display">Prakriti Index</h3>
                <p className="text-text-secondary text-xs leading-relaxed font-body">
                  Evaluate real-time vitals, SHAP attributions, agent recommendations, and predictive model validation data.
                </p>
              </div>
              
              <button 
                onClick={handleDemoLogin}
                className="text-primary hover:brightness-110 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1 mt-6 cursor-pointer"
              >
                ENTER <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-[#131720] border border-[#1A2035] rounded-2xl p-7 flex flex-col justify-between min-h-[290px] relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-primary to-success w-0 group-hover:w-full transition-all duration-300" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] font-bold text-primary bg-[#06080E] border border-border-main px-2 py-0.5 rounded">
                    /INSIGHTS
                  </span>
                  
                  {/* Mini DAG map representation */}
                  <svg className="w-14 h-14 text-success opacity-60 group-hover:opacity-100 transition-all duration-300" viewBox="0 0 40 40">
                    <circle cx="20" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="30" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="30" cy="30" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M18,12 L12,28 M22,12 L28,28" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                  </svg>
                </div>

                <h3 className="text-white font-extrabold text-lg font-display">Causal Mappings</h3>
                <p className="text-text-secondary text-xs leading-relaxed font-body">
                  Visualize structural Directed Acyclic Graphs alongside interactive contributor attributions.
                </p>
              </div>
              
              <button 
                onClick={handleDemoLogin}
                className="text-primary hover:brightness-110 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1 mt-6 cursor-pointer"
              >
                ENTER <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-[#131720] border border-[#1A2035] rounded-2xl p-7 flex flex-col justify-between min-h-[290px] relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-primary to-success w-0 group-hover:w-full transition-all duration-300" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] font-bold text-primary bg-[#06080E] border border-border-main px-2 py-0.5 rounded">
                    /SIMULATION
                  </span>
                  
                  {/* Mini trajectory curves */}
                  <svg className="w-14 h-14 text-primary opacity-60 group-hover:opacity-100 transition-all duration-300" viewBox="0 0 40 40">
                    <path d="M5,35 Q15,10 35,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5,35 Q15,22 35,15" fill="none" stroke="rgba(0,212,160,0.6)" strokeWidth="1.5" />
                  </svg>
                </div>

                <h3 className="text-white font-extrabold text-lg font-display">Forecasting Trajectories</h3>
                <p className="text-text-secondary text-xs leading-relaxed font-body">
                  Simulate wearable response curves across current baseline, target, and optimal habit paths.
                </p>
              </div>
              
              <button 
                onClick={handleDemoLogin}
                className="text-primary hover:brightness-110 text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-1 mt-6 cursor-pointer"
              >
                ENTER <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section 7: Footer ── */}
      <footer className="relative z-10 border-t border-[#1A2035] bg-[#06080E] px-8 md:px-12 pt-16 pb-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Col 1 Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-white font-extrabold text-sm uppercase tracking-wide font-display">
                  Darpan<span className="text-primary">AI</span>
                </span>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed font-body">
                Ayurvedic Prakriti classification powered by directed structural causal logic models.
              </p>
            </div>

            {/* Col 2 MODULES */}
            <div className="space-y-3.5">
              <p className="text-success font-mono text-[10px] font-bold uppercase tracking-widest">Modules</p>
              <ul className="space-y-2 text-xs text-text-secondary font-medium">
                {["Prakriti Dashboard", "Causal Insights", "Forecast Model", "Alerts Console"].map((item) => (
                  <li key={item} className="hover:text-white transition-colors cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>

            {/* Col 3 STACK */}
            <div className="space-y-3.5">
              <p className="text-success font-mono text-[10px] font-bold uppercase tracking-widest">Stack</p>
              <ul className="space-y-2 text-xs text-text-secondary font-medium">
                {["DoWhy DAG Engine", "SHAP Attributor", "Qdrant Vector DB", "Groq Inference"].map((item) => (
                  <li key={item} className="hover:text-white transition-colors cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>

            {/* Col 4 CLINICAL */}
            <div className="space-y-3.5">
              <p className="text-success font-mono text-[10px] font-bold uppercase tracking-widest">Clinical</p>
              <ul className="space-y-2 text-xs text-text-secondary font-medium">
                {["NHANES Calibration", "Apple HealthKit Sync", "Research Docs", "Telemetry SDK"].map((item) => (
                  <li key={item} className="hover:text-white transition-colors cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border-main/50 gap-4">
            <span className="text-text-muted text-[9px] font-mono font-bold uppercase tracking-wider text-center sm:text-left leading-relaxed">
              DARPAN.AI SYSTEMS © 2026 // CLINICAL INTELLIGENCE DIVISION · BUILT FOR HACKATHON
            </span>
            <div className="flex items-center gap-2 text-success font-mono text-[10px] font-bold uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
              </span>
              All Systems Nominal
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
