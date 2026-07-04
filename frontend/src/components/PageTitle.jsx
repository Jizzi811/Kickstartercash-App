import React from "react";

export const PageTitle = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      {Icon && (
        <span className="w-10 h-10 rounded-sm bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
          <Icon size={20} strokeWidth={1.6} />
        </span>
      )}
      <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight gold-text">{title}</h1>
    </div>
    {subtitle && <p className="text-zinc-500 text-base">{subtitle}</p>}
  </div>
);
