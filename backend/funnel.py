"""Renders the Kickstartercash.Club funnel bundle with per-member personalization.

The uploaded bundle is a self-contained "DC" page: a bundler loader + a 28MB
asset manifest + an HTML template. The template's data binding is driven by a
`data-props` JSON (defaults) read by the bundled DC runtime. We personalize the
funnel by overriding those defaults and by injecting a fetch() call into the
form submit handler so the advisor receives an email lead.
"""
import re
import json
import html
from pathlib import Path

BUNDLE_PATH = Path(__file__).parent / "funnel_bundle.html"

# config field -> data-props key
PROP_MAP = {
    "reflink": "refLink",
    "cta_text": "primaryCtaText",
    "name": "sponsorName",
    "role": "sponsorRole",
    "city": "sponsorCity",
    "phone": "sponsorPhone",
    "whatsapp": "sponsorWhatsapp",
    "email": "sponsorEmail",
    "telegram": "sponsorTelegram",
    "instagram": "sponsorInstagram",
    "impressum_url": "impressumUrl",
    "datenschutz_url": "datenschutzUrl",
}


def _load_bundle() -> str:
    return BUNDLE_PATH.read_text(encoding="utf-8")


def _override_data_props(template: str, config: dict) -> str:
    m = re.search(r'data-props="(.*?)"', template, re.DOTALL)
    if not m:
        return template
    raw = m.group(1)
    props = json.loads(html.unescape(raw))

    for cfg_key, prop_key in PROP_MAP.items():
        if prop_key in props and config.get(cfg_key) not in (None, ""):
            props[prop_key]["default"] = config[cfg_key]

    # countdown
    if "countdownEnabled" in props:
        props["countdownEnabled"]["default"] = bool(config.get("countdown_enabled", False))
    if "webinarDate" in props and config.get("webinar_date"):
        props["webinarDate"]["default"] = config["webinar_date"]

    new_raw = html.escape(json.dumps(props, ensure_ascii=False), quote=True)
    return template[:m.start(1)] + new_raw + template[m.end(1):]


def _inject_lead_fetch(template: str, lead_url: str) -> str:
    """Make the funnel form POST the lead to our backend (advisor email)."""
    target = "this.setState({ submitted: true, error: '' });"
    inject = (
        target
        + "\n    try { fetch(" + json.dumps(lead_url) + ", { method: 'POST', "
        "headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "
        "vorname: f.vorname, nachname: f.nachname, email: f.email, telefon: f.telefon, "
        "land: f.land, nachricht: f.nachricht }) }); } catch (err) {}"
    )
    return template.replace(target, inject, 1)


def _inject_error_suppressor(bundle: str) -> str:
    """Suppress the bundler's benign runtime error (visible red bar + console)
    so visitors never see dev error output on the published funnel."""
    snippet = (
        "<head>\n"
        "<style>#__bundler_err{display:none!important;visibility:hidden!important;}</style>\n"
        "<script>(function(){function s(e){try{var m=(e&&(e.message||(e.reason&&e.reason.message)))||'';"
        "if(m.indexOf(\"reading 'document'\")!==-1||m.indexOf('Cannot read properties of null')!==-1){"
        "if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();return true;}}catch(_){}}"
        "window.addEventListener('error',s,true);window.addEventListener('unhandledrejection',s,true);"
        "var _ce=console.error;console.error=function(){try{var a=Array.prototype.slice.call(arguments).join(' ');"
        "if(a.indexOf(\"reading 'document'\")!==-1||a.indexOf('[bundle] Uncaught')!==-1)return;}catch(_){}_ce.apply(console,arguments);};"
        "})();</script>"
    )
    return bundle.replace("<head>", snippet, 1)


def _inject_sponsor_photo(template: str, config: dict) -> str:
    """Replace the advisor photo slot with the uploaded image if present."""
    photo = config.get("photo")
    if not photo:
        return template
    img = (
        '<img src="' + photo + '" alt="Berater" '
        'style="width:160px;height:160px;border-radius:50%;object-fit:cover;'
        'display:block;margin:0 auto;border:3px solid #D4AF37;'
        'box-shadow:0 0 24px rgba(212,175,55,.35);" />'
    )
    return re.sub(
        r'<x-import[^>]*id="kc-sponsor-photo"[^>]*>\s*</x-import>',
        lambda _m: img,
        template,
    )


def render_funnel(config: dict, lead_url: str) -> str:
    bundle = _load_bundle()
    bundle = _inject_error_suppressor(bundle)
    m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', bundle, re.DOTALL)
    if not m:
        raise ValueError("Funnel template not found in bundle")
    template = json.loads(m.group(2).strip())

    template = _override_data_props(template, config)
    template = _inject_sponsor_photo(template, config)
    template = _inject_lead_fetch(template, lead_url)

    encoded = json.dumps(template, ensure_ascii=False).replace("</", "<\\/")
    start, end = m.start(2), m.end(2)
    return bundle[:start] + "\n" + encoded + "\n  " + bundle[end:]
