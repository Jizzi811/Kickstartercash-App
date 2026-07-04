"""Brand Identity schema – the four DNA layers, defined as data.

A brand's identity is split into four layers (Visual, Communication, Business,
Psychology). Each layer is a list of structured, user-editable fields. The schema
is intentionally *data-driven and extensible*: adding a new field or even a whole
new layer later is a change here only – no service or UI rewrite, because the
editor and the injection service iterate the schema generically.

Field shape:
    id        – stable key stored in brand["dna"][layer][id]
    de / en   – labels
    type      – text | textarea | list | select
    group     – UI grouping
    required  – counts toward validation (recommended core fields)
    weight    – contribution to the completeness score (core fields weigh more)
    options   – for select fields
    hint_de / hint_en – optional helper text
"""

from __future__ import annotations

from typing import Dict, List

VISUAL = "visual"
COMMUNICATION = "communication"
BUSINESS = "business"
PSYCHOLOGY = "psychology"

LAYER_IDS = [VISUAL, COMMUNICATION, BUSINESS, PSYCHOLOGY]

LAYER_META = {
    VISUAL: {"de": "Visuelle DNA", "en": "Visual DNA", "emoji": "🎨",
             "desc_de": "Alles Visuelle – der Designer greift hierauf zu.",
             "desc_en": "Everything visual – the Designer draws on this."},
    COMMUNICATION: {"de": "Kommunikations-DNA", "en": "Communication DNA", "emoji": "✍️",
                    "desc_de": "Wie die Marke spricht – der Copywriter nutzt dies.",
                    "desc_en": "How the brand speaks – the Copywriter uses this."},
    BUSINESS: {"de": "Business-DNA", "en": "Business DNA", "emoji": "📈",
               "desc_de": "Was die Marke verkauft und warum.",
               "desc_en": "What the brand sells and why."},
    PSYCHOLOGY: {"de": "Psychologische DNA", "en": "Psychology DNA", "emoji": "🧠",
                 "desc_de": "Warum Menschen kaufen – damit die KI verkauft, nicht nur schreibt.",
                 "desc_en": "Why people buy – so the AI sells, not just writes."},
}

# 12 classic brand archetypes
ARCHETYPES = [
    "Innocent", "Sage", "Explorer", "Outlaw", "Magician", "Hero",
    "Lover", "Jester", "Everyman", "Caregiver", "Ruler", "Creator",
]


def _f(fid, de, en, group, type_="textarea", required=False, weight=1, options=None, hint_de="", hint_en=""):
    return {"id": fid, "de": de, "en": en, "group": group, "type": type_,
            "required": required, "weight": weight, "options": options or [],
            "hint_de": hint_de, "hint_en": hint_en}


