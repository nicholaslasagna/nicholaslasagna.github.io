"""Dependency-free regression checks for this buildless portfolio."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.images, self.scripts, self.details = [], [], [], [], 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.append(a["id"])
        if tag == "a": self.links.append(a)
        if tag == "img": self.images.append(a)
        if tag == "script" and "src" in a: self.scripts.append(a["src"])
        if tag == "details": self.details += 1

html = (ROOT / "index.html").read_text()
p = SiteParser(); p.feed(html)
assert len(p.ids) == len(set(p.ids)), "Duplicate ID"
for link in p.links:
    href = link.get("href", "")
    assert href, "Empty link"
    url = urlparse(href)
    if not url.scheme and not url.netloc:
        if url.path: assert (ROOT / unquote(url.path)).is_file(), f"Missing file: {href}"
        elif url.fragment: assert url.fragment in p.ids, f"Missing fragment: {href}"
    if link.get("target") == "_blank":
        assert "noreferrer" in link.get("rel", "") or "noopener" in link.get("rel", "")
    if "plink-live" in link.get("class", "") or "plink-src" in link.get("class", ""):
        assert ": view " in link.get("aria-label", ""), "Project link needs a unique accessible name"
for img in p.images:
    assert img.get("alt"), "Missing image description"
    assert img.get("width") and img.get("height"), "Missing image dimensions"
    assert (ROOT / img["src"]).is_file(), f"Missing image: {img['src']}"
for script in p.scripts: assert (ROOT / script).is_file()
for svg in (ROOT / "Images/projects").glob("*.svg"): ET.parse(svg)
ET.parse(ROOT / "sitemap.xml")
css = (ROOT / "style.css").read_text()
assert re.search(r"\.button-primary:hover\s*\{[^}]*color: var\(--paper\)", css)
assert re.search(r"\.nav-contact:hover\s*\{[^}]*color: var\(--paper\)", css)
assert re.search(r"a\.plink:focus-visible\s*\{[^}]*color: #a9b7ff", css)

def luminance(hex_color):
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * w for c, w in zip(linear, [.2126, .7152, .0722]))
for text, background in [("101114", "f0eee6"), ("f3f0e8", "131416"), ("a9b7ff", "131416")]:
    light, dark = sorted([luminance(text), luminance(background)], reverse=True)
    assert (light + .05) / (dark + .05) >= 4.5, "Insufficient updated hover contrast"
for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S): json.loads(data)
assert p.details == 7, "Expected one architecture disclosure per project"
assert "May 2027" in html and "May 2028" in html
assert "Summer 2027 internships" in html
for stale in ["full-time SWE roles", "alongside full-time work", "I wrote the whole pipeline", "· LSP", "Memory-safe Rust tooling"]:
    assert stale not in html, f"Stale claim: {stale}"
assert (ROOT / "CNAME").read_text().strip() == "nicholaslasagna.com"
print(f"PASS: {len(p.links)} links, {len(p.images)} images, {p.details} disclosures, metadata and current facts")
