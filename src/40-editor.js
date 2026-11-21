class SmartDiscountsCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...(config || {}) }; this._draw(); }
  set hass(hass) {
    // Home Assistant setzt hass bei jeder Zustandsänderung – der Editor muss nur neu, wenn sich Sprache, Sensoren oder Dienste ändern
    const sig = `${hass.language}|${Object.keys(hass.states).length}|${Object.keys((hass.services && hass.services.notify) || {}).length}|${(hass.config.components || []).length}`;
    this._hass = hass;
    if (sig === this._hsig && this._form) { this._form.hass = hass; return; }
    this._hsig = sig; this._draw();
  }
  _draw() {
    if (!this._hass || !this._config) return;
    const t = TEXTS[String(this._hass.language || "en").slice(0, 2)] || TEXTS.en;
    const b = (name) => ({ name, selector: { boolean: {} } });
    // nur Sensoren anbieten, die wirklich Angebote liefern
    const found = sourcesCached(this._hass, "auto").map((s) => s.entity);
    const storeNames = [...new Set([...offersCached(this._hass, "auto").map((o) => o.store), ...(Array.isArray(this._config.stores) ? this._config.stores : [])])].sort((a, b) => a.localeCompare(b));
    const schema = [
      { name: "title", selector: { text: {} } },
      { name: "list", selector: { entity: { domain: "todo" } } },
      ...(storeNames.length ? [{ name: "stores", selector: { select: { multiple: true, mode: "dropdown", options: storeNames.map((x) => ({ value: x, label: x })) } } }] : []),
      { name: "entities", selector: { entity: { multiple: true, ...(found.length ? { include_entities: [...new Set([...found, ...(this._config.entities || [])])] } : { domain: "sensor" }) } } },
      { name: "match", selector: { select: { mode: "dropdown", options: [["word", t.m_word], ["exact", t.m_exact], ["part", t.m_part]].map(([value, label]) => ({ value, label })) } } },
      { name: "default_tab", selector: { select: { mode: "dropdown", options: [...(LIST_TAB ? [["list", t.tab_list]] : []), ["all", t.tab_all], ["watch", t.tab_watch]].map(([value, label]) => ({ value, label })) } } },
      { name: "list_view", selector: { select: { mode: "dropdown", options: [["rows", t.v_rows], ["table", t.v_table]].map(([value, label]) => ({ value, label })) } } },
      b("mine_only"),
      { name: "add_to", selector: { entity: { domain: "todo" } } },
      { name: "collect_first", selector: { boolean: {} } },
      { name: "tabs", selector: { select: { multiple: true, reorder: true, mode: "list", options: [...(LIST_TAB ? [["list", t.tab_list]] : []), ["all", t.tab_all], ["watch", t.tab_watch]].map(([value, label]) => ({ value, label })) } } },
      b("categories_open"),
      { name: "locked", selector: { select: { multiple: true, mode: "list", options: [["list_view", t.lk_list], ["all_view", t.lk_all], ["group_by", t.lk_group], ...((this._hass.config.components || []).includes("smartlists") ? [["add_to", t.lk_add]] : [])].map(([value, label]) => ({ value, label })) } } },
      { name: "category_source", selector: { select: { mode: "dropdown", options: [["auto", t.cs_auto], ["store", t.cs_store], ["store_only", t.cs_store_only]].map(([value, label]) => ({ value, label })) } } },
      { name: "tile_flow", selector: { select: { mode: "dropdown", options: [["grid", t.tf_grid], ["scroll", t.tf_scroll]].map(([value, label]) => ({ value, label })) } } },
      { name: "group_by", selector: { select: { mode: "dropdown", options: [["store", t.g_store], ["category", t.g_cat]].map(([value, label]) => ({ value, label })) } } },
      { name: "all_view", selector: { select: { mode: "dropdown", options: [["tiles", t.v_tiles], ["list", t.v_list]].map(([value, label]) => ({ value, label })) } } },
      { type: "grid", name: "", schema: [b("show_images"), b("show_unit_price"), b("show_valid_until"), b("show_price_trend"), b("hide_without_offer"), b("use_bonus")] },
      { name: "max_per_store", selector: { number: { min: 1, max: 20, mode: "box" } } },
      { name: "watch", selector: { text: { multiple: true } } },
      { name: "watch_list", selector: { entity: { domain: "todo" } } },
      b("notify"),
      { name: "currency_symbol", selector: { text: {} } },
    ];
    const labels = { title: t.e_title, list: t.e_list, match: t.e_match, default_tab: t.e_tab, list_view: t.e_lview, all_view: t.e_view, group_by: t.e_group, entities: t.e_entities, stores: t.e_stores, tabs: t.e_tabs, tile_flow: t.e_flow, sec_look: t.s_look, sec_all: t.tab_all, sec_watch: t.s_watch, sec_more: t.s_more, mine_only: t.e_mine, add_to: t.e_add_to, collect_first: t.e_collect, category_source: t.e_cat_src, category_map: t.e_cat_map, locked: t.e_locked, categories_open: t.e_cat_open, show_images: t.e_images, show_unit_price: t.e_unit,
      show_valid_until: t.e_until, show_price_trend: t.e_trend, hide_without_offer: t.e_hide_none, use_bonus: t.e_bonus, max_per_store: t.e_max,
      watch: t.e_watch, watch_list: t.e_watch_list, notify: t.e_notify,  currency_symbol: t.e_symbol };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) => { this._config = e.detail.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); });
      this._hint = h("p", { style: "color:var(--secondary-text-color);font-size:.85rem;margin:12px 0 0" });
      this._targets = h("div", {});
      this._cats = h("div", {});
      this.append(this._form, this._cats, this._targets, this._hint);
    }
    // Übersichtlich auch ohne SmartLists: oben nur das Nötigste, der Rest in aufklappbaren Abschnitten;
    // Felder, die nur mit SmartLists etwas bewirken, erscheinen nur, wenn es installiert ist.
    const smart = (this._hass.config.components || []).includes("smartlists");
    const by = Object.fromEntries(schema.filter((s) => s.name).map((s) => [s.name, s])), grid = schema.find((s) => s.type === "grid");
    const pick = (...names) => names.map((n) => by[n]).filter(Boolean);
    const sec = (name, icon, items) => ({ type: "expandable", name, flatten: true, title: labels[name], icon, schema: items.filter(Boolean) });
    const grouped = [...pick("title", "list", "stores"),
      sec("sec_look", "mdi:palette-outline", [...pick("tabs", "default_tab", ...(LIST_TAB ? ["list_view"] : []), "match"), grid, ...pick("locked")]),
      sec("sec_all", "mdi:tag-multiple-outline", pick("all_view", "tile_flow", "group_by", "categories_open", ...(smart ? ["category_source"] : []), "max_per_store")),
      sec("sec_watch", "mdi:star-outline", pick("watch", "watch_list", "notify")),
      sec("sec_more", "mdi:tune", pick("entities", "add_to", ...(LIST_TAB ? ["collect_first"] : []), ...(smart ? ["mine_only"] : []), "currency_symbol"))];
    this._form.hass = this._hass; this._form.schema = grouped; this._form.data = { ...DEFAULTS, ...this._config };
    this._form.computeLabel = (s) => labels[s.name] || s.name;
    this._drawTargets(t);
    this._drawCats(t);
    this._hint.textContent = t.e_sources;
  }
  // Markt-Kategorien verknüpfen: je Kategorie, die die Sensoren gerade liefern, ein Feld für den gewünschten Namen
  // (Vorschläge: die Kategorien von SmartLists und schon vergebene). Leer = unverändert, „keine“ = zählt nicht.
  _drawCats(t) {
    const box = this._cats, cfg = this._config;
    const open = box.firstChild ? box.firstChild.open : false;
    const map = cfg.category_map && typeof cfg.category_map === "object" ? { ...cfg.category_map } : {};
    const counts = {};
    try { offersCached(this._hass, cfg.sources === undefined ? "auto" : cfg.sources).forEach((o) => { const k = String(o.category || "").trim(); if (k) counts[k] = (counts[k] || 0) + 1; }); } catch (e) { /* */ }
    Object.keys(map).forEach((k) => { if (!(k in counts)) counts[k] = 0; });  // verknüpfte bleiben sichtbar, auch wenn gerade kein Angebot sie hat
    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const set = (k, v) => {
      if (v === undefined) delete map[k]; else map[k] = v;
      const next = { ...cfg }; if (Object.keys(map).length) next.category_map = map; else delete next.category_map;
      this._config = next;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
      this._drawCats(t);
    };
    if (this._catNames === undefined && (this._hass.config.components || []).includes("smartlists")) {
      this._catNames = [];
      this._hass.callWS({ type: "smartlists/categorize", names: [], language: this._hass.language })
        .then((r) => { this._catNames = ((r && r.categories) || []).map((x) => x.label).filter(Boolean); this._drawCats(t); }, () => {});
    }
    const sugg = [...new Set([...(this._catNames || []), ...Object.values(map).filter(Boolean)])];
    const field = "height:36px;border-radius:8px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;padding:0 10px;min-width:0;flex:1 1 140px";
    const rows = keys.map((k) => {
      const none = map[k] === "" || (map[k] === undefined && NO_CATEGORY.test(norm(k)));
      const input = h("input", { type: "text", list: "sd-cat-names", value: map[k] || "", placeholder: none ? t.cm_none : t.cm_keep, "aria-label": k, style: field });
      input.addEventListener("change", () => set(k, input.value.trim() || undefined));
      return h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--divider-color)" },
        h("span", { style: "flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis" }, k, h("small", { style: "color:var(--secondary-text-color)" }, counts[k] ? ` · ${counts[k]}` : "")),
        h("span", { "aria-hidden": "true", style: "color:var(--secondary-text-color)" }, "→"), input,
        h("button", { type: "button", "aria-pressed": String(map[k] === ""), title: t.cm_none, onclick: () => set(k, map[k] === "" ? undefined : ""),
          style: `height:36px;border-radius:8px;padding:0 10px;font:inherit;cursor:pointer;border:1px solid ${map[k] === "" ? "var(--primary-color)" : "var(--divider-color)"};background:none;color:${map[k] === "" ? "var(--primary-color)" : "var(--secondary-text-color)"}` }, "∅"));
    });
    const det = h("details", { style: "border:1px solid var(--divider-color);border-radius:12px;padding:0 14px;margin-top:12px" },
      h("summary", { style: "cursor:pointer;padding:14px 0;font-weight:500" }, `🗂️ ${t.cm_title}${Object.keys(map).length ? ` (${Object.keys(map).length})` : ""}`),
      h("p", { style: "color:var(--secondary-text-color);font-size:.85rem;margin:0 0 8px" }, t.cm_help),
      h("datalist", { id: "sd-cat-names" }, sugg.map((n) => h("option", { value: n }))),
      keys.length ? rows : h("p", { style: "color:var(--secondary-text-color)" }, t.cm_empty), h("div", { style: "height:10px" }));
    det.open = open;
    box.replaceChildren(det);
  }
  // Ziele der Benachrichtigung im Stil der Entitäts-Auswahl von Home Assistant: Suche, je Zeile Symbol, Name und Kennung,
  // rechts ein Häkchen – mehrere möglich. Enthält notify-Dienste (Companion-App, Telegram, …) und notify-Entitäten.
  _drawTargets(t) {
    const box = this._targets, cfg = this._config;
    if (!cfg.notify) { box.replaceChildren(); return; }
    const all = [
      ...Object.keys((this._hass.services && this._hass.services.notify) || {}).filter((sv) => !["send_message", "persistent_notification", "notify"].includes(sv)).sort()
        .map((sv) => ({ id: "notify." + sv, icon: sv.startsWith("mobile_app_") ? "📱" : /telegram/.test(sv) ? "✈️" : /alexa|tts|speak/.test(sv) ? "🔊" : "✉️", name: (sv.startsWith("mobile_app_") ? sv.slice(11) : sv).replace(/_/g, " ") })),
      ...Object.keys(this._hass.states).filter((e) => e.startsWith("notify.")).sort().map((e) => ({ id: e, icon: "🔔", name: (this._hass.states[e].attributes || {}).friendly_name || e })),
    ];
    const chosen = new Set(Array.isArray(cfg.notify_targets) ? cfg.notify_targets : []);
    [...chosen].filter((id) => !all.some((x) => x.id === id)).forEach((id) => all.push({ id, icon: "✉️", name: id }));  // nicht (mehr) vorhandene bleiben abwählbar
    const q = (this._tq || "").toLowerCase();
    const toggle = (id) => {
      if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
      const next = { ...cfg, notify_targets: [...chosen] };
      this._config = next;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
      this._drawTargets(t);
    };
    const search = h("input", { type: "search", placeholder: t.search_targets, "aria-label": t.search_targets, value: this._tq || "",
      style: "width:100%;box-sizing:border-box;height:44px;border-radius:10px;border:1.5px solid var(--primary-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;padding:0 12px;margin:0 0 4px" });
    search.addEventListener("input", () => { this._tq = search.value; const pos = search.selectionStart; this._drawTargets(t); const f = box.querySelector("input"); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* */ } } });
    const rows = all.filter((x) => !q || `${x.name} ${x.id}`.toLowerCase().includes(q)).map((x) => h("button", { type: "button", role: "option", "aria-selected": String(chosen.has(x.id)), onclick: () => toggle(x.id),
      style: `display:flex;align-items:center;gap:14px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid var(--divider-color);background:${chosen.has(x.id) ? "color-mix(in srgb, var(--primary-color) 14%, transparent)" : "none"};color:var(--primary-text-color);font:inherit;text-align:left;cursor:pointer` },
      h("span", { style: "width:28px;text-align:center;font-size:1.2rem" }, x.icon),
      h("span", { style: "flex:1;min-width:0" }, h("b", { style: "display:block;font-weight:600" }, x.name), h("small", { style: "display:block;font-family:ui-monospace,Consolas,monospace;font-size:.75rem;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, x.id)),
      h("span", { style: `width:20px;height:20px;border-radius:6px;display:grid;place-items:center;flex:none;font-size:.8rem;color:#fff;border:2px solid ${chosen.has(x.id) ? "var(--primary-color)" : "var(--secondary-text-color)"};background:${chosen.has(x.id) ? "var(--primary-color)" : "none"}` }, chosen.has(x.id) ? "✓" : "")));
    box.replaceChildren(h("div", { style: "margin:16px 0 0" },
      h("div", { style: "font-weight:500;margin:0 0 8px" }, `${t.e_notify_service} · ${chosen.size}`), search,
      h("div", { role: "listbox", "aria-multiselectable": "true", style: "max-height:280px;overflow-y:auto;border:1px solid var(--divider-color);border-radius:10px" },
        rows.length ? rows : h("div", { style: "padding:12px;color:var(--secondary-text-color)" }, t.no_hits))));
  }
}

customElements.define(TAG, SmartDiscountsCard);
customElements.define(TAG + "-editor", SmartDiscountsCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: TAG, name: "SmartDiscounts", description: "Supermarket offers, matched with your shopping list", preview: true, documentationURL: "https://github.com/m3m0rex/ha_smartdiscounts-card" });
console.info(`%c SMARTDISCOUNTS-CARD %c ${VERSION} `, "background:#e39a1c;color:#111;font-weight:700", "background:#222;color:#fff");
// Test-Hilfen (reine Funktionen)
// … und für andere Karten (SmartLists zeigt damit den 🏷️-Hinweis in der Einkaufsliste)
window.SmartDiscounts = { itemName, matches, num, unitPrice, bestBasket, rememberPrices, priceKeys, hintsFrom, offers: (hass, sources = "auto") => offersCached(hass, sources), dealsFor: dealsForCached };
})();