SCHEMA: Dict[str, List[dict]] = {
    VISUAL: [
        _f("color_system", "Farbsystem", "Color system", "Farben", required=True, weight=2,
           hint_de="Primär-, Sekundär-, Akzentfarben + Bedeutung", hint_en="Primary, secondary, accent + meaning"),
        _f("typography", "Typografie", "Typography", "Schrift", weight=2,
           hint_de="Schriftfamilien, Gewichte, Hierarchie", hint_en="Font families, weights, hierarchy"),
        _f("logo_usage", "Logo-Verwendung", "Logo usage", "Logo"),
        _f("imagery_style", "Bildsprache", "Imagery style", "Bild", required=True, weight=2),
        _f("photography_style", "Fotostil", "Photography style", "Bild"),
        _f("illustration_style", "Illustrationsstil", "Illustration style", "Bild"),
        _f("icon_style", "Icon-Stil", "Icon style", "Elemente"),
        _f("layout_principles", "Layout-Prinzipien", "Layout principles", "Layout"),
        _f("spacing_rules", "Abstände & Weißraum", "Spacing & whitespace", "Layout"),
        _f("motion_style", "Animationen", "Animation / motion", "Motion"),
        _f("brand_elements", "Markenelemente", "Brand elements", "Elemente", type_="list"),
        _f("design_donts", "Design No-Gos", "Design don'ts", "Regeln", type_="list"),
    ],
    COMMUNICATION: [
        _f("tone_of_voice", "Tonalität", "Tone of voice", "Ton", required=True, weight=3),
        _f("formality", "Ansprache", "Formality", "Ton", type_="select",
           options=["Du", "Sie", "Beides / kontextabhängig"], required=True, weight=2),
        _f("humor", "Humor", "Humor", "Ton"),
        _f("storytelling", "Storytelling-Stil", "Storytelling style", "Erzählung"),
        _f("emotions", "Emotionen", "Emotions", "Erzählung"),
        _f("headline_style", "Headline-Stil", "Headline style", "Format"),
        _f("cta_style", "CTA-Stil", "CTA style", "Format", weight=2),
        _f("sentence_length", "Satzlänge", "Sentence length", "Format", type_="select",
           options=["Kurz & knackig", "Mittel", "Lang & ausführlich", "Gemischt"]),
        _f("emoji_rules", "Emoji-Regeln", "Emoji rules", "Format", type_="select",
           options=["Keine", "Sparsam", "Moderat", "Viele"]),
        _f("favorite_phrases", "Lieblingsformulierungen", "Favorite phrases", "Wortschatz", type_="list"),
        _f("nogo_words", "No-Go-Wörter", "No-go words", "Wortschatz", type_="list", required=True, weight=3,
           hint_de="Wörter, die NIE vorkommen dürfen", hint_en="Words that must NEVER appear"),
    ],
    BUSINESS: [
        _f("mission", "Mission", "Mission", "Kern", required=True, weight=2),
        _f("vision", "Vision", "Vision", "Kern", weight=2),
        _f("goals", "Unternehmensziele", "Company goals", "Kern"),
        _f("usps", "USPs", "USPs", "Angebot", type_="list", required=True, weight=2),
        _f("products", "Produkte", "Products", "Angebot", required=True, weight=2),
        _f("services", "Services", "Services", "Angebot"),
        _f("pricing_strategy", "Preisstrategie", "Pricing strategy", "Angebot"),
        _f("target_audiences", "Zielgruppen", "Target audiences", "Markt", required=True, weight=3),
        _f("positioning", "Positionierung", "Positioning", "Markt", weight=2),
        _f("competitors", "Wettbewerber", "Competitors", "Markt", type_="list"),
        _f("market", "Markt", "Market", "Markt"),
        _f("selling_points", "Verkaufsargumente", "Selling points", "Angebot", type_="list", weight=2),
    ],
    PSYCHOLOGY: [
        _f("brand_personality", "Markenpersönlichkeit", "Brand personality", "Kern", required=True, weight=2),
        _f("archetype", "Archetyp", "Archetype", "Kern", type_="select", options=ARCHETYPES, required=True, weight=2),
        _f("core_emotions", "Kern-Emotionen", "Core emotions", "Kern"),
        _f("trust_building", "Vertrauensaufbau", "Trust building", "Vertrauen"),
        _f("motivations", "Motivationen", "Motivations", "Antrieb", weight=2),
        _f("pain_points", "Pain Points", "Pain points", "Antrieb", type_="list", required=True, weight=3),
        _f("desires", "Wünsche", "Desires", "Antrieb", type_="list", weight=2),
        _f("objections", "Einwände", "Objections", "Verkauf", type_="list"),
        _f("buying_triggers", "Kauftrigger", "Buying triggers", "Verkauf", type_="list", weight=2),
        _f("personality_traits", "Persönlichkeitsmerkmale", "Personality traits", "Kern", type_="list"),
    ],
}


def all_fields(layer: str) -> List[dict]:
    return SCHEMA.get(layer, [])


def field_ids(layer: str) -> List[str]:
    return [f["id"] for f in SCHEMA.get(layer, [])]


def schema_payload() -> dict:
    """Serializable schema for the frontend editor."""
    return {
        "layers": [
            {"id": lid, **LAYER_META[lid], "fields": SCHEMA[lid]}
            for lid in LAYER_IDS
        ],
        "archetypes": ARCHETYPES,
    }
