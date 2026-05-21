#!/usr/bin/env python3
"""
Завантажує XML фід товарів і конвертує в products.json
XML URL: https://dfi.ua/ua/index.php?route=extension/feed/remarketing_feed&key=ym0pG56iVXSvgSFf890Y
Namespace: xmlns:g="http://base.google.com/ns/1.0"
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

import sys

# Windows console UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests

FEED_URL = (
    "https://dfi.ua/ua/index.php"
    "?route=extension/feed/remarketing_feed&key=ym0pG56iVXSvgSFf890Y"
)
OUTPUT_FILE = Path(__file__).parent.parent / "products.json"
NS = "http://base.google.com/ns/1.0"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; Googlebot/2.1; "
        "+http://www.google.com/bot.html)"
    )
}


def g(element, tag):
    """Get text of a namespaced <g:tag> child."""
    child = element.find(f"{{{NS}}}{tag}")
    return child.text.strip() if child is not None and child.text else ""


def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("Не знайдено елемент <channel> у фіді")

    products = []
    for item in channel.findall("item"):
        additional_images = [
            el.text.strip()
            for el in item.findall(f"{{{NS}}}additional_image_link")
            if el.text and el.text.strip()
        ]

        product = {
            "id":                g(item, "id"),
            "title":             g(item, "title"),
            "description":       g(item, "description"),
            "link":              g(item, "link"),
            "image_link":        g(item, "image_link"),
            "additional_images": additional_images,
            "price":             g(item, "price"),
            "availability":      g(item, "availability"),
            "product_type":      g(item, "product_type"),
            "mpn":               g(item, "mpn"),
            "condition":         g(item, "condition"),
        }

        # Fallback: plain <title> / <link> if g:title is empty
        if not product["title"]:
            t = item.find("title")
            product["title"] = t.text.strip() if t is not None and t.text else ""
        if not product["link"]:
            lnk = item.find("link")
            product["link"] = lnk.text.strip() if lnk is not None and lnk.text else ""

        if product["id"]:
            products.append(product)

    return products


def main() -> int:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Завантаження фіду…")
    try:
        resp = requests.get(FEED_URL, headers=HEADERS, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"ПОМИЛКА: не вдалося завантажити фід: {exc}", file=sys.stderr)
        return 1

    print(f"  Отримано {len(resp.content):,} байт")

    try:
        products = parse_feed(resp.content)
    except Exception as exc:
        print(f"ПОМИЛКА: парсинг XML: {exc}", file=sys.stderr)
        return 1

    print(f"  Розпізнано товарів: {len(products)}")

    output = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "count":      len(products),
        "products":   products,
    }

    # Write array directly so JS can do: Array.isArray(data) ? data : data.products
    OUTPUT_FILE.write_text(
        json.dumps(products, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  Збережено → {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
