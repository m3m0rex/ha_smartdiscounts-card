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


@NODE
def test_best_basket_one_and_two_shops(tmp_path):
    out = _node(tmp_path, """
const o = (id, store, price) => ({ id, store, price });
const rows = [
  { uid: "butter", offers: [o("a", "REWE", 1.29), o("b", "EDEKA", 1.49)] },
  { uid: "kaffee", offers: [o("c", "EDEKA", 5.49), o("d", "REWE", 5.79)] },
  { uid: "pils", offers: [o("e", "REWE", 10.99)] },
  { uid: "pizza", offers: [o("f", "Lidl", 1.79)] },
];
const r = S.bestBasket(rows);
const same = S.bestBasket([{ uid: "x", offers: [o("a", "REWE", 1)] }, { uid: "y", offers: [o("b", "REWE", 2)] }]);
console.log(JSON.stringify({ one: [r.one.stores, r.one.count, r.one.total], two: [r.two.stores.sort(), r.two.count, r.two.total, r.two.saving],
  picks: Object.fromEntries(Object.entries(r.two.picks).map(([k, v]) => [k, v.id])), same: [same.one.stores, same.one.total, same.two] }));
""")
    assert out["one"] == [["REWE"], 3, 18.07]                       # REWE deckt drei Artikel ab
    assert out["two"] == [["Lidl", "REWE"], 4, 19.86, 0]            # mit Lidl dazu vier – mehr Artikel, keine Ersparnis
    assert out["picks"] == {"butter": "a", "kaffee": "d", "pils": "e", "pizza": "f"}
    assert out["same"] == [["REWE"], 3, None]                        # ein Markt reicht: kein Vorschlag für zwei


@NODE
def test_two_shops_save_money_for_the_same_items(tmp_path):
    out = _node(tmp_path, """
const o = (id, store, price) => ({ id, store, price });
const r = S.bestBasket([
  { uid: "a", offers: [o("1", "REWE", 2.00), o("2", "Lidl", 1.00)] },
  { uid: "b", offers: [o("3", "REWE", 1.00), o("4", "Lidl", 3.00)] },
]);
console.log(JSON.stringify([r.one.total, r.two.total, r.two.saving]));
""")
    assert out == [3.0, 2.0, 1.0]


@NODE
def test_price_memory_tells_what_an_offer_cost_before(tmp_path):
    out = _node(tmp_path, """
const offer = (price, extra = {}) => ({ id: "x", store: "REWE", name: "Butter", price, ...extra });
let r = S.rememberPrices({}, [offer(0.99)], "2026-11-10");
const first = Object.keys(r.hints).length;
r = S.rememberPrices(r.seen, [offer(0.99)], "2026-11-12");
const still = Object.keys(r.hints).length;
r = S.rememberPrices(r.seen, [offer(1.29)], "2026-11-17");
const up = r.hints.x;
r = S.rememberPrices(r.seen, [offer(1.29)], "2026-11-18");
const stays = r.hints.x;
r = S.rememberPrices(r.seen, [offer(1.09)], "2026-11-24");
const down = r.hints.x;
const twice = S.rememberPrices({}, [offer(1), { ...offer(2), id: "y" }], "2026-11-10");
const soon = S.rememberPrices({}, [offer(1, { soon: true })], "2026-11-10");
const old = S.rememberPrices({ "rewe|alt": { p: 1, d: "2026-01-01" } }, [], "2026-11-10");
console.log(JSON.stringify({ first, still, up, stays, down, twice: Object.keys(twice.seen).length, soon: Object.keys(soon.seen).length, old: Object.keys(old.seen).length }));
""")
    assert out["first"] == 0 and out["still"] == 0
    assert out["up"] == {"dir": "up", "price": 0.99, "date": "2026-11-12"}      # war billiger – zuletzt am 12.11. gesehen
    assert out["stays"] == out["up"]                                            # der Hinweis bleibt, solange der Preis so ist
    assert out["down"] == {"dir": "down", "price": 1.29, "date": "2026-11-18"}
    assert out["twice"] == 0 and out["soon"] == 0 and out["old"] == 0


@NODE
def test_central_price_history_uses_the_same_keys_and_hints(tmp_path):
    out = _node(tmp_path, """
const o = (id, store, name, price, extra = {}) => ({ id, store, name, price, ...extra });
const offers = [o("a", "REWE", "Bio-Bananen", 1.79), o("b", "Müller", "Weißbrot", 1.29), o("c", "REWE", "Cola", 0.99), o("d", "REWE", "Cola", 1.49),
  o("e", "ALDI", "Butter", 1.99, { soon: true })];
const keys = S.priceKeys(offers);
const seen = { "rewe|bio-bananen": { p: 1.79, d: "2026-11-18", pp: 1.49, pd: "2026-11-10" }, "muller|weissbrot": { p: 1.29, d: "2026-11-18" } };
const stale = S.hintsFrom({ "rewe|bio-bananen": { p: 1.99, d: "2026-11-18", pp: 1.49, pd: "2026-11-10" } }, offers);
console.log(JSON.stringify({ keys, hints: S.hintsFrom(seen, offers), stale }));
""")
    assert out["keys"] == [["rewe|bio-bananen", 1.79], ["muller|weissbrot", 1.29]]      # doppelte Namen und „demnächst“ bleiben draußen
    assert out["hints"] == {"a": {"dir": "up", "price": 1.49, "date": "2026-11-10"}}
    assert out["stale"] == {}                                                           # Stand passt nicht zum gezeigten Preis: kein Hinweis
