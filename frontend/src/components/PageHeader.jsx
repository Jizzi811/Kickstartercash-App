import React from "react";
import { motion } from "framer-motion";

export function PageHeader({ icon: Icon, color, title, subtitle, badge }) {
  // Unify all section headings on the Brandmind violet accent (ignore per-page color).
  color = "#7C3AED";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl mb-8 p-8"
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, rgba(8,8,8,0) 70%)`,
        border: `1px solid ${color}18`,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}25`,
            boxShadow: `0 0 20px ${color}12`,
          }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          {badge && (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mb-1.5"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}25`,
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color,
              }}
            >
              {badge}
            </div>
          )}
          <h1 className="bm-heading purple-text">
            {title}
          </h1>
          {subtitle && (
            <p className="bm-caption text-zinc-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Ambient corner glow */}
      <div
        style={{
          position: "absolute", top: "-30px", right: "-30px",
          width: "120px", height: "120px", borderRadius: "50%",
          background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
