"""Memory Router + Memory Context API (pure functions).

Agents never read collections directly – they ask the router for context. The
router pulls only the brains the agent is entitled to (see ``brains_for_agent``)
and returns a compact, role-appropriate memory block.

Like the Intelligence Engine, these are pure functions over records the caller
has already fetched (workspace/brand-scoped); the DB access lives in server.py.
The Experience Brain is built by *aggregating existing signals* (history,
mission_tasks, intelligence_events) – it reuses the earlier epics rather than
duplicating them.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .registry import (
    BRAND, BUSINESS, EXPERIENCE, BRAIN_META, brains_for_agent,
    BUSINESS_CATEGORIES,
)

_ACCEPTED = {"approved", "completed", "in_progress", "needs_review"}
_ASSET_TYPES = {"social", "copy", "image", "campaign", "calendar", "landingpage", "analysis", "veo"}
WEEKDAYS = {"DE": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
            "EN": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}


def _parse(dt) -> Optional[datetime]:
    if not dt or not isinstance(dt, str):
        return None
    try:
        d = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _pct(a, b):
    return round((a / b) * 100) if b else 0


# ---------------------------------------------------------------------------
# Experience Brain – aggregate the workspace's own signals into "experience"
# ---------------------------------------------------------------------------
def experience_aggregate(history: List[dict], tasks: List[dict], plans: List[dict],
                         events: List[dict]) -> Dict[str, Any]:
    asset_types = Counter(h.get("type") for h in history if h.get("type") in _ASSET_TYPES)

    agent_perf: Dict[str, Counter] = defaultdict(Counter)
    approved = rejected = 0
    for t in tasks:
        st = t.get("status")
        if st in _ACCEPTED:
            approved += 1
            if t.get("owner_agent"):
                agent_perf[t["owner_agent"]]["accepted"] += 1
        elif st == "rejected":
            rejected += 1
            if t.get("owner_agent"):
                agent_perf[t["owner_agent"]]["rejected"] += 1

    agent_rows = []
    for aid, c in agent_perf.items():
        n = c["accepted"] + c["rejected"]
        agent_rows.append({"agent": aid, "accepted": c["accepted"], "rejected": c["rejected"],
                           "rate": _pct(c["accepted"], n), "decided": n})
    agent_rows.sort(key=lambda r: (-r["rate"], -r["decided"]))

    weekday = Counter()
    for rec in list(history) + list(plans):
        d = _parse(rec.get("created_at"))
        if d:
            weekday[d.weekday()] += 1

    campaigns = [h for h in history if h.get("type") == "campaign"]
    campaigns.sort(key=lambda h: h.get("created_at", ""), reverse=True)

    return {
        "asset_types": dict(asset_types),
        "agent_performance": agent_rows,
        "approved": approved,
        "rejected": rejected,
        "approval_rate": _pct(approved, approved + rejected),
        "weekday": dict(weekday),
        "recent_campaigns": campaigns[:6],
        "feedback_count": len(events),
        "totals": {"assets": len(history), "tasks": len(tasks), "plans": len(plans)},
    }


def recurring_patterns(exp: Dict[str, Any], lang: str) -> List[str]:
    de = lang == "DE"
    out = []
    at = Counter(exp.get("asset_types", {}))
    if at:
        top, n = at.most_common(1)[0]
        out.append((f"Häufigstes Format: {top} ({n}×)" if de else f"Most-used format: {top} ({n}×)"))
    wd = exp.get("weekday", {})
    if wd:
        idx = max(wd, key=wd.get)
        day = WEEKDAYS["DE" if de else "EN"][int(idx)]
        out.append((f"Aktivster Tag: {day}" if de else f"Busiest day: {day}"))
    perf = exp.get("agent_performance", [])
    strong = [p for p in perf if p["decided"] >= 3 and p["rate"] >= 70]
    if strong:
        out.append((f"Stärkster Agent: {strong[0]['agent']} ({strong[0]['rate']}%)"
                    if de else f"Strongest agent: {strong[0]['agent']} ({strong[0]['rate']}%)"))
    if exp.get("approval_rate"):
        out.append((f"Gesamt-Freigabequote: {exp['approval_rate']}%"
                    if de else f"Overall approval rate: {exp['approval_rate']}%"))
    return out


# ---------------------------------------------------------------------------
# Memory Router – the context an agent receives
# ---------------------------------------------------------------------------
def _business_block(business_entries: List[dict], lang: str, limit: int = 8) -> str:
    de = lang == "DE"
    if not business_entries:
        return ""
    by_cat: Dict[str, List[dict]] = defaultdict(list)
    for e in business_entries:
        by_cat[e.get("category", "company_knowledge")].append(e)
    cat_label = {c["id"]: (c["de"] if de else c["en"]) for c in BUSINESS_CATEGORIES}
    lines = []
    shown = 0
    for cat, items in by_cat.items():
        for it in items:
            if shown >= limit:
                break
            title = (it.get("title") or "").strip()
            content = (it.get("content") or "").strip()
            if len(content) > 200:
                content = content[:200] + "…"
            lines.append(f"  - [{cat_label.get(cat, cat)}] {title}: {content}")
            shown += 1
    head = "Business Brain (Unternehmenswissen):" if de else "Business Brain (company knowledge):"
    return head + "\n" + "\n".join(lines) if lines else ""


def _experience_block(exp: Dict[str, Any], agent_id: Optional[str], lang: str) -> str:
    de = lang == "DE"
    parts = []
    # role-specific: this agent's own track record
    if agent_id:
        me = next((p for p in exp.get("agent_performance", []) if p["agent"] == agent_id), None)
        if me and me["decided"] >= 2:
            parts.append((f"Deine bisherige Freigabequote: {me['rate']}% ({me['accepted']}/{me['decided']})."
                          if de else f"Your track record: {me['rate']}% approved ({me['accepted']}/{me['decided']})."))
    patterns = recurring_patterns(exp, lang)
    if patterns:
        parts.append(("Erfahrungswerte: " if de else "Learnings: ") + "; ".join(patterns))
    if not parts:
        return ""
    head = "Experience Brain (was bisher funktioniert hat):" if de else "Experience Brain (what has worked so far):"
    return head + "\n  - " + "\n  - ".join(parts)


def build_context(agent_id: Optional[str], business_entries: List[dict],
                  exp: Dict[str, Any], lang: str) -> str:
    """Memory Context API – the routed memory block for an agent.

    Brand Brain is intentionally omitted here: it is already injected by
    ``_brand_context`` (brand + DNA). This block adds the Business and Experience
    brains the agent is entitled to.
    """
    brains = brains_for_agent(agent_id)
    blocks = []
    if BUSINESS in brains:
        b = _business_block(business_entries, lang)
        if b:
            blocks.append(b)
    if EXPERIENCE in brains:
        e = _experience_block(exp, agent_id, lang)
        if e:
            blocks.append(e)
    if not blocks:
        return ""
    header = ("GEDÄCHTNIS (nutze diese Erfahrungen, halluziniere nicht):"
              if lang == "DE" else "MEMORY (use these experiences, do not hallucinate):")
    return header + "\n" + "\n".join(blocks)


# ---------------------------------------------------------------------------
# Dashboard helpers: summaries, search, timeline, insights
# ---------------------------------------------------------------------------
def summarize(brand: dict, business_entries: List[dict], exp: Dict[str, Any], lang: str) -> dict:
    de = lang == "DE"
    return {
        "brains": [
            {"id": BRAND, "emoji": BRAIN_META[BRAND]["emoji"],
             "label": BRAIN_META[BRAND]["de"] if de else BRAIN_META[BRAND]["en"],
             "count": 1, "highlight": brand.get("name", "—")},
            {"id": BUSINESS, "emoji": BRAIN_META[BUSINESS]["emoji"],
             "label": BRAIN_META[BUSINESS]["de"] if de else BRAIN_META[BUSINESS]["en"],
             "count": len(business_entries),
             "highlight": (f"{len(business_entries)} Einträge" if de else f"{len(business_entries)} entries")},
            {"id": EXPERIENCE, "emoji": BRAIN_META[EXPERIENCE]["emoji"],
             "label": BRAIN_META[EXPERIENCE]["de"] if de else BRAIN_META[EXPERIENCE]["en"],
             "count": exp["totals"]["assets"] + exp["totals"]["tasks"],
             "highlight": (f"{exp['approval_rate']}% Freigabequote" if de else f"{exp['approval_rate']}% approval rate")},
        ],
    }


def search(query: str, brand: dict, business_entries: List[dict], exp: Dict[str, Any], lang: str) -> list:
    q = (query or "").lower().strip()
    if not q:
        return []
    hits = []
    # brand
    for k in ("name", "slogan", "tone", "products", "target_audience", "industry"):
        v = str(brand.get(k) or "")
        if q in v.lower():
            hits.append({"brain": BRAND, "title": k, "snippet": v[:160]})
    # business
    for e in business_entries:
        blob = f"{e.get('title','')} {e.get('content','')} {' '.join(e.get('tags',[]))}".lower()
        if q in blob:
            hits.append({"brain": BUSINESS, "title": e.get("title", ""),
                         "snippet": (e.get("content", "") or "")[:160], "category": e.get("category")})
    # experience (agent names / campaigns)
    for p in exp.get("agent_performance", []):
        if q in p["agent"].lower():
            hits.append({"brain": EXPERIENCE, "title": p["agent"],
                         "snippet": f"{p['rate']}% approved ({p['decided']} decided)"})
    for c in exp.get("recent_campaigns", []):
        t = str(c.get("topic") or c.get("title") or "")
        if q in t.lower():
            hits.append({"brain": EXPERIENCE, "title": t[:80], "snippet": "campaign"})
    return hits[:40]


def timeline(business_entries: List[dict], history: List[dict], tasks: List[dict],
             plans: List[dict], lang: str) -> list:
    ev = []
    for e in business_entries:
        ev.append({"brain": BUSINESS, "text": e.get("title", ""), "kind": e.get("category"),
                   "at": e.get("created_at")})
    for h in history:
        ev.append({"brain": EXPERIENCE, "text": (h.get("topic") or h.get("title") or h.get("type", "")),
                   "kind": h.get("type"), "at": h.get("created_at")})
    for t in tasks:
        if t.get("status") in ("approved", "completed", "rejected"):
            ev.append({"brain": EXPERIENCE,
                       "text": t.get("title", ""),
                       "kind": (t.get("status")), "at": t.get("updated_at") or t.get("created_at")})
    for p in plans:
        ev.append({"brain": EXPERIENCE, "text": p.get("goal", ""), "kind": "plan", "at": p.get("created_at")})
    ev = [e for e in ev if e.get("at")]
    ev.sort(key=lambda x: x["at"], reverse=True)
    return ev[:40]


def insights(exp: Dict[str, Any], business_entries: List[dict], lang: str) -> list:
    de = lang == "DE"
    out = []
    for p in recurring_patterns(exp, lang):
        out.append({"text": p, "brain": EXPERIENCE})
    if not business_entries:
        out.append({"text": ("Business Brain ist leer – ergänze Ziele, Strategie und SOPs."
                             if de else "Business Brain is empty – add goals, strategy and SOPs."),
                    "brain": BUSINESS})
    weak = [p for p in exp.get("agent_performance", []) if p["decided"] >= 3 and p["rate"] < 45]
    if weak:
        out.append({"text": (f"Schwacher Agent: {weak[0]['agent']} ({weak[0]['rate']}%) – Kontext schärfen."
                             if de else f"Weak agent: {weak[0]['agent']} ({weak[0]['rate']}%) – sharpen its context."),
                    "brain": EXPERIENCE})
    return out
