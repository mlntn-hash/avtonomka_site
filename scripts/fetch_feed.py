#!/usr/bin/env python3
"""
Читає товари з avtonomka.txt (JSON) і зберігає у products.json.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).parent.parent
SOURCE_FILE = ROOT / "avtonomka.txt"
OUTPUT_FILE = ROOT / "products.json"


def main() -> int:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Читання {SOURCE_FILE.name}...")

    if not SOURCE_FILE.exists():
        print(f"ПОМИЛКА: файл {SOURCE_FILE} не знайдено", file=sys.stderr)
        return 1

    try:
        data = json.loads(SOURCE_FILE.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        print(f"ПОМИЛКА: не вдалося прочитати {SOURCE_FILE.name}: {exc}", file=sys.stderr)
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
