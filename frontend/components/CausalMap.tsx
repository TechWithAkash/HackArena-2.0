"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
}

const NODES: Node[] = [
  { id: "steps",         label: "Activity",     x: 80,  y: 60 },
  { id: "stress_level",  label: "Stress",       x: 80,  y: 240 },
  { id: "sleep",         label: "Sleep",        x: 220, y: 150 },
  { id: "diet_score",    label: "Diet",         x: 360, y: 60 },
  { id: "bmi",           label: "BMI",          x: 420, y: 180 },
  { id: "heart_rate",    label: "Heart Rate",   x: 520, y: 240 },
  { id: "risk_score",    label: "HEALTH RISK",  x: 640, y: 150 },
];

const EDGES: Edge[] = [
  { source: "stress_level", target: "heart_rate" },
  { source: "stress_level", target: "sleep" },
  { source: "stress_level", target: "risk_score" },
  { source: "sleep",        target: "heart_rate" },
  { source: "sleep",        target: "diet_score" },
  { source: "sleep",        target: "risk_score" },
  { source: "diet_score",   target: "bmi" },
  { source: "diet_score",   target: "risk_score" },
  { source: "bmi",          target: "heart_rate" },
  { source: "bmi",          target: "risk_score" },
  { source: "steps",        target: "bmi" },
  { source: "steps",        target: "sleep" },
  { source: "steps",        target: "risk_score" },
  { source: "heart_rate",   target: "risk_score" },
];

interface Props {
  primaryCause?: string;
  causalChain?: string;
  shapContributions?: Record<string, number>;
}

export default function CausalMap({ primaryCause, causalChain, shapContributions }: Props) {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const chainNodes = causalChain
    ? causalChain.split(" → ").flatMap((seg) => seg.split(" & "))
    : [];

  const isEdgeInChain = (source: string, target: string) => {
    if (primaryCause && source === primaryCause) return true;
    if (!causalChain) return false;
    return chainNodes.includes(source) && chainNodes.includes(target);
  };

  const directTargets = new Set(
    primaryCause
      ? EDGES.filter(e => e.source === primaryCause).map(e => e.target)
      : []
  );

  const getNodeFillColor = (id: string) => {
    if (id === "risk_score") return "#E5534B"; // Terminal Node (Health Risk)
    if (id === primaryCause) return "#00D4A0"; // Root Cause (Teal)
    if (directTargets.has(id)) return "#F5A623"; // Mediator Node (Amber)
    return "#111318"; // Inactive/Other Node
  };

  const getNodeStrokeColor = (id: string) => {
    if (id === "risk_score") return "#E5534B";
    if (id === primaryCause) return "#00D4A0";
    if (directTargets.has(id)) return "#F5A623";
    return "#1E2330";
  };

  const getLabelColor = (id: string) => {
    if (id === "risk_score") return "text-[#E5534B]";
    if (id === primaryCause) return "text-[#00D4A0]";
    if (directTargets.has(id)) return "text-[#F5A623]";
    return "text-[#8B92A5]";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-[#111318] rounded-xl border border-border-main p-6 md:p-8 overflow-hidden relative shadow-[0_0_24px_rgba(0,0,0,0.4)]"
    >
      {/* Schematic grid background in dark theme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E2330_1px,transparent_1px),linear-gradient(to_bottom,#1E2330_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider font-mono">
            ● LIVE CAUSAL RELATIONSHIP MATRIX ACTIVE
          </span>
          <h3 className="text-xl font-semibold text-white tracking-tight font-display mt-1">Causal Relationship Map</h3>
        </div>
        
        <div className="flex flex-wrap gap-4 bg-[#181C24] border border-border-main rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-wider font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00D4A0]" />
            <span className="text-white">Root Cause</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
            <span className="text-white">Mediator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E5534B]" />
            <span className="text-white">Terminal</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-[720/300] w-full border border-border-main rounded-lg bg-[#0A0C10]/60 backdrop-blur-[2px] z-10">
        <svg viewBox="0 0 720 300" className="w-full h-full">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes flowAnim {
              to { stroke-dashoffset: -24; }
            }
            .flow-line {
              stroke-dasharray: 8 6;
              animation: flowAnim 1.2s linear infinite;
            }
          `}} />
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1E2330" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#F5A623" />
            </marker>
          </defs>

          {/* Connectors / Edges */}
          {EDGES.map((edge) => {
            const s = NODES.find(n => n.id === edge.source)!;
            const t = NODES.find(n => n.id === edge.target)!;
            const active = isEdgeInChain(edge.source, edge.target);

            return (
              <g key={`${edge.source}-${edge.target}`}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={active ? "#F5A623" : "#1E2330"}
                  strokeWidth={active ? 2.5 : 1.5}
                  markerEnd={`url(#${active ? "arrow-active" : "arrow"})`}
                  className={active ? "flow-line" : ""}
                />
              </g>
            );
          })}

          {/* Node objects */}
          {NODES.map((node) => {
            const isPrimary = node.id === primaryCause;
            const isTargetNode = node.id === "risk_score";
            const isMediator = directTargets.has(node.id);
            
            const fill = getNodeFillColor(node.id);
            const stroke = getNodeStrokeColor(node.id);

            return (
              <g 
                key={node.id} 
                className="group cursor-pointer select-none"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glow ring on hover/active */}
                {(isPrimary || isMediator || isTargetNode) && (
                  <circle
                    cx={node.x} cy={node.y} r={32}
                    fill={fill}
                    fillOpacity={0.05}
                    className="animate-pulse"
                  />
                )}

                {/* Main Node circle */}
                <circle
                  cx={node.x} cy={node.y} r={22}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isPrimary || isMediator || isTargetNode ? 2.5 : 1.5}
                  className="transition-all duration-300 group-hover:scale-105 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
                />

                {/* Micro icon marker inside circle */}
                <circle
                  cx={node.x} cy={node.y} r={3.5}
                  fill={isPrimary || isMediator || isTargetNode ? "#FFFFFF" : "#4A5168"}
                />

                {/* Text tag label */}
                <foreignObject
                  x={node.x - 70}
                  y={node.y + 28}
                  width={140}
                  height={32}
                  className="overflow-visible"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider font-display ${getLabelColor(node.id)}`}>
                      {node.label}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* SHAP Tooltip on Hover */}
      {hoveredNode && (
        <div 
          className="absolute bg-[#181C24] border border-[#1E2330] rounded-lg p-2.5 text-[11px] font-mono text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50 pointer-events-none transition-all duration-150"
          style={{ 
            left: `${Math.min(720, hoveredNode.x + 20)}px`, 
            top: `${Math.min(300, hoveredNode.y - 10)}px` 
          }}
        >
          <p className="font-bold text-white uppercase tracking-wider">{hoveredNode.label}</p>
          {shapContributions && shapContributions[hoveredNode.id] !== undefined ? (
            <p className="text-[#8B92A5] mt-1">
              SHAP: <span className={shapContributions[hoveredNode.id] > 0 ? "text-[#E5534B]" : "text-[#00D4A0]"}>
                {shapContributions[hoveredNode.id] > 0 ? "+" : ""}{shapContributions[hoveredNode.id].toFixed(4)}
              </span>
            </p>
          ) : (
            <p className="text-text-muted mt-1">No SHAP attribution</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
