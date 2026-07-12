import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Brain } from "lucide-react";
import { useApp, API } from "@/context/AppContext";

// Makes the invisible visible: every AI generation is grounded in the brand
// profile (_brand_context injects the DNA server-side on all entry points).
// This badge surfaces that fact plus the profile's completeness, and links
// into the editor to close the gap. Renders nothing while unknown/failed —
// it must never block or clutter a studio.
export const BrainBadge = ({ className = "" }) => {
  const { lang, activeBrandId } = useApp();
  const [overall, setOverall] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setOverall(null);
    if (!activeBrandId) return undefined;
    axios
      .get(`${API}/brand-identity/${activeBrandId}/summary`, { params: { language: lang } })
      .then((res) => { if (!cancelled) setOverall(res.data?.overall ?? null); })
      .catch(() => { if (!cancelled) setOverall(null); });
    return () => { cancelled = true; };
  }, [activeBrandId, lang]);

  if (overall === null) return null;
  const de = lang === "DE";
  const empty = overall < 20;
  const label = empty
    ? (de ? "Markenprofil fast leer – jetzt einrichten" : "Brand profile nearly empty – set it up")
    : (de ? `Markenprofil aktiv · ${overall} %` : `Brand profile active · ${overall}%`);

  return (
    <Link
      to={empty ? "/brand-brain" : "/brand-identity"}
      title={de
        ? "Jede Generierung nutzt dein Markenprofil. Klicken zum Bearbeiten."
        : "Every generation uses your brand profile. Click to edit."}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] transition-colors ${
        empty
          ? "border-amber-400/30 text-amber-300 hover:border-amber-300/60"
          : "border-violet-400/25 text-violet-300 hover:border-violet-300/50"
      } ${className}`}
    >
      <Brain size={12} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
};
