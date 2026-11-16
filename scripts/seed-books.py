#!/usr/bin/env python3
"""Dev only: seed the backend with the six sample books from the design (docs/design).

Builds small picture-book EPUBs and PNG covers with the standard library and uploads them
through the admin API. Safe to re-run: books that already exist (same title) are skipped.

    ADMIN_PASSWORD=... python3 scripts/seed-books.py    # backend API, default http://localhost:9999/api/v1

Books are created through the backend's admin API, so they land in the backend's shared database.

ADMIN_EMAIL (default admin@mainstory.test) and ADMIN_PASSWORD are the backend's seeded mock admin
(SEED_ADMIN_* in storybook_management_app). The password is required and never stored here.
"""

from __future__ import annotations

import io
import json
import os
import struct
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
import zlib
from html import escape

API = os.environ.get("API_BASE_URL", "http://localhost:9999/api/v1").rstrip("/")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mainstory.test")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

# Sample content: titles, authors and colours come from the design file; page text is placeholder story copy.
BOOKS = [
    {
        "title": "The Sleepy Moon", "author": "Rani Putri", "age": (1, 3), "price": 0,
        "bg": "#BBE9EB", "ink": "#0B4F53",
        "description": "The moon is getting sleepy. Say goodnight to the stars, the owls and the quiet little town.",
        "pages": [
            "The sun went down and the sky turned blue.",
            "The moon came up and gave a big, silver yawn.",
            "“Goodnight, stars,” she whispered.",
            "“Goodnight, owls. Goodnight, sleepy town.”",
            "And the moon closed her eyes. Shhh.",
        ],
    },
    {
        "title": "Kiko the Little Duck", "author": "Dimas Arya", "age": (1, 3), "price": 29000,
        "bg": "#FFCC08", "ink": "#5A4500",
        "description": "Kiko is the smallest duck on the pond. One rainy morning, Kiko learns that small feet can still make big splashes.",
        "pages": [
            "Kiko is the smallest duck on the pond.",
            "The big ducks splash. Kiko only goes plip.",
            "One morning, the rain came down. Drip, drop!",
            "Splash! Kiko jumped into the biggest puddle on the whole pond.",
            "Small feet can make big splashes too.",
        ],
    },
    {
        "title": "Rainbow Garden", "author": "Sari Wulandari", "age": (3, None), "price": 35000,
        "bg": "#FFDCCF", "ink": "#8A2E12",
        "description": "Nina plants one seed of every colour. What will grow in her rainbow garden?",
        "pages": [
            "Nina has seven little seeds.",
            "A red seed, an orange seed, a yellow seed…",
            "She waters them every single day.",
            "Up pop the flowers, one colour at a time.",
            "Now Nina has a rainbow garden!",
        ],
    },
    {
        "title": "Bubbles Goes to School", "author": "Nadia Halim", "age": (3, 6), "price": 32000,
        "bg": "#F1E5FF", "ink": "#4B3470",
        "description": "It's Bubbles the fish's first day at school. Will she make a new friend?",
        "pages": [
            "Today is Bubbles' first day at school.",
            "Her tummy feels wiggly and wobbly.",
            "The classroom is full of fish she doesn't know.",
            "A little crab waves hello. “Want to play?”",
            "Bubbles smiles. School is fun!",
        ],
    },
    {
        "title": "Counting Stars", "author": "Bayu Pratama", "age": (2, 4), "price": 0,
        "bg": "#FFF2CC", "ink": "#6B5300",
        "description": "Count the stars with Dito, from one all the way to five, before bedtime.",
        "pages": [
            "Dito looks out of his window.",
            "One star. Two stars.",
            "Three stars. Four stars.",
            "Five stars twinkle in the sky.",
            "Goodnight, stars. Goodnight, Dito.",
        ],
    },
    {
        "title": "Mimi's Big Sneeze", "author": "Tika Anggraini", "age": (3, None), "price": 27000,
        "bg": "#C0ADD6", "ink": "#3A2558",
        "description": "Mimi the cat has a sneeze so big it blows the leaves off the trees. Can her friends help her find a cure before the picnic?",
        "pages": [
            "Mimi the cat has a tickly nose.",
            "Ah… ah… AH-CHOO!",
            "The leaves blew right off the trees!",
            "Her friends bring tea, a hanky and a hug.",
            "Just in time for the picnic. Hooray!",
        ],
    },
]


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def cover_png(bg: str, ink: str, w: int = 300, h: int = 400) -> bytes:
    """Flat cover with a sun and two hills, so the card reads as an illustration."""
    bgc, inkc, white = hex_rgb(bg), hex_rgb(ink), (255, 255, 255)
    rows = bytearray()
    for y in range(h):
        rows.append(0)  # PNG filter: none
        for x in range(w):
            c = bgc
            if (x - 220) ** 2 + (y - 90) ** 2 < 45**2:
                c = white
            elif y > 300 + ((x - 90) ** 2) // 260 - 40:
                c = inkc
            rows += bytes(c)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")


