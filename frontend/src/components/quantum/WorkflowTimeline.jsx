import React from "react";
import { CheckCircle2, Clock3, PlayCircle, XCircle, SkipForward } from "lucide-react";

const ICONS = { pending: Clock3, running: PlayCircle, completed: CheckCircle2, failed: XCircle, skipped: SkipForward };

export default function WorkflowTimeline({ workflow }) {
  if (!workflow) return null;
  return (
    <div className="min-w-0 overflow-hidden rounded-sm border border-white/8 bg-black/35 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">Workflow Timeline</div>
        <div className="text-xs text-[#A78BFA]">{workflow.progress}% Fortschritt</div>
      </div>
      <div className="space-y-3">
        {workflow.steps.map((step) => {
          const Icon = ICONS[step.status] || Clock3;
          return (
            <div key={step.id} className="grid min-w-0 grid-cols-1 gap-2 border-l border-[#7C3AED]/30 pl-4 text-xs md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.6fr)] md:gap-3">
              <div className="flex items-start gap-2 text-zinc-200"><Icon size={14} className="mt-0.5 text-[#A78BFA]" /><span>{step.phase}<span className="block text-zinc-500">{step.agentName}</span></span></div>
              <div className="break-words text-zinc-400">{step.task}</div>
              <div className="break-words text-zinc-300">{step.outputPreview || `Erwartet: ${step.expectedOutput}`}</div>
              <div className="text-[#A78BFA]">{step.status}<span className="block text-zinc-500">{step.durationMs}ms</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
