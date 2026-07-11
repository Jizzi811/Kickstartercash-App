import asyncio, ipaddress, re, socket, uuid
from collections import Counter
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urlunparse

import aiohttp
from fastapi import HTTPException

MAX_PAGES = 6
MAX_PAGE_BYTES = 512_000
MAX_TOTAL_TEXT = 45_000
MAX_TEXT_PER_PAGE = 9_000
TIMEOUT_SECONDS = 8
MAX_REDIRECTS = 3
ALLOWED_PORTS = {80, 443}
UA = "BrandmindWebsiteImport/1.0 (+https://brandmind.local; public brand onboarding)"
FIELD_KEYS = ["brand_name","industry","website","short_description","products_services","target_audience","customer_needs","value_proposition","positioning","differentiators","brand_values","tone","keywords","primary_colors","logo_candidate","visual_style","social_links","contact_info"]
SOCIAL_HOSTS = ("linkedin.com","instagram.com","facebook.com","x.com","twitter.com","youtube.com","tiktok.com")
BLOCKED_HOSTS = {"localhost", "metadata.google.internal"}
BLOCKED_IPS = {ipaddress.ip_address("169.254.169.254"), ipaddress.ip_address("100.100.100.200")}

class Extractor(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True); self.base=base_url; self.skip=0; self.title=""; self.in_title=False; self.h=[]; self.text=[]; self.links=[]; self.meta={}; self.images=[]; self.jsonld=[]; self.colors=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); tag=tag.lower()
        if tag in {"script","style","noscript","svg"}: self.skip += 1
        if tag=="title": self.in_title=True
        if tag=="meta":
            k=(a.get("name") or a.get("property") or "").lower(); v=a.get("content") or ""
            if k and v: self.meta[k]=v[:1000]
        if tag=="a" and a.get("href"): self.links.append(urljoin(self.base, a.get("href")))
        if tag=="img" and a.get("src"):
            alt=(a.get("alt") or "").lower(); src=urljoin(self.base,a.get("src"));
            if "logo" in alt or "logo" in src.lower(): self.images.append(src)
        if tag in {"h1","h2","h3"}: self._capture_heading=tag
        style=a.get("style") or ""
        self.colors += re.findall(r"#[0-9a-fA-F]{6}\b", style)[:5]
    def handle_endtag(self, tag):
        if tag.lower() in {"script","style","noscript","svg"} and self.skip: self.skip-=1
        if tag.lower()=="title": self.in_title=False
        if hasattr(self,"_capture_heading") and tag.lower()==self._capture_heading: delattr(self,"_capture_heading")
    def handle_data(self, data):
        s=re.sub(r"\s+"," ",data or "").strip()
        if not s or self.skip: return
        if self.in_title: self.title=(self.title+" "+s).strip()[:240]
        elif hasattr(self,"_capture_heading"): self.h.append(s[:240]); self.text.append(s)
        elif len(s)>2 and not re.search(r"cookie|datenschutz akzeptieren|accept all", s, re.I): self.text.append(s)

def _now(): return datetime.now(timezone.utc).isoformat()

def _field(value=None, urls=None, conf="low", evidence="", typ="explicit"):
    return {"value": value, "source_urls": urls or [], "confidence": conf, "evidence_summary": evidence[:500], "extraction_type": typ}

def is_ip_blocked(ip: str) -> bool:
    addr=ipaddress.ip_address(ip)
    return addr in BLOCKED_IPS or addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_multicast or addr.is_reserved or addr.is_unspecified

def normalize_url(raw: str) -> str:
    raw=(raw or "").strip()
    if not raw: raise HTTPException(400, "URL ungültig")
    if "://" not in raw: raw="https://"+raw
    p=urlparse(raw)
    if p.scheme not in {"http","https"}: raise HTTPException(400, "Nur http und https sind erlaubt")
    if p.username or p.password: raise HTTPException(400, "Zugangsdaten in URLs sind nicht erlaubt")
    host=(p.hostname or "").strip().lower().rstrip('.')
    if not host or host in BLOCKED_HOSTS or "." not in host: raise HTTPException(400, "Interne oder ungültige Hostnamen sind nicht erlaubt")
    port=p.port or (443 if p.scheme=="https" else 80)
    if port not in ALLOWED_PORTS: raise HTTPException(400, "Nur Ports 80 und 443 sind erlaubt")
    try:
        if is_ip_blocked(host): raise HTTPException(400, "Interne Netzwerkziele sind nicht erlaubt")
    except ValueError: pass
    path=p.path or "/"
    return urlunparse((p.scheme, host if port in (80,443) else f"{host}:{port}", path, "", "", ""))

