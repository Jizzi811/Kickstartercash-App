import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Check, Sparkles, Loader2, Crown, Zap, Rocket, Building2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp, API } from "@/context/AppContext";
import { BRANDMIND } from "@/brandmind";

const C = BRANDMIND.colors;

const PLAN_ICON = { trial: Sparkles, starter: Zap, pro: Rocket, agency: Building2 };

export default function Billing() {
  const { lang, isAuthenticated, activeWorkspace, activeWorkspaceId } = useApp();
  const isDE = lang === "DE";
  const T = (de, en) => (isDE ? de : en);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [notice, setNotice] = useState("");

  const currentPlan = activeWorkspace?.plan || "trial";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/billing/plans`);
      setPlans(res.data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upgrade = async (planId) => {
    setNotice("");
    if (!isAuthenticated) {
      setNotice(T("Bitte zuerst anmelden, um ein Upgrade zu starten.", "Please log in first to upgrade."));
      return;
    }
    setBusyPlan(planId);
    try {
      const res = await axios.post(`${API}/billing/checkout`, {
        workspace_id: activeWorkspaceId,
        plan: planId,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      setNotice(err?.response?.data?.detail || T("Checkout nicht möglich.", "Checkout unavailable."));
    } finally {
      setBusyPlan("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        icon={Crown}
        color={C.primary}
        badge={T("Brandmind · Preise", "Brandmind · Pricing")}
        title={T("Wähle deinen Plan", "Choose your plan")}
        subtitle={T(
          "Skaliere deinen KI-Mitarbeiterstab, wenn dein Unternehmen wächst.",
          "Scale your AI staff as your business grows."
        )}
      />

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 rounded-lg text-sm"
          style={{ background: `${C.primary}12`, border: `1px solid ${C.primary}33`, color: C.accent }}
        >
          {notice}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="animate-spin mr-2" size={18} /> {T("Lade Pläne…", "Loading plans…")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICON[plan.id] || Sparkles;
            const isCurrent = plan.id === currentPlan;
            const highlight = plan.id === "pro";
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="relative flex flex-col rounded-xl p-6 bg-white/[0.02]"
                style={{
                  border: highlight ? `1px solid ${C.primary}` : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: highlight ? `0 12px 40px ${C.glow}` : "none",
                }}
              >
                {highlight && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ background: C.primary }}
                  >
                    {T("Beliebt", "Popular")}
                  </span>
                )}

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}33` }}
                >
                  <Icon size={19} style={{ color: C.primary }} />
                </div>

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-2 mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.price_eur === 0 ? T("Gratis", "Free") : `${plan.price_eur} €`}
                  </span>
                  {plan.price_eur > 0 && (
                    <span className="text-xs text-zinc-500">/ {T("Monat", "mo")}</span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-zinc-300">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: C.primary }} />
                      {f}
                    </li>
                  ))}
                  {plan.limits && (
                    <li className="pt-2 text-[11px] text-zinc-500 border-t border-white/5">
                      {plan.limits.generations_per_month}{" "}
                      {T("Generierungen/Monat", "generations/mo")} ·{" "}
                      {plan.limits.brands} {T("Marken", "brands")} ·{" "}
                      {plan.limits.members} {T("Mitglieder", "members")}
                    </li>
                  )}
                </ul>

                {isCurrent ? (
                  <div
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa" }}
                  >
                    {T("Aktueller Plan", "Current plan")}
                  </div>
                ) : plan.id === "trial" ? (
                  <div className="w-full py-2.5 rounded-lg text-sm text-center text-zinc-600">
                    {T("Standard beim Start", "Default on signup")}
                  </div>
                ) : (
                  <motion.button
                    onClick={() => upgrade(plan.id)}
                    disabled={busyPlan === plan.id}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-70 transition-colors"
                    style={{ background: highlight ? C.primary : "rgba(255,255,255,0.06)", border: highlight ? "none" : `1px solid ${C.primary}55` }}
                  >
                    {busyPlan === plan.id ? (
                      <><Loader2 size={15} className="animate-spin" /> {T("Weiter zu Stripe…", "To Stripe…")}</>
                    ) : (
                      <>{T("Upgrade", "Upgrade")} <ArrowRight size={15} /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-600">
        {T(
          "Jederzeit kündbar · Zahlung sicher über Stripe",
          "Cancel anytime · Payments secured by Stripe"
        )}
      </p>
    </div>
  );
}
