import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BRANDMIND } from "@/brandmind";

const C = BRANDMIND.colors;
const ORB_IMG = "/brand/quantum-orb.jpg";

// Small dot orbiting the core on its own ring — pure ambient motion, decorative only.
function OrbitParticle({ radius, duration, delay = 0, reverse = false, dotSize = 5 }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ transformOrigin: "center" }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          left: "50%",
          top: `calc(50% - ${radius}px)`,
          transform: "translate(-50%, -50%)",
          background: C.accent,
          boxShadow: `0 0 8px 2px ${C.glow}`,
        }}
      />
    </motion.div>
  );
}

/**
 * The Quantum core — a rotating orb image with ambient rings/particles, and
 * optionally a ring of agent nodes connected by hover-reactive pulse lines.
 */
export default function QuantumOrb({
  size = 380,
  agents = [],
  interactive = false,
  activeId,
  onAgentHover,
  className = "",
}) {
  const [hovered, setHovered] = useState(null);
  const active = activeId !== undefined ? activeId : hovered;

  const center = size / 2;
  const nodeRadius = size * 0.46;
  const coreSize = size * 0.6;

  const nodes = useMemo(
    () =>
      agents.map((a, i) => {
        const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...a,
          x: center + nodeRadius * Math.cos(angle),
          y: center + nodeRadius * Math.sin(angle),
        };
      }),
    [agents, center, nodeRadius]
  );

  const setActive = (id) => {
    if (activeId === undefined) setHovered(id);
    onAgentHover?.(id);
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* ambient glow behind everything */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: C.glow, filter: `blur(${size * 0.22}px)` }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* slow-rotating dashed/solid rings */}
      {[0.94, 0.72].map((f, i) => (
        <motion.div
          key={f}
          className="absolute rounded-full border pointer-events-none"
          style={{
            inset: (size - size * f) / 2,
            borderColor: `${C.primary}${i === 0 ? "26" : "40"}`,
            borderStyle: i === 0 ? "dashed" : "solid",
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 30 + i * 16, repeat: Infinity, ease: "linear" }}
        />
      ))}

      <OrbitParticle radius={size * 0.5} duration={14} dotSize={4} />
      <OrbitParticle radius={size * 0.5} duration={19} delay={3} reverse dotSize={3} />

      {/* connecting lines to agent nodes */}
      {agents.length > 0 && (
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
          {nodes.map((n) => {
            const isActive = interactive && active === n.id;
            return (
              <motion.line
                key={n.id}
                x1={center}
                y1={center}
                x2={n.x}
                y2={n.y}
                stroke={isActive ? C.primary : `${C.primary}30`}
                strokeWidth={isActive ? 1.6 : 1}
                strokeDasharray="4 5"
                animate={isActive ? { strokeDashoffset: [18, 0] } : { strokeDashoffset: 0 }}
                transition={isActive ? { duration: 0.7, repeat: Infinity, ease: "linear" } : {}}
              />
            );
          })}
        </svg>
      )}

      {/* the core — rotating Quantum image */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          inset: (size - coreSize) / 2,
          boxShadow: `0 0 ${size * 0.3}px ${C.glow}, inset 0 0 ${size * 0.08}px rgba(0,0,0,0.4)`,
        }}
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.img
          src={ORB_IMG}
          alt="Quantum — Brandmind AI Core"
          className="w-full h-full object-cover"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          draggable={false}
        />
      </motion.div>

      {/* agent nodes */}
      {nodes.map((n) => {
        const Icon = n.icon;
        const isActive = interactive && active === n.id;
        return (
          <motion.div
            key={n.id}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              left: n.x,
              top: n.y,
              width: size * 0.15,
              height: size * 0.15,
              transform: "translate(-50%, -50%)",
              background: isActive ? C.primary : "rgba(255,255,255,0.05)",
              border: `1px solid ${isActive ? C.primary : "rgba(255,255,255,0.14)"}`,
              boxShadow: isActive ? `0 0 24px ${C.glow}` : "none",
              cursor: interactive ? "pointer" : "default",
            }}
            animate={{ scale: isActive ? 1.15 : 1 }}
            transition={{ duration: 0.25 }}
          >
            <Icon size={size * 0.065} color={isActive ? "#fff" : "#a1a1aa"} />
          </motion.div>
        );
      })}
    </div>
  );
}
