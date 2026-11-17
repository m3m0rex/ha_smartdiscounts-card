#!/usr/bin/env python3
"""Baut dist/ha_smartdiscounts-card.js aus den Teilen in src/ und den Sprachdateien in lang/.

Home Assistant lädt die Karte als EINE Datei. Bearbeitet wird in src/ (00-…, 10-… in dieser Reihenfolge aneinander-
gehängt) und in lang/<sprache>.json (de.json ist die Vorlage, en.json der Ersatz für fehlende Einträge).

    python scripts/build.py          # bauen
    python scripts/build.py --check  # prüfen, ob dist/ aktuell ist (Tests, vor einem Release)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "dist" / "ha_smartdiscounts-card.js"
PLACEHOLDER = "/*__TEXTS__*/"


def languages() -> dict[str, dict[str, str]]:
    raw = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "lang").glob("*.json"))}
    if "de" not in raw or "en" not in raw:
        raise SystemExit("lang/de.json und lang/en.json werden gebraucht")
    out = {}
    for code in ["de", "en", *[c for c in raw if c not in ("de", "en")]]:
        texts = raw[code]
        unknown = [key for key in texts if key not in raw["de"]]
        if unknown:
            raise SystemExit(f"lang/{code}.json: unbekannte Einträge (nicht in de.json): {', '.join(unknown[:8])}")
        out[code] = {key: texts[key] if key in texts else raw["en"].get(key, raw["de"][key]) for key in raw["de"]}
    return out


def build() -> str:
    text = "".join(p.read_text(encoding="utf-8") for p in sorted((ROOT / "src").glob("*.js")))
    if text.count(PLACEHOLDER) != 1:
        raise SystemExit(f"src/: genau ein {PLACEHOLDER} erwartet")
    rows = [f"  {json.dumps(code)}: {json.dumps(texts, ensure_ascii=False)}," for code, texts in languages().items()]
    return text.replace(PLACEHOLDER, "const TEXTS = {\n" + "\n".join(rows) + "\n};")


def main() -> int:
    text = build()
    if "--check" in sys.argv:
        if not TARGET.exists() or TARGET.read_text(encoding="utf-8") != text:
            print("dist/ha_smartdiscounts-card.js ist nicht aktuell – bitte `python scripts/build.py` ausführen.")
            return 1
        print("dist/ha_smartdiscounts-card.js ist aktuell.")
        return 0
    TARGET.parent.mkdir(exist_ok=True)
    TARGET.write_text(text, encoding="utf-8", newline="\n")
    print(f"{TARGET.relative_to(ROOT)}: {len(text.splitlines())} Zeilen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
