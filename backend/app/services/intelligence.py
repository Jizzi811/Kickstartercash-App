"""BrandMind Intelligence Engine – internal learning layer.

This is NOT machine learning. No models are trained. It is a deterministic,
explainable aggregation layer that turns a workspace's *own* activity into
insights, recommendations, performance trends and time-boxed summaries.

Every function here is pure: it receives records that the caller has already
fetched, workspace-scoped and tied to the active Brand Brain, and returns plain
dicts. The database and scoping live in the API layer (``server.py``); keeping
the engines pure makes them trivial to reason about and to test.

Pipeline (as requested):

    IntelligenceService            (server.py – gathers scoped data)
        -> LearningEngine          (normalize raw records into signals)
        -> PerformanceEngine       (metrics + trends over time)
        -> InsightsEngine          (human-readable insight cards)
        -> RecommendationEngine    (actionable recommendations + optimizations)

Honesty rule: an insight is only emitted when there is enough data to support
it. Each insight carries a ``confidence`` derived from its sample size, so the
UI never presents a coincidence as a fact.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

WEEKDAYS_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
WEEKDAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# task statuses that count as "the suggestion was accepted"
_ACCEPTED = {"approved", "in_progress", "done"}
_DECIDED = _ACCEPTED | {"rejected"}

# nice labels for history asset types
ASSET_LABELS = {
    "social": {"de": "Social-Media-Posts", "en": "social media posts"},
    "copy": {"de": "Werbetexte", "en": "ad copy"},
    "image": {"de": "Bilder", "en": "images"},
    "campaign": {"de": "Kampagnen", "en": "campaigns"},
    "calendar": {"de": "Content-Kalender", "en": "content calendars"},
    "landingpage": {"de": "Landingpages", "en": "landing pages"},
    "analysis": {"de": "Analysen", "en": "analyses"},
    "veo": {"de": "Videos", "en": "videos"},
}

# department -> human name (mirrors MISSION_DEPARTMENTS owner agents)
DEPT_LABELS = {
    "marketing": {"de": "Marketing", "en": "Marketing"},
    "design": {"de": "Design", "en": "Design"},
    "seo": {"de": "SEO", "en": "SEO"},
    "video": {"de": "Video", "en": "Video"},
    "sales": {"de": "Sales", "en": "Sales"},
    "automation": {"de": "Automation", "en": "Automation"},
    "analytics": {"de": "Analytics", "en": "Analytics"},
    "support": {"de": "Support", "en": "Support"},
}


def _parse_iso(value: Any) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _confidence(n: int) -> str:
    if n >= 20:
        return "high"
    if n >= 8:
        return "medium"
    return "low"


def _pct(part: int, whole: int) -> int:
    return round((part / whole) * 100) if whole else 0


# ---------------------------------------------------------------------------
# Learning Engine – normalize raw records into signals
# ---------------------------------------------------------------------------
class LearningEngine:
    """Turns raw workspace records into a normalized ``signals`` dict that the
    other engines read. This is the memory of the system: what was generated,
    approved, rejected, when, and by which department/agent."""

    @staticmethod
    def signals(history: List[dict], tasks: List[dict], plans: List[dict],
                events: List[dict]) -> Dict[str, Any]:
        asset_types = Counter(h.get("type") for h in history if h.get("type") in ASSET_LABELS)

        # weekday distribution of activity (publishing / creation cadence)
        weekday_counts: Counter = Counter()
        for rec in list(history) + list(plans):
            dt = _parse_iso(rec.get("created_at"))
            if dt:
                weekday_counts[dt.weekday()] += 1

        # approvals by department + owner agent
        dept_decided: Dict[str, Counter] = defaultdict(Counter)
        agent_decided: Dict[str, Counter] = defaultdict(Counter)
        status_counts: Counter = Counter()
        for t in tasks:
            st = t.get("status")
            status_counts[st] += 1
            if st in _DECIDED:
                bucket = "accepted" if st in _ACCEPTED else "rejected"
                dept_decided[t.get("department", "?")][bucket] += 1
                if t.get("owner_agent"):
                    agent_decided[t["owner_agent"]][bucket] += 1

        plan_status = Counter(p.get("status") for p in plans)

        # completed tasks per ISO week (velocity)
        velocity: Counter = Counter()
        for t in tasks:
            if t.get("status") == "done":
                dt = _parse_iso(t.get("updated_at") or t.get("created_at"))
                if dt:
                    iso = dt.isocalendar()
                    velocity[f"{iso[0]}-W{iso[1]:02d}"] += 1

        interaction_count = len(events) + len(tasks) + len(history)

        return {
            "asset_types": asset_types,
            "weekday_counts": weekday_counts,
            "dept_decided": dept_decided,
            "agent_decided": agent_decided,
            "status_counts": status_counts,
            "plan_status": plan_status,
            "velocity": velocity,
            "totals": {
                "assets": len(history),
                "tasks": len(tasks),
                "plans": len(plans),
                "events": len(events),
                "interactions": interaction_count,
            },
        }


# ---------------------------------------------------------------------------
# Performance Engine – metrics + trends over time
# ---------------------------------------------------------------------------
class PerformanceEngine:
    """Computes headline metrics and time-series trends. No external analytics –
    everything is derived from the workspace's own timestamps and statuses."""

    @staticmethod
    def metrics(signals: Dict[str, Any]) -> Dict[str, Any]:
        status = signals["status_counts"]
        accepted = sum(status.get(s, 0) for s in _ACCEPTED)
        decided = accepted + status.get("rejected", 0)
        return {
            "approval_rate": _pct(accepted, decided),
            "decided_tasks": decided,
            "rejected": status.get("rejected", 0),
            "proposed_open": status.get("proposed", 0),
            "assets_total": signals["totals"]["assets"],
            "plans_total": signals["totals"]["plans"],
        }

    @staticmethod
    def trends(history: List[dict], tasks: List[dict], plans: List[dict],
               days: int = 30) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=days - 1)

        def _daily(records, ts_key="created_at", predicate=None):
            buckets: Counter = Counter()
            for r in records:
                if predicate and not predicate(r):
                    continue
                dt = _parse_iso(r.get(ts_key))
                if dt and dt >= start:
                    buckets[dt.date().isoformat()] += 1
            series = []
            for i in range(days):
                day = (start + timedelta(days=i)).date().isoformat()
                series.append({"date": day, "value": buckets.get(day, 0)})
            return series

        return {
            "assets": _daily(history),
            "approved": _daily(tasks, ts_key="updated_at",
                               predicate=lambda t: t.get("status") in _ACCEPTED),
            "plans": _daily(plans),
            "window_days": days,
        }


