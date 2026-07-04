import React from "react";
import { motion } from "framer-motion";

const BRAND_VIOLET = "#7C3AED";
const HEADING_GRADIENT = "linear-gradient(90deg, #7C3AED 0%, #C4B5FD 45%, #6D28D9 100%)";

export function PageHeader({ icon: Icon, title, subtitle, badge, actions, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(8,8,8,0) 55%, rgba(124,58,237,0.05) 100%)",
        border: "1px solid rgba(124,58,237,0.14)",
      }}
    >
      <div
        className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }}
      />
      {actions && <div className="absolute right-6 top-6 z-10">{actions}</div>}
      <div className="relative px-6 md:px-10 py-10">
        {badge && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[10px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.26)", color: BRAND_VIOLET }}
          >
            {Icon && <Icon size={11} />} {badge}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2 font-display">
          <span
            style={{
              background: HEADING_GRADIENT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </span>
        </h1>
        {subtitle && <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{subtitle}</p>}
      </div>
    </motion.section>
  );
}
