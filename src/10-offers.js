const DEFAULTS = { show_title: true, show_tab_counts: true, show_tab_icons: true, preview_start: "monday", shop_view: "own", use_bonus: false, show_cheapest_trip: false, collect_first: false, list: "", match: "word", default_tab: "all", show_images: true, show_unit_price: true, show_valid_until: true, show_price_trend: true, hide_without_offer: false, max_per_store: 10, all_view: "tiles", list_view: "chips", sources: "auto", group_by: "store", tile_flow: "grid", mine_only: false, add_to: "", category_source: "auto", categories_open: true, watch: [], watch_list: "", notify: false, notify_service: "" };
// bekannte Märkte: Erkennung über entity_id / Namen der Quelle, Farbe des Badges
const STORES = [["rewe", "REWE", "#cc071e"], ["edeka", "EDEKA", "#f5c400"], ["lidl", "Lidl", "#0050aa"], ["aldi_sued", "ALDI Süd", "#00a0e0"], ["aldi_nord", "ALDI Nord", "#1a4d9f"], ["aldi", "ALDI", "#00549f"],
  ["norma", "Norma", "#d40f14"], ["penny", "Penny", "#cd1414"], ["kaufland", "Kaufland", "#e10915"], ["netto", "Netto", "#ffd400"], ["rossmann", "Rossmann", "#c3002d"], ["dm", "dm", "#002878"], ["globus", "Globus", "#f39200"]];
// Feldnamen der Angebote: der erste vorhandene zählt (je Quelle mit `map:` überschreibbar)
const FIELDS = { name: ["product", "title", "name", "product_name", "description"], price: ["price", "new_price", "discount_price", "offer_price", "sale_price", "price_euro", "current_price"],
  old_price: ["old_price", "regular_price", "original_price", "was_price", "oldPrice", "base_price_old"], image: ["picture_link", "image_url", "image", "picture", "img", "thumbnail"],
  until: ["valid_until", "end_date", "valid_to", "until", "valid_through", "validTo"], from: ["valid_from", "start_date", "valid_start", "from", "validFrom", "starts"], unit: ["price_per_unit", "base_price", "unit_price", "grundpreis"], bonus: ["loyalty_bonus_value", "bonus_value", "bonus"], bonus_type: ["loyalty_bonus_type", "bonus_type"], category: ["category", "categories", "group"], discount: ["discount", "discount_percent", "savings"], brand: ["brand", "manufacturer"], store: ["store", "market", "retailer", "advertiser"] };
const LIST_ATTRS = ["discounts", "offers", "deals", "items", "results", "products", "preview", "preview_discounts", "preview_offers", "upcoming", "next_week"];

