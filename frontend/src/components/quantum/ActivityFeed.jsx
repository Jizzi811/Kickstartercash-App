import React from "react";

const formatTime = (value) => new Date(value).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function ActivityFeed({ workflow }) {
  if (!workflow) return null;
  return (
    <div className="rounded-sm border border-white/8 bg-black/35 p-4">
      <div className="mb-4 text-sm font-semibold text-white">Activity Feed</div>
      <div className="space-y-3 text-xs">
        {workflow.activity.map((item) => (
          <div key={item.id} className="grid grid-cols-[72px_1fr] gap-3 border-l border-[#7C3AED]/25 pl-4 text-zinc-500">
            <span>{formatTime(item.at)}</span>
            <span className={item.type === "system" ? "text-[#C4B5FD]" : "text-zinc-300"}>{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