# ---------------------------------------------------------------------------
# Insights Engine – human-readable insight cards
# ---------------------------------------------------------------------------
class InsightsEngine:
    """Turns signals into insight cards. Each card is explainable and carries a
    confidence based on how much data supports it."""

    @staticmethod
    def cards(signals: Dict[str, Any], brand: dict, lang: str) -> List[dict]:
        de = lang == "DE"
        cards: List[dict] = []

        def card(cid, icon, category, title, detail, metric=None, n=0):
            cards.append({
                "id": cid, "icon": icon, "category": category,
                "title": title, "detail": detail, "metric": metric,
                "confidence": _confidence(n), "sample": n,
            })

        # 1) dominant asset type
        asset_types: Counter = signals["asset_types"]
        total_assets = sum(asset_types.values())
        if total_assets >= 3:
            top_type, top_n = asset_types.most_common(1)[0]
            label = ASSET_LABELS.get(top_type, {}).get("de" if de else "en", top_type)
            share = _pct(top_n, total_assets)
            card("top_asset", "layers", "content",
                 (f"{label.capitalize()} sind dein häufigstes Format" if de
                  else f"{label.capitalize()} are your most-used format"),
                 (f"{share}% deiner generierten Assets sind {label}. "
                  "Doppel auf das, was funktioniert – aber teste bewusst neue Formate."
                  if de else
                  f"{share}% of your generated assets are {label}. "
                  "Lean into what works – but deliberately test new formats too."),
                 metric=f"{share}%", n=total_assets)

        # 2) best day to publish / create
        wc: Counter = signals["weekday_counts"]
        wtotal = sum(wc.values())
        if wtotal >= 5:
            top_day_idx, top_day_n = wc.most_common(1)[0]
            day_name = (WEEKDAYS_DE if de else WEEKDAYS_EN)[top_day_idx]
            share = _pct(top_day_n, wtotal)
            card("best_day", "calendar", "timing",
                 (f"Du arbeitest meistens {day_name}s" if de
                  else f"You mostly create on {day_name}s"),
                 (f"{share}% deiner Aktivität fällt auf {day_name}e. "
                  f"Plane wichtige Veröffentlichungen auf diesen Tag."
                  if de else
                  f"{share}% of your activity happens on {day_name}s. "
                  f"Schedule important publishing for that day."),
                 metric=day_name, n=wtotal)

        # 3) agent / department approval rate (e.g. Marketing Director)
        agent_decided: Dict[str, Counter] = signals["agent_decided"]
        for agent_id, c in agent_decided.items():
            n = c["accepted"] + c["rejected"]
            if n >= 5:
                rate = _pct(c["accepted"], n)
                name = _agent_display(agent_id, de)
                if rate >= 70:
                    card(f"agent_{agent_id}", "check-circle", "agents",
                         (f"{name}-Vorschläge werden zu {rate}% angenommen" if de
                          else f"{name} suggestions are approved {rate}% of the time"),
                         (f"Von {n} Entscheidungen wurden {c['accepted']} freigegeben. "
                          f"Diesem Agenten kannst du vertrauen." if de else
                          f"Of {n} decisions, {c['accepted']} were approved. "
                          f"You can lean on this agent."),
                         metric=f"{rate}%", n=n)
                elif rate <= 45:
                    card(f"agent_{agent_id}", "alert-triangle", "agents",
                         (f"{name}-Vorschläge werden nur zu {rate}% angenommen" if de
                          else f"{name} suggestions are only approved {rate}% of the time"),
                         ("Schärfe das Brand Brain für diesen Bereich, damit die "
                          "Vorschläge besser treffen." if de else
                          "Sharpen the Brand Brain for this area so suggestions land better."),
                         metric=f"{rate}%", n=n)

        # 4) overall momentum
        totals = signals["totals"]
        if totals["assets"] + totals["tasks"] == 0:
            card("cold_start", "sparkles", "onboarding",
                 ("Noch keine Daten – leg los!" if de else "No data yet – get started!"),
                 ("Erstelle Assets und einen Mission-Control-Plan. Die Intelligence "
                  "Engine lernt aus jeder Aktion." if de else
                  "Generate assets and a Mission Control plan. The Intelligence Engine "
                  "learns from every action."),
                 n=0)

        return cards