const h = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "style") e.style.cssText = v; else e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids.flat(9).filter((x) => x != null && x !== false));
  return e;
};
const get = (obj, path) => String(path).split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
// „11,49 €“, „€ 10.98“, 5.49 → Zahl
const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const m = String(v ?? "").replace(/ /g, " ").match(/\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : null;
};
// Grundpreis aus „je 250-g-Pckg. (1 kg = 5,16 €)“ bzw. „1 kg = ab € 3.85“ → { value, unit }
// Bonus-Aktion (z. B. REWE Bonus): Guthaben statt niedrigerem Preis – nur mit der App des Markts.
// { value: 0.5, kind: "eur" } für 50 Cent, { value: 10, kind: "pct" } für 10 %
const bonusOf = (value, type) => {
  const v = num(value);
  if (v == null || v <= 0) return null;
  const t = String(type || "").toLowerCase();
  if (/cent|ct/.test(t)) return { value: v / 100, kind: "eur" };
  if (/pro|perc|%/.test(t)) return { value: v, kind: "pct" };
  return { value: v, kind: "eur" };
};
// Mit Bonus gerechnet: Preis abzüglich Guthaben bzw. Prozent. full/unit.full behalten den echten Preis (für die
// Anzeige „4,44 € (3,94 €)“ und alles, was den Preisverlauf betrifft)
const withBonus = (o) => {
  if (!o.bonus || o.full != null) return o;
  const eff = Math.max(0, o.bonus.kind === "pct" ? o.price * (1 - o.bonus.value / 100) : o.price - o.bonus.value);
  const r = (v) => Math.round(v * 100 + 1e-9) / 100;
  return { ...o, full: o.price, price: r(eff), unit: o.unit && o.price > 0 ? { ...o.unit, full: o.unit.value, value: r(o.unit.value * eff / o.price) } : o.unit };
};
const unitPrice = (text) => {
  const m = String(text || "").replace(/ /g, " ").match(/1\s*(kg|l|ltr|liter|stk|st|stück|m)\s*=\s*(?:ab\s*)?(?:€\s*)?(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const u = m[1].toLowerCase();
  return { value: parseFloat(m[2].replace(",", ".")), unit: /^l/.test(u) ? "l" : /^st/.test(u) ? "Stk" : u };
};
// Kategorien, die nichts über das Produkt sagen (Vertriebsweg, Sammelbegriffe) – zählen wie „keine Kategorie“
const NO_CATEGORY = /^(|-+|store|stores|in-?store|online|online-?shop|shop|filiale|filialangebote?|markt|offline|angebote?|offers?|deals?|aktion(en)?|prospekt|flyer|sonstiges?|other|others|misc|default|none|null|unknown|unbekannt|allgemein|general|top-?(angebote|deals|offers)( .*)?)$/;
const stem = (w) => (w.length >= 5 ? w.replace(/(en|er|n|e|s)$/, "") : w);
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
// Artikeltext der Liste → Suchbegriff: Mengen, Einheiten und Badges (@Markt #Tag *Person) weg
const UNIT_RE = /^(\d+([.,]\d+)?)?(x|kg|g|gr|mg|l|ml|cl|stk|st|pck|pkg|dose|dosen|flasche|flaschen|kasten|kiste|becher|glas|bund|netz|beutel|packung|packungen)$/;
const itemName = (text) => String(text || "").split(/\s+/).filter((w) => w && !/^[@#*!+~]/.test(w) && !/^\d+([.,]\d+)?[x×]?$/i.test(w) && !UNIT_RE.test(norm(w))).join(" ").trim();
const matches = (name, title, mode) => {
  const want = words(name);
  if (!want.length) return false;
  if (mode === "part") return want.every((w) => norm(title).includes(w));
  const have = words(title), hs = have.map(stem);
  return want.every((w) => { const s = stem(w); return hs.includes(s) || (mode !== "exact" && w.length >= 4 && have.some((x) => x.length > w.length && (x.endsWith(w) || stem(x).endsWith(s)))); });
};

function sourcesOf(hass, cfg) {
  const st = hass.states;
  const explicit = Array.isArray(cfg) ? cfg.filter((s) => s && s !== "auto").map((s) => (typeof s === "string" ? { entity: s } : s)) : [];
  const out = [...explicit];
  if (cfg === "auto" || !Array.isArray(cfg) || cfg.includes("auto")) {
    for (const id of Object.keys(st)) {
      if (!id.startsWith("sensor.") || out.some((s) => s.entity === id)) continue;
      const attr = LIST_ATTRS.find((a) => Array.isArray(st[id].attributes[a]) && st[id].attributes[a].length && typeof st[id].attributes[a][0] === "object"
        && FIELDS.name.some((f) => f in st[id].attributes[a][0]) && FIELDS.price.some((f) => f in st[id].attributes[a][0]));
      if (attr) out.push({ entity: id, attribute: attr });
    }
  }
  return out.filter((s) => st[s.entity]);
}
function storeOf(src, state) {
  const hay = norm(`${src.entity} ${state.attributes.friendly_name || ""}`).replace(/[^a-z0-9]+/g, "_");
  const known = STORES.find(([key]) => hay.includes(key));
  const label = src.store || (known && known[1]) || String(state.attributes.friendly_name || src.entity).replace(/\s*(offers?|angebote|discounts?)\s*$/i, "");
  const k2 = STORES.find(([, l]) => norm(l) === norm(label));
  return { label, color: src.color || (k2 && k2[2]) || (known && known[2]) || "#6b7280" };
}
// alle Angebote aller Quellen, vereinheitlicht
function collectOffers(hass, cfg) {
  const out = [], seen = new Map();  // dasselbe Angebot aus zwei Sensoren (z. B. zwei Integrationen für denselben Markt) nur einmal
  const today = new Date().toISOString().slice(0, 10);
  for (const src of sourcesOf(hass, cfg)) {
    const state = hass.states[src.entity];
    // bekannte Namen zuerst; sonst das erste Attribut, das eine Liste von Einträgen ist (z. B. bei einem Vorschau-Sensor)
    const attr = src.attribute || LIST_ATTRS.find((a) => Array.isArray(state.attributes[a]))
      || Object.keys(state.attributes).find((a) => Array.isArray(state.attributes[a]) && state.attributes[a].length && typeof state.attributes[a][0] === "object");
    const rows = get(state.attributes, attr);
    if (!Array.isArray(rows)) continue;
    const store = storeOf(src, state);
    // Vorschau-Sensor (Prospekt der nächsten Woche, z. B. sensor.rewe_preview): seine Angebote gelten als „demnächst“,
    // auch wenn kein Startdatum dabeisteht – dann ab dem nächsten Montag. `preview: true/false` an der Quelle legt es fest.
    const preview = src.preview === undefined ? /preview|vorschau|next_?week|naechste_?woche|nachste_?woche|upcoming|kommende/.test(norm(`${src.entity} ${state.attributes.friendly_name || ""}`)) : !!src.preview;

    const pick = (o, f) => { const key = (src.map && src.map[f]) || FIELDS[f].find((k) => o[k] != null && o[k] !== ""); return key ? get(o, key) : null; };
    rows.forEach((o, i) => {
      if (!o || typeof o !== "object") return;
      const name = pick(o, "name"), price = num(pick(o, "price"));
      if (!name || price == null) return;
      const unitText = pick(o, "unit"), until = pick(o, "until") ? String(pick(o, "until")).slice(0, 10) : null;
      if (until && /^\d{4}-\d\d-\d\d$/.test(until) && until < today) return;  // abgelaufen
      // gilt erst ab einem späteren Tag (z. B. das Prospekt der nächsten Woche): als „demnächst“ führen
      const fromRaw = pick(o, "from") ? String(pick(o, "from")).slice(0, 10) : null;
      const from = fromRaw && /^\d{4}-\d\d-\d\d$/.test(fromRaw) ? fromRaw : null;
      const st = pick(o, "store");
      const cat = pick(o, "category"), old = num(pick(o, "old_price"));
      // Rabatt: Angabe der Quelle („-44%“) oder aus altem und neuem Preis berechnet
      const dm = String(pick(o, "discount") || "").match(/-?\s*(\d{1,2})\s*%/);
      const pct = dm ? +dm[1] : old && old > price ? Math.round((1 - price / old) * 100) : null;
      const label = st ? String(st) : store.label, dk = `${norm(label)}|${norm(name)}|${price}|${until || ""}`, twin = seen.get(dk);
      const bonus = bonusOf(pick(o, "bonus"), pick(o, "bonus_type"));
      // dasselbe Angebot steht auch im Bonus-Sensor: der Bonus kommt an das schon gezählte Angebot
      if (twin) { if (bonus && !twin.bonus) twin.bonus = bonus; if (!twin.image) twin.image = pick(o, "image"); if (!twin.unit && unitText) { twin.unitText = String(unitText).replace(/ /g, " "); twin.unit = unitPrice(unitText); } if (!twin.category) twin.category = Array.isArray(cat) ? cat[0] : cat || ""; return; }
      out.push({ id: `${src.entity}#${i}`, name: String(name), price, old: old && old > price ? old : null, pct, brand: pick(o, "brand") || "", image: pick(o, "image"), until, today: until === today,
        unitText: unitText ? String(unitText).replace(/ /g, " ") : "", unit: unitPrice(unitText), category: Array.isArray(cat) ? cat[0] : cat || "",
        store: label, color: store.color, entity: src.entity, from, soon: !!from && from > today, bonus, pv: preview && !from });
      seen.set(dk, out[out.length - 1]);
    });
  }
  // Vorschau ohne Startdatum: ab dem Tag nach dem Ende der laufenden Angebote desselben Markts (das häufigste „bis“),
  // sonst ab dem nächsten eingestellten Wochentag (preview_start, Standard Montag)
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ends = {};
  out.forEach((o) => { if (!o.pv && !o.soon && o.until && /^\d{4}-\d\d-\d\d$/.test(o.until)) { const m = ends[o.store] || (ends[o.store] = {}); m[o.until] = (m[o.until] || 0) + 1; } });
  const weekday = (() => { const d = new Date(); d.setDate(d.getDate() + ((PREVIEW_DAY - d.getDay() + 7) % 7 || 7)); return iso(d); })();
  out.forEach((o) => {
    if (!o.pv) return;
    const m = ends[o.store], end = m ? Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1))[0] : null;
    let from = weekday;
    if (end) { const d = new Date(`${end}T12:00:00`); d.setDate(d.getDate() + 1); from = iso(d); }
    o.from = from; o.soon = from > today;
  });
  return out;
}
// Wochentag, an dem eine Vorschau ohne Datum startet (0 = Sonntag … 6 = Samstag) – die Karte setzt ihn aus preview_start
let PREVIEW_DAY = 1;
const setPreviewDay = (name) => { const i = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(String(name || "").toLowerCase()); PREVIEW_DAY = i < 0 ? 1 : i; };
// günstiger: nach Grundpreis, wenn beide denselben haben – sonst nach Preis
// Angebote nicht bei jedem Zeichnen neu zerlegen (bei mehreren hundert Angeboten spürbar): nur wenn sich ein Sensor,
// die Angabe der Quellen oder der Tag geändert hat. Die Liste der Sensoren wird höchstens alle 10 s neu gesucht.
const _srcCache = new Map();
function sourcesCached(hass, cfg) {
  const key = JSON.stringify(cfg === undefined ? "auto" : cfg), hit = _srcCache.get(key), now = Date.now();
  if (hit && now - hit.t < 10000 && hit.list.every((x) => hass.states[x.entity])) return hit.list;
  const list = sourcesOf(hass, cfg);
  _srcCache.set(key, { t: now, list });
  return list;
}
const _offerCache = new Map();
function offersCached(hass, cfg) {
  const key = JSON.stringify(cfg === undefined ? "auto" : cfg);
  const sig = sourcesCached(hass, cfg).map((x) => `${x.entity}:${hass.states[x.entity].last_updated || hass.states[x.entity].state}`).join("|") + "|" + new Date().toISOString().slice(0, 10) + "|" + PREVIEW_DAY;
  const hit = _offerCache.get(key);
  if (hit && hit.sig === sig) return hit.list;
  const list = collectOffers(hass, cfg);
  _offerCache.set(key, { sig, list });
  return list;
}
const _dealMemo = new WeakMap();
function dealsForCached(offers, name, mode = "word") {
  let m = _dealMemo.get(offers);
  if (!m) { m = new Map(); _dealMemo.set(offers, m); }
  const k = `${mode}|${name}`;
  if (!m.has(k)) m.set(k, dealsFor(offers, name, mode));
  return m.get(k);
}
// Günstigster Einkauf: Welcher Markt deckt die meisten Artikel der Liste ab und kostet dafür am wenigsten – und lohnt
// es sich, zwei, drei oder mehr Märkte anzufahren? rows = [{ uid, offers: [{ id, store, price }] }] (Angebote günstigstes zuerst).
// Ergebnis: { one, two, all } – all = [ein Markt, zwei Märkte, …], je Anzahl der beste Einkauf, aber nur solange jeder
// mehr Artikel abdeckt oder bei gleich vielen billiger ist als der davor. Jeder Eintrag: { stores, count, total, picks }.
// „saving“: Ersparnis gegenüber einem Markt bei den Artikeln, die der eine Markt hat (für dieselbe Menge, über den Grundpreis); „more“ / „extra“: wie viele Artikel
// zusätzlich abgedeckt sind und was die kosten (deshalb kann die Summe höher sein). Bis 8 Märkte werden alle
// Kombinationen geprüft, darüber nur die 8 Märkte mit den meisten Angeboten.
function bestBasket(rows) {
  const count = new Map();
  for (const r of rows) for (const o of r.offers) count.set(o.store, (count.get(o.store) || 0) + 1);
  const stores = [...count.keys()].sort((a, b) => count.get(b) - count.get(a)).slice(0, 8);
  const basket = (set) => {
    const picks = {};
    let total = 0, n = 0;
    for (const r of rows) {
      // je Artikel das günstigste Angebot dieser Märkte – nach Grundpreis, wenn beide einen in derselben Einheit haben
      const o = r.offers.filter((x) => set.includes(x.store)).sort((a, b) => cheaper(a, b))[0];
      if (o) { picks[r.uid] = o; total += o.price; n += 1; }
    }
    return { stores: [...new Set(Object.values(picks).map((o) => o.store))], count: n, total: Math.round(total * 100) / 100, picks };
  };
  const better = (a, b) => !b || a.count > b.count || (a.count === b.count && a.total < b.total - 0.004);
  const best = [];  // best[k-1] = bester Einkauf mit genau k Märkten
  for (let mask = 1; mask < 1 << stores.length; mask++) {
    const set = stores.filter((_, i) => mask & (1 << i));
    const b = basket(set);
    if (!b.count || b.stores.length !== set.length) continue;  // ein Markt ohne Beitrag zählt nicht
    if (better(b, best[set.length - 1])) best[set.length - 1] = b;
  }
  const all = [];
  for (const b of best) {
    if (!b) break;
    if (all.length && !better(b, all[all.length - 1])) break;
    all.push(b);
  }
  const one = all[0] || null;
  // Was ein anderes Angebot für dieselbe Menge kostet: bei gleicher Einheit über den Grundpreis (6 l Cola zu 1,00 €/l
  // statt zu 1,33 €/l spart 1,98 €, auch wenn die größere Packung mehr kostet), sonst der Packungspreis.
  const forSameAmount = (mine, other) => (mine.unit && other.unit && mine.unit.unit === other.unit.unit && mine.unit.value > 0
    ? other.unit.value * (mine.price / mine.unit.value) : other.price);
  const out = all.map((b, i) => {
    if (!i) return b;
    let same = 0, extra = 0;
    for (const uid of Object.keys(one.picks)) same += b.picks[uid] ? forSameAmount(one.picks[uid], b.picks[uid]) : one.picks[uid].price;
    for (const [uid, o] of Object.entries(b.picks)) if (!one.picks[uid]) extra += o.price;
    // größere Packungen: an der Kasse teurer, pro Liter/Kilo aber günstiger – für die aufklappbare Erklärung
    const bigger = [];
    for (const uid of Object.keys(one.picks)) {
      const mine = one.picks[uid], other = b.picks[uid];
      if (!other || other.id === mine.id || !mine.unit || !other.unit || mine.unit.unit !== other.unit.unit) continue;
      if (!(other.price > mine.price + 0.004 && other.unit.value < mine.unit.value - 0.004 && mine.unit.value > 0 && other.unit.value > 0)) continue;
      const amount = mine.price / mine.unit.value;
      bigger.push({ uid, unit: mine.unit.unit, more: Math.round((other.price - mine.price) * 100) / 100,
        amountMine: Math.round(amount * 10) / 10, amountOther: Math.round((other.price / other.unit.value) * 10) / 10,
        unitMine: mine.unit.value, unitOther: other.unit.value, saves: Math.round((mine.price - other.unit.value * amount) * 100) / 100 });
    }
    return { ...b, saving: Math.max(0, Math.round((one.total - same) * 100) / 100), more: b.count - one.count,
      extra: Math.round(extra * 100) / 100, bigger };
  });
  return { one, two: out[1] || null, all: out };
}
// Preis-Gedächtnis: merkt je Angebot (Markt + Name) den Preis und, wenn er sich ändert, den vorherigen mit Datum.
// So lässt sich sagen „war am 10.11. billiger“. seen = { key: { p, d, pp?, pd? } }; liefert das neue seen und je
// Angebot einen Hinweis { dir: "up" | "down", price, date }. Einträge älter als 120 Tage fallen weg.
function rememberPrices(seen, offers, today) {
  const next = {}, hints = {};
  const limit = new Date(new Date(today + "T12:00:00Z").getTime() - 120 * 864e5).toISOString().slice(0, 10);
  for (const [k, v] of Object.entries(seen || {})) if (v && v.d >= limit) next[k] = v;
  // zwei Angebote mit demselben Namen im selben Markt (z. B. zwei Packungsgrößen): nicht unterscheidbar, auslassen
  const twice = new Set(), once = new Set();
  for (const o of offers) { const k = `${norm(o.store)}|${norm(o.name)}`; (once.has(k) ? twice : once).add(k); }
  for (const o of offers) {
    if (o.soon) continue;
    const k = `${norm(o.store)}|${norm(o.name)}`, was = next[k];
    if (twice.has(k)) { delete next[k]; continue; }
    if (!was) { next[k] = { p: o.price, d: today }; continue; }
    if (Math.abs(was.p - o.price) > 0.004 && was.d < today) next[k] = { p: o.price, d: today, pp: was.p, pd: was.d };
    else next[k] = { ...was, d: today };
    const now = next[k];
    if (now.pp != null && Math.abs(now.pp - now.p) > 0.004) hints[o.id] = { dir: now.pp < now.p ? "up" : "down", price: now.pp, date: now.pd };
  }
  const keys = Object.keys(next);
  if (keys.length > 3000) keys.sort((a, b) => (next[a].d < next[b].d ? -1 : 1)).slice(0, keys.length - 3000).forEach((k) => delete next[k]);
  return { seen: next, hints };
}
// Zentraler Preisverlauf (SmartLists merkt die Preise in Home Assistant, für alle Browser gleich): die Angebote als
// Paare [Schlüssel, Preis] – dieselben Schlüssel und Regeln wie oben („demnächst“ und doppelte Namen je Markt bleiben draußen).
function priceKeys(offers) {
  const twice = new Set(), once = new Set(), key = (o) => `${norm(o.store)}|${norm(o.name)}`.slice(0, 200);
  for (const o of offers) { const k = key(o); (once.has(k) ? twice : once).add(k); }
  return offers.filter((o) => !o.soon && !twice.has(key(o)) && Number.isFinite(o.price)).map((o) => [key(o), o.price]).slice(0, 8000);
}
// Hinweise je Angebot aus dem Stand, den SmartLists zurückgibt: { key: { p, d, pp?, pd? } }
function hintsFrom(seen, offers) {
  const hints = {};
  for (const o of offers) {
    const x = (seen || {})[`${norm(o.store)}|${norm(o.name)}`.slice(0, 200)];
    if (x && x.pp != null && Math.abs(x.pp - o.price) > 0.004 && Math.abs(x.p - o.price) <= 0.004) hints[o.id] = { dir: x.pp < o.price ? "up" : "down", price: x.pp, date: x.pd };
  }
  return hints;
}
const cheaper = (a, b) => (a.unit && b.unit && a.unit.unit === b.unit.unit ? a.unit.value - b.unit.value || a.price - b.price : a.price - b.price);
// passende Angebote für einen Artikelnamen: je Markt das günstigste, günstigstes zuerst
function dealsFor(offers, name, mode = "word") {
  const byStore = new Map();
  for (const o of offers) {
    if (!matches(name, o.name, mode)) continue;
    const cur = byStore.get(o.store);
    if (!cur || cheaper(o, cur) < 0) byStore.set(o.store, o);
  }
  return [...byStore.values()].sort(cheaper);
}

