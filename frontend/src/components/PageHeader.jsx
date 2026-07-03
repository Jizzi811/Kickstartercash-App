import React from "react";
import { motion } from "framer-motion";

export function PageHeader({ icon: Icon, color, title, subtitle, badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && (
          <span
            className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{
              background: `${color || "#7C3AED"}1A`,
              color: color || "#7C3AED",
            }}
          >
            <Icon size={20} strokeWidth={1.6} />
          </span>
        )}
        <div>
          {badge && (
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-zinc-600 mb-1"
              style={{
                color: `${color || "#7C3AED"}99`,
              }}
            >
              {badge}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight gold-text leading-tight">
            {title}
          </h1>
        </div>
      </div>
      {subtitle && <p className="text-zinc-500 text-base">{subtitle}</p>}
    </motion.div>
  );
}