def _agent_display(agent_id: str, de: bool) -> str:
    names = {
        "marketing": "Marketing Director", "designer": "Design",
        "seo": "SEO", "video": "Video", "sales": "Sales",
        "automation": "Automation", "analytics": "Analytics",
    }
    return names.get(agent_id, agent_id.capitalize())


# ---------------------------------------------------------------------------
# Recommendation Engine – actionable recommendations + optimizations
# ---------------------------------------------------------------------------
class RecommendationEngine:
    """Derives next-best-actions and optimization suggestions from the signals
    and the computed metrics. Recommendations are advisory only – execution
    always stays human-approved."""

    @staticmethod
    def recommendations(signals: Dict[str, Any], metrics: Dict[str, Any],
                        brand: dict, lang: str) -> Dict[str, List[dict]]:
        de = lang == "DE"
        recs: List[dict] = []
        optims: List[dict] = []

        def rec(rid, title, detail, action, priority="medium"):
            recs.append({"id": rid, "title": title, "detail": detail,
                         "action": action, "priority": priority})

        def opt(oid, title, detail, action, priority="medium"):
            optims.append({"id": oid, "title": title, "detail": detail,
                           "action": action, "priority": priority})

        # open proposals waiting
        open_props = metrics.get("proposed_open", 0)
        if open_props:
            rec("review_open",
                (f"{open_props} Vorschläge warten auf Freigabe" if de
                 else f"{open_props} suggestions await approval"),
                ("Gib offene Tasks frei, damit die Engine lernt, was du magst."
                 if de else "Approve open tasks so the engine learns your taste."),
                "review_tasks", "high")

        # low approval rate -> optimize brand brain
        if metrics.get("decided_tasks", 0) >= 8 and metrics.get("approval_rate", 100) < 55:
            opt("sharpen_brand",
                ("Niedrige Freigabequote – Brand Brain schärfen" if de
                 else "Low approval rate – sharpen the Brand Brain"),
                (f"Nur {metrics['approval_rate']}% der Vorschläge werden angenommen. "
                 "Ergänze Zielgruppe, Tonalität und No-Gos im Brand Brain."
                 if de else
                 f"Only {metrics['approval_rate']}% of suggestions are accepted. "
                 "Add audience, tone and no-gos to the Brand Brain."),
                "open_brand_brain", "high")

        # concentrated format -> diversify
        asset_types: Counter = signals["asset_types"]
        total = sum(asset_types.values())
        if total >= 6:
            top_type, top_n = asset_types.most_common(1)[0]
            if _pct(top_n, total) >= 70:
                label = ASSET_LABELS.get(top_type, {}).get("de" if de else "en", top_type)
                opt("diversify",
                    ("Formatmix erweitern" if de else "Diversify your format mix"),
                    (f"Der Großteil deiner Assets sind {label}. Teste ein zweites Format "
                     "für mehr Reichweite." if de else
                     f"Most of your assets are {label}. Test a second format to widen reach."),
                    "open_studio", "medium")

        # brand-brain completeness nudge
        missing = [k for k in ("target_audience", "tone", "products") if not (brand.get(k) or "").strip()]
        if missing:
            opt("complete_brain",
                ("Brand Brain vervollständigen" if de else "Complete your Brand Brain"),
                ("Fehlende Felder senken die Qualität aller Empfehlungen: "
                 + ", ".join(missing) if de else
                 "Missing fields lower the quality of every recommendation: "
                 + ", ".join(missing)),
                "open_brand_brain", "medium")

        # best-day scheduling recommendation
        wc: Counter = signals["weekday_counts"]
        if sum(wc.values()) >= 5:
            idx = wc.most_common(1)[0][0]
            day = (WEEKDAYS_DE if de else WEEKDAYS_EN)[idx]
            rec("schedule_day",
                (f"Wichtige Inhalte auf {day} legen" if de
                 else f"Schedule key content for {day}"),
                (f"Deine Aktivität konzentriert sich auf {day}e." if de
                 else f"Your activity concentrates on {day}s."),
                "open_calendar", "low")

        if not recs:
            rec("keep_going",
                ("Weiter so" if de else "Keep going"),
                ("Erstelle mehr Assets und Pläne – je mehr Signale, desto schärfer "
                 "die Empfehlungen." if de else
                 "Create more assets and plans – more signal means sharper advice."),
                "create_plan", "low")

        return {"recommendations": recs, "optimizations": optims}