async def resolve_public(host: str) -> list[str]:
    loop=asyncio.get_running_loop()
    try: infos=await loop.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as e: raise HTTPException(400, "Domain nicht erreichbar") from e
    ips=sorted({i[4][0] for i in infos})
    if not ips or any(is_ip_blocked(ip) for ip in ips): raise HTTPException(400, "Interne Netzwerkziele sind blockiert")
    return ips

async def safe_fetch(session, url: str) -> tuple[str,str]:
    cur=normalize_url(url)
    for _ in range(MAX_REDIRECTS+1):
        await resolve_public(urlparse(cur).hostname or "")
        try:
            async with session.get(cur, allow_redirects=False, headers={"User-Agent":UA,"Accept":"text/html,text/plain;q=0.8"}) as r:
                if 300 <= r.status < 400 and r.headers.get("Location"):
                    cur=normalize_url(urljoin(cur, r.headers["Location"])); continue
                if r.status in (401,403): raise HTTPException(400, "Zugriff blockiert oder Login erforderlich")
                ct=(r.headers.get("content-type") or "").lower()
                if not ("text/html" in ct or "text/plain" in ct or ct.startswith("text/")): raise HTTPException(400, "Nicht unterstützter Inhalt")
                data=bytearray()
                async for chunk in r.content.iter_chunked(16384):
                    data.extend(chunk)
                    if len(data)>MAX_PAGE_BYTES: raise HTTPException(400, "Antwortgröße überschreitet das Limit")
                return cur, data.decode(r.charset or "utf-8", errors="replace")
        except asyncio.TimeoutError as e: raise HTTPException(408, "Zeitüberschreitung beim Website-Abruf") from e
        except aiohttp.ClientError as e: raise HTTPException(400, "Domain nicht erreichbar oder Zugriff blockiert") from e
    raise HTTPException(400, "Zu viele Weiterleitungen")

def extract_page(url: str, html: str) -> dict:
    ex=Extractor(url); ex.feed(html[:MAX_PAGE_BYTES]); text="\n".join(dict.fromkeys(ex.text))[:MAX_TEXT_PER_PAGE]
    return {"url":url,"title":ex.title,"meta_description":ex.meta.get("description") or ex.meta.get("og:description",""),"headings":ex.h[:12],"text":text,"links":ex.links[:200],"logo_candidates":ex.images[:5],"social_links":[l for l in ex.links if any(h in urlparse(l).netloc.lower() for h in SOCIAL_HOSTS)][:10],"colors":ex.colors[:20]}

def choose_links(home_url: str, links: list[str]) -> list[str]:
    hp=urlparse(home_url); seen={home_url}; scored=[]
    pats=["about","ueber","über","service","leistung","product","produkt","pricing","preise","faq","contact","kontakt","blog"]
    bad=re.compile(r"logout|login|admin|account|cart|checkout|calendar|page=|\.(pdf|zip|jpg|png|webp|mp4)$", re.I)
    for l in links:
        try: n=normalize_url(l); p=urlparse(n)
        except Exception: continue
        if p.netloc!=hp.netloc or n in seen or bad.search(n): continue
        score=max([10-i for i,x in enumerate(pats) if x in p.path.lower()] or [0])
        if score: scored.append((score,n)); seen.add(n)
    return [u for _,u in sorted(scored, reverse=True)[:MAX_PAGES-1]]

