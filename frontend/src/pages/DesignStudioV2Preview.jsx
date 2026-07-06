import React from "react";
import { ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const OPEN_DESIGN_AGENT_URL =
  process.env.REACT_APP_OPEN_DESIGN_AGENT_URL ||
  "https://muapi.ai/assistant?utm_source=brandmind&utm_medium=design-v2-preview";

export default function DesignStudioV2Preview() {
  const { lang } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Design Studio V2 (Preview)"
        subtitle={
          lang === "DE"
            ? "Externer Agent-Test parallel zum aktuellen Studio"
            : "External design-agent test running parallel to current studio"
        }
        badge="Preview"
      />

      <section className="rounded-sm border border-white/10 bg-[rgba(139,92,246,0.04)] p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-zinc-200">
              {lang === "DE"
                ? "Hier testet ihr den externen Open Design Agent, ohne das aktuelle Design Studio zu ersetzen."
                : "Use this page to test the external Open Design Agent without replacing your current Design Studio."}
            </p>
            <p className="text-xs text-zinc-500">
              {lang === "DE"
                ? "Hinweis: API-Keys und Datenverarbeitung erfolgen beim externen Dienst."
                : "Note: API keys and data processing are handled by the external service."}
            </p>
          </div>

          <a
            href={OPEN_DESIGN_AGENT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-violet-400/30 px-3 py-2 text-xs font-medium text-violet-200 hover:text-white hover:border-violet-300/50"
          >
            <ExternalLink size={14} />
            {lang === "DE" ? "In neuem Tab öffnen" : "Open in new tab"}
          </a>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck size={13} />
          <span>
            {lang === "DE"
              ? "Preview-Integration: Bitte keine sensiblen Kundendaten eingeben."
              : "Preview integration: avoid entering sensitive customer data."}
          </span>
        </div>
      </section>

      <section className="rounded-sm border border-white/10 bg-black/30 overflow-hidden">
        <iframe
          title="Design Studio V2 Preview"
          src={OPEN_DESIGN_AGENT_URL}
          className="w-full"
          style={{ minHeight: "78vh", border: 0, background: "#050505" }}
          allow="clipboard-read; clipboard-write"
        />
      </section>
    </div>
  );
}
