import React from "react";
import { Link } from "react-router-dom";
import { BRANDMIND } from "@/brandmind";
import { useApp } from "@/context/AppContext";

const C = BRANDMIND.colors;

const COPY = {
  imprint: {
    deTitle: "Impressum",
    enTitle: "Imprint",
    deBody: "Inhalt wird vor Veröffentlichung ergänzt. Es werden hier bewusst keine ungeprüften Unternehmensdaten, Anschriften oder Vertretungsberechtigten erfunden.",
    enBody: "Content will be added before publication. We intentionally do not invent unverified company details, addresses or legal representatives here.",
  },
  privacy: {
    deTitle: "Datenschutz",
    enTitle: "Privacy",
    deBody: "Inhalt wird vor Veröffentlichung juristisch ergänzt und geprüft. Für Early-Access-Anfragen speichern wir derzeit nur die im Formular eingegebenen Angaben, die Datenschutzzustimmung mit Zeitstempel sowie serverseitige Erstellungs- und Aktualisierungszeitpunkte. IP-Adresse und User-Agent werden nicht standardmäßig gespeichert.",
    enBody: "Content will be legally completed and reviewed before publication. For early-access requests, we currently store only the fields entered in the form, the privacy consent timestamp and server-side created/updated timestamps. IP address and user agent are not stored by default.",
  },
  contact: {
    deTitle: "Kontakt",
    enTitle: "Contact",
    deBody: "Inhalt wird vor Veröffentlichung ergänzt. Bis geprüfte Kontaktdaten vorliegen, ist diese Seite ein sichtbarer Strukturplatzhalter.",
    enBody: "Content will be added before publication. Until verified contact details are available, this page is a visible structural placeholder.",
  },
};

export default function LegalPlaceholder({ type = "privacy" }) {
  const { lang } = useApp();
  const isDE = lang === "DE";
  const item = COPY[type] || COPY.privacy;
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: C.base, color: "#fff" }}>
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <Link to="/" className="text-sm text-zinc-400 hover:text-white">← Brandmind</Link>
        <h1 className="mt-8 text-3xl font-bold">{isDE ? item.deTitle : item.enTitle}</h1>
        <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          {isDE ? item.deBody : item.enBody}
        </p>
        <p className="mt-5 text-sm leading-6 text-zinc-400">
          {isDE
            ? "Diese Seite stellt sicher, dass Produktlinks und Datenschutzhinweise nicht ins Leere führen. Die finalen Rechtstexte müssen vor öffentlichem Launch ergänzt werden."
            : "This page ensures product links and privacy notices do not lead nowhere. Final legal copy must be added before public launch."}
        </p>
      </div>
    </main>
  );
}
