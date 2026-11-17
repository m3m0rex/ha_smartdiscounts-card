const DEFAULTS = { list: "", match: "word", default_tab: "list", show_images: true, show_unit_price: true, show_valid_until: true, hide_without_offer: false, max_per_store: 10, all_view: "tiles", list_view: "chips", sources: "auto", group_by: "store", tile_flow: "grid", mine_only: false, add_to: "", category_source: "auto", categories_open: true, watch: [], watch_list: "", notify: false, notify_service: "" };
// bekannte Märkte: Erkennung über entity_id / Namen der Quelle, Farbe des Badges
const STORES = [["rewe", "REWE", "#cc071e"], ["edeka", "EDEKA", "#f5c400"], ["lidl", "Lidl", "#0050aa"], ["aldi_sued", "ALDI Süd", "#00a0e0"], ["aldi_nord", "ALDI Nord", "#1a4d9f"], ["aldi", "ALDI", "#00549f"],
  ["norma", "Norma", "#d40f14"], ["penny", "Penny", "#cd1414"], ["kaufland", "Kaufland", "#e10915"], ["netto", "Netto", "#ffd400"], ["rossmann", "Rossmann", "#c3002d"], ["dm", "dm", "#002878"], ["globus", "Globus", "#f39200"]];
// Feldnamen der Angebote: der erste vorhandene zählt (je Quelle mit `map:` überschreibbar)
const FIELDS = { name: ["product", "title", "name", "product_name", "description"], price: ["price", "new_price", "discount_price", "offer_price", "sale_price", "price_euro", "current_price"],
  old_price: ["old_price", "regular_price", "original_price", "was_price", "oldPrice", "base_price_old"], image: ["picture_link", "image_url", "image", "picture", "img", "thumbnail"],
  until: ["valid_until", "end_date", "valid_to", "until", "valid_through", "validTo"], unit: ["price_per_unit", "base_price", "unit_price", "grundpreis"], category: ["category", "categories", "group"], discount: ["discount", "discount_percent", "savings"], brand: ["brand", "manufacturer"], store: ["store", "market", "retailer", "advertiser"] };
const LIST_ATTRS = ["discounts", "offers", "deals", "items", "results", "products"];

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
    const attr = src.attribute || LIST_ATTRS.find((a) => Array.isArray(state.attributes[a]));
    const rows = get(state.attributes, attr);
    if (!Array.isArray(rows)) continue;
    const store = storeOf(src, state);
    const pick = (o, f) => { const key = (src.map && src.map[f]) || FIELDS[f].find((k) => o[k] != null && o[k] !== ""); return key ? get(o, key) : null; };
    rows.forEach((o, i) => {
      if (!o || typeof o !== "object") return;
      const name = pick(o, "name"), price = num(pick(o, "price"));
      if (!name || price == null) return;
      const unitText = pick(o, "unit"), until = pick(o, "until") ? String(pick(o, "until")).slice(0, 10) : null;
      if (until && /^\d{4}-\d\d-\d\d$/.test(until) && until < today) return;  // abgelaufen
      const st = pick(o, "store");
      const cat = pick(o, "category"), old = num(pick(o, "old_price"));
      // Rabatt: Angabe der Quelle („-44%“) oder aus altem und neuem Preis berechnet
      const dm = String(pick(o, "discount") || "").match(/-?\s*(\d{1,2})\s*%/);
      const pct = dm ? +dm[1] : old && old > price ? Math.round((1 - price / old) * 100) : null;
      const label = st ? String(st) : store.label, dk = `${norm(label)}|${norm(name)}|${price}|${until || ""}`, twin = seen.get(dk);
      if (twin) { if (!twin.image) twin.image = pick(o, "image"); if (!twin.unit && unitText) { twin.unitText = String(unitText).replace(/ /g, " "); twin.unit = unitPrice(unitText); } if (!twin.category) twin.category = Array.isArray(cat) ? cat[0] : cat || ""; return; }
      out.push({ id: `${src.entity}#${i}`, name: String(name), price, old: old && old > price ? old : null, pct, brand: pick(o, "brand") || "", image: pick(o, "image"), until, today: until === today,
        unitText: unitText ? String(unitText).replace(/ /g, " ") : "", unit: unitPrice(unitText), category: Array.isArray(cat) ? cat[0] : cat || "",
        store: label, color: store.color, entity: src.entity });
      seen.set(dk, out[out.length - 1]);
    });
  }
  return out;
}
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
  const sig = sourcesCached(hass, cfg).map((x) => `${x.entity}:${hass.states[x.entity].last_updated || hass.states[x.entity].state}`).join("|") + "|" + new Date().toISOString().slice(0, 10);
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

