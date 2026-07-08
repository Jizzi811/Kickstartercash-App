import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import { API, useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";

const EXTERNAL_ASSISTANT_URL =
  "https://muapi.ai/assistant?utm_source=brandmind&utm_medium=design-v2-preview";

export default function DesignStudioV2Preview() {
  const { lang } = useApp();
  const [statusLoading, setStatusLoading] = useState(true);
  const [muapiConfigured, setMuapiConfigured] = useState(false);

  const PROXY_ASSISTANT_URL = useMemo(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
    if (!backendUrl) return "";
    return `${backendUrl.replace(/\/$/, "")}/api/integrations/muapi/assistant`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API}/integrations/muapi/status`);
        if (!cancelled) {
          setMuapiConfigured(!!res?.data?.configured);
        }
      } catch {
        if (!cancelled) {
          setMuapiConfigured(false);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const launchUrl = muapiConfigured && PROXY_ASSISTANT_URL ? PROXY_ASSISTANT_URL : EXTERNAL_ASSISTANT_URL;

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
              {statusLoading
                ? (lang === "DE" ? "Muapi-Key Status wird geprüft…" : "Checking Muapi key status…")
                : muapiConfigured
                  ? (lang === "DE" ? "Muapi läuft über euren Backend-Proxy (API-Key serverseitig)." : "Muapi is routed through your backend proxy (API key stays server-side).")
                  : (lang === "DE" ? "Kein serverseitiger Muapi-Key gesetzt – externer Login/Key wird genutzt." : "No server-side Muapi key configured — external login/key flow is used.")}
            </p>
          </div>

          <a
            href={launchUrl}
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
          src={launchUrl}
          className="w-full"
          style={{ minHeight: "78vh", border: 0, background: "#050505" }}
          allow="clipboard-read; clipboard-write"
        />
      </section>
    </div>
  );
}