def epub(book: dict) -> bytes:
    title, ink, bg = escape(book["title"]), book["ink"], book["bg"]
    pages = book["pages"]
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr(
            "META-INF/container.xml",
            '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
            '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
            compress_type=zipfile.ZIP_DEFLATED,
        )
        z.writestr(
            "OEBPS/style.css",
            "body{margin:0;padding:0 4%;text-align:center}"
            "svg{display:block;width:100%;height:auto;max-height:60vh;margin:0 auto 1em;border-radius:24px}"
            "p{font-size:1.5em;line-height:1.4;font-weight:700;margin:0}",
            compress_type=zipfile.ZIP_DEFLATED,
        )
        items, spine, nav = [], [], []
        for i, text in enumerate(pages, 1):
            sun_x = 80 + i * 40
            xhtml = (
                '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html>'
                '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">'
                f'<head><meta charset="utf-8"/><title>{title} · {i}</title><link rel="stylesheet" href="style.css"/></head>'
                f'<body><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="Illustration">'
                f'<rect width="400" height="260" fill="{bg}"/><circle cx="{sun_x}" cy="70" r="36" fill="#ffffff"/>'
                f'<path d="M0 200 Q120 140 240 200 T400 190 V260 H0Z" fill="{ink}" opacity=".85"/></svg>'
                f"<p>{escape(text)}</p></body></html>"
            )
            z.writestr(f"OEBPS/page{i}.xhtml", xhtml, compress_type=zipfile.ZIP_DEFLATED)
            items.append(f'<item id="p{i}" href="page{i}.xhtml" media-type="application/xhtml+xml"/>')
            spine.append(f'<itemref idref="p{i}"/>')
            nav.append(f'<li><a href="page{i}.xhtml">Page {i}</a></li>')
        z.writestr(
            "OEBPS/nav.xhtml",
            '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" '
            'xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body>'
            f'<nav epub:type="toc"><ol>{"".join(nav)}</ol></nav></body></html>',
            compress_type=zipfile.ZIP_DEFLATED,
        )
        z.writestr(
            "OEBPS/content.opf",
            '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">'
            '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
            f'<dc:identifier id="uid">urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, book["title"])}</dc:identifier>'
            f'<dc:title>{title}</dc:title><dc:creator>{escape(book["author"])}</dc:creator><dc:language>en</dc:language>'
            '<meta property="dcterms:modified">2026-11-16T00:00:00Z</meta></metadata>'
            '<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
            f'<item id="css" href="style.css" media-type="text/css"/>{"".join(items)}</manifest>'
            f'<spine>{"".join(spine)}</spine></package>',
            compress_type=zipfile.ZIP_DEFLATED,
        )
    return buf.getvalue()


def call(method: str, path: str, token: str | None = None, body: bytes | None = None, ctype: str | None = None) -> dict:
    req = urllib.request.Request(API + path, data=body, method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if ctype:
        req.add_header("Content-Type", ctype)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} failed: HTTP {e.code} {e.read().decode(errors='replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"Can't reach {API}: {e.reason}. Is the backend running?")


def multipart(fields: dict[str, str], files: dict[str, tuple[str, str, bytes]]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, (filename, mime, data) in files.items():
        out.write(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n".encode()
        )
        out.write(data + b"\r\n")
    out.write(f"--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


def main() -> None:
    if not ADMIN_PASSWORD:
        sys.exit("Set ADMIN_PASSWORD to the seeded mock admin password (SEED_ADMIN_* in storybook_management_app).")
    login = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).encode()
    token = call("POST", "/admin/auth/login", body=login, ctype="application/json")["data"]["access_token"]

    for book in BOOKS:
        query = urllib.parse.urlencode({"search": book["title"], "page_size": 100})
        existing = call("GET", f"/admin/books?{query}", token)["data"]
        if any(b["title"] == book["title"] for b in existing):
            print(f"skip   {book['title']} (already there)")
            continue
        age_min, age_max = book["age"]
        fields = {
            "title": book["title"], "author": book["author"], "description": book["description"],
            "age_type": "range" if age_max else "plus", "age_min": str(age_min),
            "price": str(book["price"]), "status": "published",
        }
        if age_max:
            fields["age_max"] = str(age_max)
        slug = book["title"].lower().replace("'", "").replace(" ", "-")
        body, ctype = multipart(
            fields,
            {
                "cover": (f"{slug}.png", "image/png", cover_png(book["bg"], book["ink"])),
                "epub": (f"{slug}.epub", "application/epub+zip", epub(book)),
            },
        )
        created = call("POST", "/admin/books", token, body, ctype)["data"]
        print(f"added  {created['title']} ({created['age_label']}, Rp {book['price']})")


if __name__ == "__main__":
    main()
