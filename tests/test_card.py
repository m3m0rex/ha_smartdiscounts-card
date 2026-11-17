"""Tests der Karte: gebaut aus src/, Sprachdateien vollständig, Rechnen mit Node.js geprüft."""

import importlib.util
import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
CARD = ROOT / "dist" / "ha_smartdiscounts-card.js"
CASES = ROOT / "tests" / "cases" / "offers.json"
NODE = pytest.mark.skipif(shutil.which("node") is None, reason="Node.js nicht installiert")

HEAD = """
globalThis.window = globalThis; globalThis.HTMLElement = class {}; globalThis.customElements = { get() {}, define() {} };
globalThis.document = {}; console.info = () => {};
require(process.argv[2]);
const S = window.SmartDiscounts;
"""


def _node(tmp_path, body, *args):
    script = tmp_path / "t.cjs"
    script.write_text(HEAD + body, encoding="utf-8")
    return json.loads(subprocess.run(["node", str(script), str(CARD), *map(str, args)], capture_output=True, text=True, check=True).stdout)


def test_dist_is_built_from_src():
    spec = importlib.util.spec_from_file_location("build", ROOT / "scripts" / "build.py")
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    assert CARD.read_text(encoding="utf-8") == build.build(), "dist ist nicht aktuell – `python scripts/build.py` ausführen"


def test_version_is_a_release_number():
    version = re.search(r'const VERSION = "([^"]+)"', CARD.read_text(encoding="utf-8")).group(1)
    assert re.fullmatch(r"\d+\.\d+\.\d+(-[a-z]+\.\d+)?", version), version


def test_language_files_complete():
    files = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in (ROOT / "lang").glob("*.json")}
    assert {"de", "en", "fr", "es", "it", "pl"} <= set(files)
    for lang, texts in files.items():
        assert all(isinstance(v, str) for v in texts.values()), lang
        assert not set(texts) - set(files["de"]), (lang, set(texts) - set(files["de"]))
        if lang in ("de", "en", "fr", "es", "it", "pl"):
            assert set(texts) == set(files["de"]), (lang, set(files["de"]) - set(texts))


@NODE
def test_parsing(tmp_path):
    out = _node(tmp_path, """console.log(JSON.stringify({
      unit: ["je 250-g-Pckg. (1 kg = 5,16 €)", "1\\u00a0kg\\u00a0= ab €\\u00a03.85", "1 kg = 5.97/5.11", "je 1000-g-Btl."].map(S.unitPrice),
      names: ["Butter 2 @REWE", "Milch 2x 1l #bio", "Pils 1 Kasten", "Kartoffeln 2,5kg *Anna"].map(S.itemName),
      exact: S.matches("Kaffee", "Melitta Filterkaffee", "exact"), part: S.matches("Butter", "Butterkeks", "part"),
    }));""")
    assert out["unit"] == [{"value": 5.16, "unit": "kg"}, {"value": 3.85, "unit": "kg"}, {"value": 5.97, "unit": "kg"}, None]
    assert out["names"] == ["Butter", "Milch", "Pils", "Kartoffeln"]
    assert out["exact"] is False and out["part"] is True


@NODE
def test_matching_cases(tmp_path):
    """Dieselben Fälle prüft SmartLists für seine Hintergrund-Prüfung (Python) – beide müssen gleich rechnen."""
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    out = _node(tmp_path, """const C = JSON.parse(require("fs").readFileSync(process.argv[3], "utf8"));
    console.log(JSON.stringify({ matches: C.matches.map(([a, b]) => S.matches(a, b, "word")), num: C.num.map(([v]) => S.num(v)) }));""", CASES)
    assert out["matches"] == [want for *_, want in cases["matches"]]
    assert out["num"] == [want for _, want in cases["num"]]


@NODE
def test_same_offer_from_two_sensors_once(tmp_path):
    out = _node(tmp_path, """
    const row = (t, p, extra) => Object.assign({ title: t, price: p, end_date: "2999-01-01" }, extra || {});
    const st = (id, name, rows) => ({ entity_id: id, state: String(rows.length), last_updated: "x", attributes: { friendly_name: name, discounts: rows } });
    const hass = { states: {
      "sensor.rewe_1": st("sensor.rewe_1", "REWE 1", [row("Bio Bananen", "1,79 €"), row("Broccoli", "0,99 €", { price_per_unit: "1 kg = 1,98 €" })]),
      "sensor.rewe_2": st("sensor.rewe_2", "REWE 2", [row("Bio Bananen", "1,79 €", { image_url: "http://x/b.png" }), row("Broccoli", "0,89 €")]),
    } };
    console.log(JSON.stringify(S.offers(hass).map((o) => [o.store, o.name, o.price, o.image || ""])));""")
    assert out == [["REWE", "Bio Bananen", 1.79, "http://x/b.png"], ["REWE", "Broccoli", 0.99, ""], ["REWE", "Broccoli", 0.89, ""]]
