#!/usr/bin/env python3
"""
Завантажує XML фід товарів і конвертує в products.json.
Залишає лише товари з категорії "Автономна енергетика".
XML URL: https://dfi.ua/ua/index.php?route=extension/feed/remarketing_feed&key=ym0pG56iVXSvgSFf890Y
Namespace: xmlns:g="http://base.google.com/ns/1.0"
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests

FEED_URL = (
    "https://dfi.ua/ua/index.php"
    "?route=extension/feed/remarketing_feed&key=ym0pG56iVXSvgSFf890Y"
)
OUTPUT_FILE = Path(__file__).parent.parent / "products.json"
NS = "http://base.google.com/ns/1.0"

# Залишаємо тільки товари з цієї категорії
ALLOWED_CATEGORY = "Автономна енергетика"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; Googlebot/2.1; "
        "+http://www.google.com/bot.html)"
    )
}


def g(element, tag):
    child = element.find(f"{{{NS}}}{tag}")
    return child.text.strip() if child is not None and child.text else ""


def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("Не знайдено елемент <channel> у фіді")

    products = []
    skipped = 0

    for item in channel.findall("item"):
        product_type = g(item, "product_type")

        # Фільтр: залишаємо тільки "Автономна енергетика"
        if ALLOWED_CATEGORY not in product_type:
            skipped += 1
            continue

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
            "product_type":      product_type,
            "mpn":               g(item, "mpn"),
            "condition":         g(item, "condition"),
        }

        if not product["title"]:
            t = item.find("title")
            product["title"] = t.text.strip() if t is not None and t.text else ""
        if not product["link"]:
            lnk = item.find("link")
            product["link"] = lnk.text.strip() if lnk is not None and lnk.text else ""

        if product["id"]:
            products.append(product)

    print(f"  Категорія '{ALLOWED_CATEGORY}': {len(products)} товарів")
    print(f"  Відфільтровано (інші категорії): {skipped}")
    return products


def main() -> int:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Завантаження фіду...")
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

    OUTPUT_FILE.write_text(
        json.dumps(products, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    size_kb = OUTPUT_FILE.stat().st_size // 1024
    print(f"  Збережено -> {OUTPUT_FILE} ({size_kb} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
