import React from "react";

export default function OutputSummary({ workflow }) {
  if (!workflow) return null;
  const outputs = workflow.outputBus?.all || [];
  return (
    <div className="rounded-sm border border-white/8 bg-black/35 p-4">
      <div className="mb-4 text-sm font-semibold text-white">Output Summary</div>
      {outputs.length === 0 ? <div className="text-xs text-zinc-500">Noch keine Agenten-Ergebnisse im Output Bus.</div> : <div className="grid gap-3 md:grid-cols-2">{outputs.map((output) => <div key={output.id} className="rounded-sm border border-white/8 bg-white/[0.02] p-3"><div className="mb-1 text-xs font-semibold text-white">{output.title}</div><div className="text-xs text-zinc-400">{output.summary}</div></div>)}</div>}
    </div>
  );
}
