import React from "react";

export default function WorkflowInspector({ workflow }) {
  if (!workflow) return null;
  const context = workflow.sharedContext;
  return (
    <div className="rounded-sm border border-white/8 bg-black/35 p-4">
      <div className="mb-4 text-sm font-semibold text-white">Workflow Inspector</div>
      <div className="grid gap-3 text-xs md:grid-cols-2">
        <div><span className="text-zinc-500">Status:</span> <span className="text-[#A78BFA]">{workflow.status}</span></div>
        <div><span className="text-zinc-500">Schritte:</span> <span className="text-zinc-300">{workflow.steps.length}</span></div>
        <div><span className="text-zinc-500">Kampagnenziel:</span> <span className="text-zinc-300">{context.campaignGoal}</span></div>
        <div><span className="text-zinc-500">Plattform:</span> <span className="text-zinc-300">{context.platform}</span></div>
        <div><span className="text-zinc-500">Zielgruppe:</span> <span className="text-zinc-300">{context.audience}</span></div>
        <div><span className="text-zinc-500">Brand Context:</span> <span className="text-zinc-300">{context.brandContext}</span></div>
      </div>
    </div>
  );
}
