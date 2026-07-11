import React from "react";

const LABELS = {
  beta: { DE: "Beta", EN: "Beta" },
  development: { DE: "In Entwicklung", EN: "In development" },
};

export default function StatusBadge({ status = "beta", lang = "DE", className = "" }) {
  const key = status === "development" ? "development" : "beta";
  const label = LABELS[key][lang] || LABELS[key].DE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${className}`}
      style={{
        borderColor: key === "development" ? "rgba(244,114,182,0.35)" : "rgba(124,58,237,0.4)",
        background: key === "development" ? "rgba(244,114,182,0.10)" : "rgba(124,58,237,0.12)",
        color: key === "development" ? "#F472B6" : "#A78BFA",
      }}
    >
      {label}
    </span>
  );
}
