"use client";

import { motion } from "framer-motion";

interface Factor {
  factor: string;
  contribution: number;
  description: string;
}

interface Props {
  drivers: Factor[];
  protective: Factor[];
}

function FactorRow({ factor, contribution, description, isDriver, index }: Factor & { isDriver: boolean; index: number }) {
  const abs = Math.abs(contribution);
  const maxBar = 8;
  const width = Math.min(100, (abs / maxBar) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, x: isDriver ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="py-4 border-b border-border-main/50 last:border-b-0 hover:bg-[#181C24]/30 px-2 rounded transition-all"
    >
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDriver ? "bg-danger" : "bg-success"}`} />
            <span className="text-sm font-semibold text-white capitalize font-body">
              {factor.replace(/_/g, " ")}
            </span>
          </div>
          <span className={`text-[12px] font-semibold font-mono ${isDriver ? "text-danger" : "text-success"}`}>
            {isDriver ? "+" : ""}{contribution.toFixed(4)} SHAP
          </span>
        </div>

        <div className="w-full bg-[#1E2330] rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${width}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isDriver ? "bg-danger" : "bg-success"}`}
          />
        </div>

        <p className="text-[12px] text-text-secondary leading-relaxed font-body">{description}</p>
      </div>
    </motion.div>
  );
}

export default function InsightsBar({ drivers, protective }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      {/* Drivers column */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-bg-surface rounded-xl border border-border-main p-5 md:p-6 shadow-[0_0_24px_rgba(0,0,0,0.3)]"
      >
        <div className="mb-4 pb-3 border-b border-border-main/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-danger uppercase tracking-wider font-mono">
            NEGATIVE DIVERGENCE (RISK DRIVERS)
          </span>
          <p className="text-[11px] text-text-muted font-mono uppercase tracking-widest mt-0.5">Parameters amplifying index values</p>
        </div>

        {drivers.length === 0 ? (
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider py-8 text-center font-mono">No risk drivers identified</p>
        ) : (
          <div className="divide-y divide-border-main/30">
            {drivers.map((d, index) => (
              <FactorRow key={d.factor} {...d} isDriver={true} index={index} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Protectors column */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-bg-surface rounded-xl border border-border-main p-5 md:p-6 shadow-[0_0_24px_rgba(0,0,0,0.3)]"
      >
        <div className="mb-4 pb-3 border-b border-border-main/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            BIOLOGICAL EQUILIBRIUM (PROTECTORS)
          </span>
          <p className="text-[11px] text-text-muted font-mono uppercase tracking-widest mt-0.5">Parameters maintaining clinical balance</p>
        </div>

        {protective.length === 0 ? (
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider py-8 text-center font-mono">No stabilizing factors identified</p>
        ) : (
          <div className="divide-y divide-border-main/30">
            {protective.map((p, index) => (
              <FactorRow key={p.factor} {...p} isDriver={false} index={index} />
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
