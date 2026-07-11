import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

const STEPS = [
  ["start", "/onboarding/founder/start", "Start"],
  ["profile", "/onboarding/founder/profile", "Profil"],
  ["ideas", "/onboarding/founder/ideas", "Ideen"],
  ["compare", "/onboarding/founder/ideas/compare", "Vergleich"],
  ["intake", "/onboarding/founder/intake", "Intake"],
  ["brand", "/onboarding/founder/brand", "Brand"],
  ["offers", "/onboarding/founder/offers", "Offers"],
  ["business_plan", "/onboarding/founder/business-plan", "Business"],
  ["finance", "/onboarding/founder/finance", "Finance"],
  ["operations", "/ops", "Ops"],
];

export default function FounderProgress({ current }) {
  const { onboardingStatus, updateOnboardingStatus } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!current) return;
    const completed = new Set(onboardingStatus?.completed_steps || []);
    STEPS.slice(0, Math.max(0, STEPS.findIndex(([id]) => id === current))).forEach(([id]) => completed.add(id));
    updateOnboardingStatus({ status: "in_progress", selected_path: "founder", current_step: current, completed_steps: Array.from(completed) }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, location.pathname]);
  const done = new Set(onboardingStatus?.completed_steps || []);
  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap gap-2">
        {STEPS.map(([id, route, label]) => (
          <button key={id} onClick={() => navigate(route)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${id === current ? "border-violet-400/40 bg-violet-500/15 text-violet-100" : "border-white/10 text-zinc-500 hover:text-zinc-200"}`}>
            {done.has(id) && <CheckCircle2 size={12} />} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
