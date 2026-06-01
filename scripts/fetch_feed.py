#!/usr/bin/env python3
"""
Завантажує JSON-фід товарів з URL і зберігає у products.json.
URL: https://dfi2.com.ua/price_xml/avtonomka.txt
"""

import json
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests

FEED_URL = "https://dfi2.com.ua/price_xml/avtonomka.txt"
OUTPUT_FILE = Path(__file__).parent.parent / "products.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; Googlebot/2.1; "
        "+http://www.google.com/bot.html)"
    )
}


def main() -> int:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Завантаження {FEED_URL}...")

    try:
        resp = requests.get(FEED_URL, headers=HEADERS, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"ПОМИЛКА: не вдалося завантажити фід: {exc}", file=sys.stderr)
        return 1

    print(f"  Отримано {len(resp.content):,} байт")

    try:
        text = resp.content.decode("utf-8-sig")
        data = json.loads(text)
    except Exception as exc:
        print(f"ПОМИЛКА: не вдалося розпарсити JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(data, list):
        print("ПОМИЛКА: очікується JSON-масив", file=sys.stderr)
        return 1

    for p in data:
        p.setdefault("description", "")
        p.setdefault("link", "")

    OUTPUT_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    size_kb = OUTPUT_FILE.stat().st_size // 1024
    print(f"  Товарів: {len(data)}")
    print(f"  Збережено -> {OUTPUT_FILE} ({size_kb} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
