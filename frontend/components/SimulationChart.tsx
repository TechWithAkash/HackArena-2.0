"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface Props {
  scenarios: { current: number[]; improved: number[]; optimal: number[] };
  timelineDays: number[];
  projectedReduction: { improved: number; optimal: number };
}

export default function SimulationChart({ scenarios, timelineDays, projectedReduction }: Props) {
  const data = timelineDays.map((day, i) => ({
    day: `Day ${day}`,
    Current: Math.round(scenarios.current[i] ?? 0),
    Improved: Math.round(scenarios.improved[i] ?? 0),
    Optimal: Math.round(scenarios.optimal[i] ?? 0),
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            ● TRAJECTORY DYNAMICS
          </span>
          <h3 className="text-xl font-semibold text-white tracking-tight font-display mt-1">Prakriti Trajectory Simulation</h3>
        </div>
        
        <div className="flex gap-4 bg-bg-elevated border border-border-main rounded-lg px-4.5 py-2.5 text-[11px] font-mono text-text-secondary uppercase">
          <div>
            <p className="text-text-muted">Improved Path</p>
            <p className="text-[13px] font-semibold text-primary">−{projectedReduction.improved.toFixed(1)}%</p>
          </div>
          <div className="border-l border-border-main" />
          <div>
            <p className="text-text-muted">Optimal Path</p>
            <p className="text-[13px] font-semibold text-success">−{projectedReduction.optimal.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 10, fill: "#8B92A5", fontFamily: "IBM Plex Mono" }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: "#8B92A5", fontFamily: "IBM Plex Mono" }} 
              axisLine={false} 
              tickLine={false} 
              domain={[0, 100]} 
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: '8px', 
                background: '#181C24',
                border: '1px solid #1E2330', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', 
                fontSize: '11px', 
                fontFamily: 'IBM Plex Mono',
                color: '#F0F2F7'
              }}
              itemStyle={{ color: '#F0F2F7' }}
              labelStyle={{ color: '#8B92A5', marginBottom: '4px' }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono", paddingTop: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}
              formatter={(v) => <span style={{ color: "#8B92A5" }}>{v}</span>}
            />
            <Line 
              type="monotone" 
              dataKey="Current" 
              stroke="#4A5168" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={false} 
              name="Current Path"
            />
            <Line 
              type="monotone" 
              dataKey="Improved" 
              stroke="#4F8EF7" 
              strokeWidth={2.5} 
              dot={false} 
              name="Improved Path"
            />
            <Line 
              type="monotone" 
              dataKey="Optimal" 
              stroke="#00D4A0" 
              strokeWidth={3.2} 
              dot={false} 
              name="Optimal Path"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