# ---------------------------------------------------------------------------
# Summaries – daily / weekly / monthly rollups
# ---------------------------------------------------------------------------
def build_summary(history: List[dict], tasks: List[dict], plans: List[dict],
                  period: str, lang: str) -> Dict[str, Any]:
    de = lang == "DE"
    now = datetime.now(timezone.utc)
    spans = {"daily": 1, "weekly": 7, "monthly": 30}
    days = spans.get(period, 7)
    start = now - timedelta(days=days)

    def _in_window(rec, ts_key="created_at"):
        dt = _parse_iso(rec.get(ts_key))
        return bool(dt and dt >= start)

    win_assets = [h for h in history if _in_window(h)]
    win_plans = [p for p in plans if _in_window(p)]
    win_approved = [t for t in tasks if t.get("status") in _ACCEPTED and _in_window(t, "updated_at")]
    win_rejected = [t for t in tasks if t.get("status") == "rejected" and _in_window(t, "updated_at")]

    asset_types = Counter(h.get("type") for h in win_assets if h.get("type") in ASSET_LABELS)
    dept_counts = Counter(t.get("department") for t in win_approved)

    top_asset = None
    if asset_types:
        tt, _ = asset_types.most_common(1)[0]
        top_asset = ASSET_LABELS.get(tt, {}).get("de" if de else "en", tt)
    top_dept = None
    if dept_counts:
        td, _ = dept_counts.most_common(1)[0]
        top_dept = DEPT_LABELS.get(td, {}).get("de" if de else "en", td)

    highlights: List[str] = []
    if win_assets:
        highlights.append((f"{len(win_assets)} Assets erstellt" if de
                           else f"{len(win_assets)} assets created"))
    if win_approved:
        highlights.append((f"{len(win_approved)} Tasks freigegeben" if de
                           else f"{len(win_approved)} tasks approved"))
    if win_plans:
        highlights.append((f"{len(win_plans)} Pläne erstellt" if de
                           else f"{len(win_plans)} plans created"))
    if top_asset:
        highlights.append((f"Top-Format: {top_asset}" if de else f"Top format: {top_asset}"))
    if not highlights:
        highlights.append(("Keine Aktivität in diesem Zeitraum" if de
                           else "No activity in this period"))

    period_label = {
        "daily": ("Heute", "Today"),
        "weekly": ("Diese Woche", "This week"),
        "monthly": ("Dieser Monat", "This month"),
    }.get(period, ("Zeitraum", "Period"))

    return {
        "period": period,
        "label": period_label[0] if de else period_label[1],
        "generated": len(win_assets),
        "approved": len(win_approved),
        "rejected": len(win_rejected),
        "plans": len(win_plans),
        "top_asset_type": top_asset,
        "top_department": top_dept,
        "highlights": highlights,
    }


# ---------------------------------------------------------------------------
# Orchestrator convenience – the full intelligence payload
# ---------------------------------------------------------------------------
def build_intelligence(history: List[dict], tasks: List[dict], plans: List[dict],
                       events: List[dict], brand: dict, lang: str) -> Dict[str, Any]:
    signals = LearningEngine.signals(history, tasks, plans, events)
    metrics = PerformanceEngine.metrics(signals)
    trends = PerformanceEngine.trends(history, tasks, plans)
    insights = InsightsEngine.cards(signals, brand, lang)
    rec_bundle = RecommendationEngine.recommendations(signals, metrics, brand, lang)

    return {
        "brand": {"id": brand.get("id"), "name": brand.get("name")},
        "metrics": metrics,
        "trends": trends,
        "insights": insights,
        "recommendations": rec_bundle["recommendations"],
        "optimizations": rec_bundle["optimizations"],
        "totals": signals["totals"],
        "generated_at": now_iso(),
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
