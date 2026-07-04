"""Brand Identity service – the DNA Injection Service and scoring.

Pure functions over a brand document. The brand's four-layer DNA lives inside
the brand doc under ``brand["dna"]`` (so it travels with every ``_resolve_brand``
call and needs no extra lookup). Where the DNA is empty, we transparently derive
sensible defaults from the existing Brand Brain primitives (colors, fonts, tone,
products, audience) – extending Brand Brain, never duplicating it.

Responsibilities:
- ``merged_dna`` / ``normalize_dna`` – the effective DNA (stored over derived).
- ``completeness`` / ``validate`` – the DNA Completeness Score + validation.
- ``layers_for_agent`` – which DNA layers a given agent receives.
- ``inject_context`` – the DNA Injection Service: the prompt block an agent gets.
- ``summary`` – a short human DNA summary.
- ``consistency_score`` – the Brand Consistency Score for a piece of content.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional

from .schema import (
    SCHEMA, LAYER_IDS, LAYER_META, VISUAL, COMMUNICATION, BUSINESS, PSYCHOLOGY,
)

# Which DNA layers each agent/role receives (the DNA Injection map).
# Unknown agents get the full identity (safe superset).
AGENT_DNA_MAP: Dict[str, List[str]] = {
    "ceo": [BUSINESS, COMMUNICATION, PSYCHOLOGY, VISUAL],
    "marketing": [BUSINESS, COMMUNICATION, PSYCHOLOGY],
    "designer": [VISUAL, COMMUNICATION],
    "video": [VISUAL, PSYCHOLOGY, COMMUNICATION],
    "seo": [BUSINESS, COMMUNICATION],
    "social": [COMMUNICATION, PSYCHOLOGY, VISUAL],
    "content": [COMMUNICATION, PSYCHOLOGY, BUSINESS],
    "email": [COMMUNICATION, PSYCHOLOGY, BUSINESS],
    "linkedin": [COMMUNICATION, BUSINESS, PSYCHOLOGY],
    "tiktok": [VISUAL, PSYCHOLOGY, COMMUNICATION],
    "sales": [PSYCHOLOGY, BUSINESS, COMMUNICATION],
    "analytics": [BUSINESS],
}


def layers_for_agent(agent_id: Optional[str]) -> List[str]:
    if not agent_id:
        return list(LAYER_IDS)
    return AGENT_DNA_MAP.get(agent_id, list(LAYER_IDS))


# ---------------------------------------------------------------------------
# DNA normalization / derivation
# ---------------------------------------------------------------------------
def _as_text(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(v).strip() for v in value if str(v).strip())
    return str(value or "").strip()


def normalize_dna(dna: Optional[dict]) -> Dict[str, dict]:
    out = {lid: {} for lid in LAYER_IDS}
    if isinstance(dna, dict):
        for lid in LAYER_IDS:
            layer = dna.get(lid)
            if isinstance(layer, dict):
                out[lid] = {k: v for k, v in layer.items() if v not in (None, "", [])}
    return out


def derive_from_brand(brand: dict) -> Dict[str, dict]:
    """Seed DNA from existing Brand Brain primitives (never overrides stored DNA)."""
    derived: Dict[str, dict] = {lid: {} for lid in LAYER_IDS}
    colors = ", ".join([c for c in [brand.get("primary_color"), brand.get("secondary_color"),
                                    brand.get("accent_color")] if c])
    if colors:
        derived[VISUAL]["color_system"] = colors
    fonts = ", ".join([f for f in [brand.get("font_heading"), brand.get("font_body")] if f])
    if fonts:
        derived[VISUAL]["typography"] = fonts
    if brand.get("image_style"):
        derived[VISUAL]["imagery_style"] = brand["image_style"]
    if brand.get("logo_url"):
        derived[VISUAL]["logo_usage"] = brand["logo_url"]
    if brand.get("tone"):
        derived[COMMUNICATION]["tone_of_voice"] = brand["tone"]
    if brand.get("products"):
        derived[BUSINESS]["products"] = brand["products"]
    if brand.get("target_audience"):
        derived[BUSINESS]["target_audiences"] = brand["target_audience"]
    if brand.get("industry"):
        derived[BUSINESS]["market"] = brand["industry"]
    if brand.get("slogan"):
        derived[BUSINESS]["positioning"] = brand["slogan"]
    return derived


def merged_dna(brand: dict) -> Dict[str, dict]:
    """Effective DNA: brand-derived defaults with stored DNA layered on top."""
    derived = derive_from_brand(brand)
    stored = normalize_dna(brand.get("dna"))
    for lid in LAYER_IDS:
        merged = dict(derived[lid])
        merged.update(stored[lid])
        derived[lid] = merged
    return derived


# ---------------------------------------------------------------------------
# Completeness + validation
# ---------------------------------------------------------------------------
def completeness(brand: dict) -> dict:
    dna = merged_dna(brand)
    layers = {}
    total_w = 0.0
    filled_w = 0.0
    for lid in LAYER_IDS:
        lt = lf = 0.0
        for field in SCHEMA[lid]:
            w = field.get("weight", 1)
            lt += w
            if _as_text(dna[lid].get(field["id"])):
                lf += w
        pct = round((lf / lt) * 100) if lt else 0
        layers[lid] = {"pct": pct, "filled_weight": lf, "total_weight": lt,
                       "label_de": LAYER_META[lid]["de"], "label_en": LAYER_META[lid]["en"],
                       "emoji": LAYER_META[lid]["emoji"]}
        total_w += lt
        filled_w += lf
    overall = round((filled_w / total_w) * 100) if total_w else 0
    return {"overall": overall, "layers": layers}


def validate(brand: dict) -> dict:
    dna = merged_dna(brand)
    missing = {}
    for lid in LAYER_IDS:
        gaps = []
        for field in SCHEMA[lid]:
            if field.get("required") and not _as_text(dna[lid].get(field["id"])):
                gaps.append({"id": field["id"], "de": field["de"], "en": field["en"]})
        if gaps:
            missing[lid] = gaps
    return missing


# ---------------------------------------------------------------------------
# DNA Injection Service
# ---------------------------------------------------------------------------
def _field_label(lid: str, fid: str, lang: str) -> str:
    for f in SCHEMA[lid]:
        if f["id"] == fid:
            return f["de"] if lang == "DE" else f["en"]
    return fid


def inject_context(brand: dict, agent_id: Optional[str] = None, lang: str = "DE",
                   max_field_chars: int = 240) -> str:
    """Return the DNA prompt block for the layers this agent should receive.

    This is the single DNA Injection Service every AI entry point uses (via
    ``_brand_context``). Returns '' when there is no DNA to inject.
    """
    dna = merged_dna(brand)
    layers = layers_for_agent(agent_id)
    de = lang == "DE"
    blocks: List[str] = []
    for lid in layers:
        filled = [(f["id"], dna[lid].get(f["id"])) for f in SCHEMA[lid]
                  if _as_text(dna[lid].get(f["id"]))]
        if not filled:
            continue
        head = LAYER_META[lid]["de"] if de else LAYER_META[lid]["en"]
        lines = []
        for fid, val in filled:
            text = _as_text(val)
            if len(text) > max_field_chars:
                text = text[:max_field_chars] + "…"
            lines.append(f"  - {_field_label(lid, fid, lang)}: {text}")
        blocks.append(f"[{head}]\n" + "\n".join(lines))

    if not blocks:
        return ""

    # Hard rules always surface, even if their layer wasn't selected.
    comm = dna[COMMUNICATION]
    hard = []
    nogo = _as_text(comm.get("nogo_words"))
    if nogo:
        hard.append((f"Verwende NIEMALS diese Wörter: {nogo}." if de
                     else f"NEVER use these words: {nogo}."))
    formality = _as_text(comm.get("formality"))
    if formality:
        hard.append((f"Ansprache: {formality}." if de else f"Address the reader as: {formality}."))
    emoji = _as_text(comm.get("emoji_rules"))
    if emoji:
        hard.append((f"Emoji-Regel: {emoji}." if de else f"Emoji rule: {emoji}."))

    header = ("MARKEN-IDENTITÄT (DNA) – strikt und konsistent beachten:"
              if de else "BRAND IDENTITY (DNA) – respect strictly and consistently:")
    out = header + "\n" + "\n".join(blocks)
    if hard:
        out += ("\nHARTE REGELN: " if de else "\nHARD RULES: ") + " ".join(hard)
    return out


def visual_prompt_hint(brand: dict, max_chars: int = 400) -> str:
    """Concise Visual-DNA descriptor appended to image-generation prompts.

    Image prompts don't flow through _brand_context, so this is the Visual-DNA
    entry point for the Designer / image tools.
    """
    dna = merged_dna(brand)
    vis = dna[VISUAL]
    order = ["imagery_style", "photography_style", "illustration_style",
             "color_system", "icon_style", "layout_principles", "brand_elements"]
    parts = []
    for fid in order:
        val = _as_text(vis.get(fid))
        if val:
            parts.append(val)
    donts = _as_text(vis.get("design_donts"))
    hint = ", ".join(parts)
    if len(hint) > max_chars:
        hint = hint[:max_chars] + "…"
    if donts:
        hint += f". Avoid: {donts}"
    return hint


def summary(brand: dict, lang: str = "DE") -> dict:
    dna = merged_dna(brand)
    de = lang == "DE"
    comp = completeness(brand)
    picks = {
        VISUAL: ["imagery_style", "color_system"],
        COMMUNICATION: ["tone_of_voice", "formality"],
        BUSINESS: ["positioning", "target_audiences"],
        PSYCHOLOGY: ["archetype", "brand_personality"],
    }
    rows = []
    for lid in LAYER_IDS:
        bits = [_as_text(dna[lid].get(fid)) for fid in picks[lid] if _as_text(dna[lid].get(fid))]
        rows.append({
            "layer": lid,
            "label": LAYER_META[lid]["de"] if de else LAYER_META[lid]["en"],
            "emoji": LAYER_META[lid]["emoji"],
            "pct": comp["layers"][lid]["pct"],
            "highlight": " · ".join(bits) if bits else ("—"),
        })
    return {"overall": comp["overall"], "layers": rows}


# ---------------------------------------------------------------------------
# Brand Consistency Score (heuristic, explainable)
# ---------------------------------------------------------------------------
_EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF]"
)


def _tokens(text: str) -> List[str]:
    return [t.strip() for t in re.split(r"[,\n;/]+", text) if t.strip()]


def _contains_any(haystack: str, needles: List[str]) -> List[str]:
    hl = haystack.lower()
    return [n for n in needles if n.strip() and n.strip().lower() in hl]


def consistency_score(content: str, brand: dict, lang: str = "DE",
                      content_type: str = "text") -> dict:
    dna = merged_dna(brand)
    de = lang == "DE"
    text = content or ""
    low = text.lower()
    layer_scores: Dict[str, dict] = {}

    # -- Communication --------------------------------------------------
    comm = dna[COMMUNICATION]
    c_score = 100.0
    findings = []
    nogo = _tokens(_as_text(comm.get("nogo_words")))
    hit = _contains_any(low, nogo)
    if hit:
        c_score -= min(60, 20 * len(hit))
        findings.append((f"No-Go-Wörter gefunden: {', '.join(hit)}" if de
                         else f"No-go words found: {', '.join(hit)}"))
    fav = _tokens(_as_text(comm.get("favorite_phrases")))
    if fav and _contains_any(low, fav):
        c_score = min(100.0, c_score + 5)
        findings.append(("Lieblingsformulierungen verwendet" if de else "Uses favorite phrases"))
    formality = _as_text(comm.get("formality"))
    if formality.startswith("Sie") and re.search(r"\b(du|dein|dir|dich)\b", low):
        c_score -= 15
        findings.append(("Ansprache soll 'Sie' sein, Text nutzt 'du'" if de
                         else "Formality should be formal, text uses informal"))
    if formality.startswith("Du") and re.search(r"\b(sie|ihnen|ihr)\b", low):
        c_score -= 10
        findings.append(("Ansprache soll 'Du' sein, Text wirkt förmlich" if de
                         else "Formality should be informal, text reads formal"))
    emoji_rule = _as_text(comm.get("emoji_rules"))
    has_emoji = bool(_EMOJI_RE.search(text))
    if emoji_rule == "Keine" and has_emoji:
        c_score -= 15
        findings.append(("Emojis trotz Regel 'Keine'" if de else "Emojis despite 'None' rule"))
    if emoji_rule == "Viele" and not has_emoji:
        c_score -= 5
        findings.append(("Keine Emojis trotz Regel 'Viele'" if de else "No emojis despite 'Many' rule"))
    layer_scores[COMMUNICATION] = {"score": max(0, round(c_score)), "findings": findings}

    # -- Business -------------------------------------------------------
    biz = dna[BUSINESS]
    b_terms = _tokens(_as_text(biz.get("usps"))) + _tokens(_as_text(biz.get("selling_points"))) \
        + _tokens(_as_text(biz.get("products")))
    b_hit = _contains_any(low, b_terms)
    b_score = 70 + min(30, 10 * len(b_hit)) if b_terms else 75
    layer_scores[BUSINESS] = {
        "score": round(b_score),
        "findings": ([(f"Bezug auf Angebot: {', '.join(b_hit[:3])}" if de else f"References offering: {', '.join(b_hit[:3])}")]
                     if b_hit else [("Kein klarer Bezug zu USPs/Produkten" if de else "No clear tie to USPs/products")]),
    }

    # -- Psychology -----------------------------------------------------
    psy = dna[PSYCHOLOGY]
    p_terms = _tokens(_as_text(psy.get("pain_points"))) + _tokens(_as_text(psy.get("desires"))) \
        + _tokens(_as_text(psy.get("buying_triggers")))
    p_hit = _contains_any(low, p_terms)
    p_score = 70 + min(30, 10 * len(p_hit)) if p_terms else 75
    layer_scores[PSYCHOLOGY] = {
        "score": round(p_score),
        "findings": ([(f"Spricht Trigger/Wünsche an: {', '.join(p_hit[:3])}" if de else f"Addresses triggers/desires: {', '.join(p_hit[:3])}")]
                     if p_hit else [("Wenig psychologischer Hebel" if de else "Little psychological leverage")]),
    }

    # -- Visual (only meaningful for image prompts) ---------------------
    applicable = [COMMUNICATION, BUSINESS, PSYCHOLOGY]
    if content_type == "image":
        vis = dna[VISUAL]
        v_terms = _tokens(_as_text(vis.get("imagery_style"))) + _tokens(_as_text(vis.get("color_system")))
        v_hit = _contains_any(low, v_terms)
        v_score = 70 + min(30, 10 * len(v_hit)) if v_terms else 75
        layer_scores[VISUAL] = {
            "score": round(v_score),
            "findings": ([("Bildsprache aufgegriffen" if de else "Picks up imagery style")]
                         if v_hit else [("Bildsprache nicht erkennbar" if de else "Imagery style not evident")]),
        }
        applicable.append(VISUAL)

    overall = round(sum(layer_scores[l]["score"] for l in applicable) / len(applicable))
    return {
        "overall": overall,
        "layers": {l: {**layer_scores[l],
                       "label_de": LAYER_META[l]["de"], "label_en": LAYER_META[l]["en"],
                       "emoji": LAYER_META[l]["emoji"]}
                   for l in layer_scores},
    }