def build_fields(normalized_url: str, pages: list[dict]) -> dict:
    home=pages[0]; all_text="\n".join(p["text"] for p in pages)[:MAX_TOTAL_TEXT]; urls=[p["url"] for p in pages]
    title=home["title"] or (home["headings"][0] if home["headings"] else urlparse(normalized_url).hostname)
    desc=home["meta_description"] or " ".join(home["headings"][:2])
    words=[w.lower() for w in re.findall(r"\b[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß-]{3,}\b", all_text) if w.lower() not in {"diese","this","that","with","und","oder","from","werden","haben","your","about"}]
    colors=[c for c,_ in Counter(sum((p["colors"] for p in pages),[])).most_common(5)]
    socials=list(dict.fromkeys(sum((p["social_links"] for p in pages),[])))[:8]
    logos=list(dict.fromkeys(sum((p["logo_candidates"] for p in pages),[])))[:3]
    contacts=re.findall(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?[0-9][0-9\s()./-]{7,}", all_text, re.I)[:6]
    inj=re.search(r"ignore (all )?(previous|system).*instructions|system prompt|developer message", all_text, re.I)
    fields={k:_field() for k in FIELD_KEYS}
    fields.update({"brand_name":_field(title, [home["url"]], "high", "Seitentitel oder Hauptüberschrift gefunden"),"website":_field(normalized_url,[home["url"]],"high","Vom Nutzer angegebene und normalisierte Website"),"short_description":_field(desc or None,[home["url"]],"medium" if desc else "low","Meta Description oder Überschriften"),"keywords":_field([w for w,_ in Counter(words).most_common(12)], urls, "medium", "Häufige sichtbare Begriffe"),"primary_colors":_field(colors or None, urls, "medium" if colors else "low", "Häufige sichtbare CSS-Farben"),"logo_candidate":_field(logos[0] if logos else None, urls, "medium" if logos else "low", "Logo-Kandidat aus Bild-URLs/Alt-Text"),"social_links":_field(socials or None, urls, "high" if socials else "low", "Öffentliche Social-Media-Links"),"contact_info":_field(contacts or None, urls, "medium" if contacts else "low", "Öffentliche Kontaktmuster")})
    # inferred conservative fields
    for key,label in [("products_services","Leistungen/Produkte"),("target_audience","Zielgruppe"),("value_proposition","Nutzenversprechen"),("tone","Tonalität"),("visual_style","Visuelle Stilrichtung")]:
        if all_text:
            fields[key]=_field(None, urls, "low", f"{label} benötigt Nutzerprüfung oder Provideranalyse", "inferred")
    warnings=[]
    if inj: warnings.append("Prompt-Injection-ähnlicher Inhalt wurde als nicht vertrauenswürdiger Website-Text behandelt.")
    return fields,warnings

async def analyze_website(url: str) -> dict:
    normalized=normalize_url(url); timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS)
    async with aiohttp.ClientSession(timeout=timeout, cookie_jar=aiohttp.DummyCookieJar()) as session:
        final, html=await safe_fetch(session, normalized); home=extract_page(final, html)
        pages=[home]
        for link in choose_links(final, home["links"]):
            if len(pages)>=MAX_PAGES: break
            try:
                u,h=await safe_fetch(session, link); pages.append(extract_page(u,h))
            except HTTPException: continue
    fields,warnings=build_fields(normalized, pages)
    if len("".join(p["text"] for p in pages).strip())<200: warnings.append("Zu wenig verwertbarer Inhalt; JavaScript-Rendering kann erforderlich sein.")
    return {"normalized_url": normalized, "status":"ready" if any(v.get("value") for v in fields.values()) else "partial", "analyzed_pages":[{"url":p["url"],"title":p["title"],"text_length":len(p["text"])} for p in pages], "extracted_fields":fields, "warnings":warnings}

def new_draft(user_id, ws, brand_id, submitted_url, analysis):
    now=_now(); return {"id":str(uuid.uuid4()),"workspace_id":ws or "","user_id":user_id,"brand_id":brand_id or "","submitted_url":submitted_url,"normalized_url":analysis.get("normalized_url",""),"status":analysis.get("status","partial"),"analyzed_pages":analysis.get("analyzed_pages",[]),"extracted_fields":analysis.get("extracted_fields",{}),"warnings":analysis.get("warnings",[]),"created_at":now,"updated_at":now,"expires_at":(datetime.now(timezone.utc)+timedelta(days=14)).isoformat()}
