class SmartDiscountsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(TAG + "-editor"); }
  static getStubConfig(hass) {
    const todo = Object.keys((hass && hass.states) || {}).find((e) => e.startsWith("todo."));
    return { list: todo || "" };
  }
  setConfig(config) {
    const before = this._config;
    this._config = { ...DEFAULTS, ...(config || {}) };
    // Beim Ändern einer Einstellung (Editor) bleibt man, wo man ist: Reiter, Suche, Auf- und Zugeklapptes. Nur beim
    // ersten Aufbau – oder wenn gerade der Start-Reiter geändert wurde – gilt `default_tab`.
    if (!before || before.default_tab !== this._config.default_tab || !this._tab) {
      this._tab = ["all", "watch"].includes(this._config.default_tab) ? this._config.default_tab : "list";
    }
    if (!this._tabs().includes(this._tab)) this._tab = this._tabs()[0];
    if (!before) {
      this._closed = new Set(); this._allCats = false;
      this._sel = {};       // Artikel-UID → gewähltes Angebot
      this._open = new Set();
      this._query = ""; this._cat = "";
    }
    // „Erst unter Meine Liste sammeln“: vorgemerkte Angebote aus „Alle Angebote“ (in diesem Browser, je Karte)
    try { this._staged = JSON.parse(localStorage.getItem(this._memKey("staged")) || "[]"); } catch (e) { this._staged = []; }
    if (!Array.isArray(this._staged)) this._staged = [];
    this._view = this._config.all_view === "list" ? "list" : "tiles";
    // "locked": was hier steht, ist in der Karte nicht umschaltbar – es gilt die Einstellung, nicht die gemerkte Wahl
    const free = (k) => !this._locked(k);
    try { const v = localStorage.getItem(this._memKey("view")); if (free("all_view") && (v === "list" || v === "tiles")) this._view = v; } catch (e) { /* */ }
    this._group = this._config.group_by === "category" ? "category" : "store";
    try { const v = localStorage.getItem(this._memKey("group")); if (free("group_by") && (v === "category" || v === "store")) this._group = v; } catch (e) { /* */ }
    // drei Ansichten; die frühere „Preise nebeneinander“ (chips) gibt es nicht mehr – wer sie eingetragen hat, sieht „rows“
    // „compact“ (eine Zeile je Artikel) ist vorerst ausgeschaltet – die Darstellung bleibt im Code, wer sie eingetragen hat, sieht „rows“
    const LV = ["rows", "table"];
    this._lview = LV.includes(this._config.list_view) ? this._config.list_view : "rows";
    try { const v = localStorage.getItem(this._memKey("list-view")); if (free("list_view") && LV.includes(v)) this._lview = v; } catch (e) { /* */ }
    this._cexp = new Set();
    this._bkOpen = new Set();  // aufgeklappte Erklärungen „größere Packung“ im Günstigsten Einkauf
    if (!this.shadowRoot) { this._card = h("div", { class: "wrap" }); this.attachShadow({ mode: "open" }).append(h("style", {}, STYLE), h("ha-card", {}, this._card)); }
    this._sig = null;
    if (this._hass) this._refresh(true);
  }
  set hass(hass) {
    this._hass = hass;
    this._t = TEXTS[String(hass.language || "en").slice(0, 2)] || TEXTS.en;
    this._refresh(false);
  }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  // "entities": nur diese Sensoren (z. B. eine Karte nur für REWE) – einfache Form von "sources", im Editor auswählbar.
  // Eigene Angaben unter "sources" (store, color, map) bleiben für diese Sensoren erhalten.
  _src() {
    const c = this._config, only = (Array.isArray(c.entities) ? c.entities : c.entities ? [c.entities] : []).filter((e) => typeof e === "string" && e);
    if (!only.length) return c.sources;
    const own = Array.isArray(c.sources) ? c.sources.filter((s) => s && typeof s === "object") : [];
    return only.map((e) => own.find((s) => s.entity === e) || e);
  }
  _sources() { return sourcesCached(this._hass, this._src()); }
  // "stores": nur diese Märkte (nach Namen, z. B. [REWE, ALDI]) – wirkt zusätzlich zu "entities"
  _offers() {
    const only = (Array.isArray(this._config.stores) ? this._config.stores : this._config.stores ? [this._config.stores] : []).map((x) => norm(x)).filter(Boolean);
    const all = offersCached(this._hass, this._src());
    if (!only.length) return all;
    // gefilterte Liste ebenfalls merken, damit die Treffer je Artikel wiederverwendet werden
    if (this._storeHit && this._storeHit.all === all && this._storeHit.key === only.join("|")) return this._storeHit.list;
    this._storeHit = { all, key: only.join("|"), list: all.filter((o) => only.includes(norm(o.store))) };
    return this._storeHit.list;
  }
  _money(v) { if (this._config.currency_symbol) { try { return `${new Intl.NumberFormat(this._hass.language || "de", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}\u00a0${this._config.currency_symbol}`; } catch (e) { return `${v.toFixed(2)} ${this._config.currency_symbol}`; } }
    try { return new Intl.NumberFormat(this._hass.language || "de", { style: "currency", currency: this._config.currency || "EUR" }).format(v); } catch (e) { return `${v.toFixed(2)} €`; } }
  _day(d) { const p = String(d || "").split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : d || ""; }
  // „bis 21.11.“, „nur noch heute“ – oder bei Angeboten, die erst später gelten, „ab 23.11.“
  _valid(o) {
    const t = this._t;
    if (!this._config.show_valid_until) return "";
    if (o.soon) return `${t.from} ${this._day(o.from)}`;
    return o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : "";
  }
  // Preis-Gedächtnis: mit SmartLists zentral in Home Assistant (in jedem Browser und in der App gleich), sonst in
  // diesem Browser. Angebote mit ihrem Preis merken; ändert er sich, den alten mit Datum behalten.
  _remember() {
    this._hints = {};
    if (this._config.show_price_trend === false) return;
    const today = new Date().toISOString().slice(0, 10);
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem("smartdiscounts-prices") || "{}") || {}; } catch (e) { seen = {}; }
    const r = rememberPrices(seen, this._all, today);
    this._hints = r.hints;
    try { localStorage.setItem("smartdiscounts-prices", JSON.stringify(r.seen)); } catch (e) { /* Speicher voll oder gesperrt: ohne Gedächtnis */ }
    this._rememberCentral(seen);
  }
  // Mit SmartLists (ab 4.0.0-beta.13): der Verlauf liegt in Home Assistant. Das Gedächtnis dieses Browsers wird einmal
  // dorthin übernommen und bleibt als Ersatz bestehen, falls SmartLists fehlt oder älter ist.
  async _rememberCentral(local) {
    if (this._noCentral || !((this._hass.config && this._hass.config.components) || []).includes("smartlists")) return;
    const all = this._all;
    let moved = false;
    try { moved = localStorage.getItem("smartdiscounts-prices-moved") === "1"; } catch (e) { /* */ }
    try {
      const r = await this._hass.callWS({ type: "smartlists/offer_prices", offers: priceKeys(all), ...(moved || !Object.keys(local).length ? {} : { local }) });
      if (!moved) { try { localStorage.setItem("smartdiscounts-prices-moved", "1"); } catch (e) { /* */ } }
      if (all !== this._all) return; // inzwischen neu geladen: der nächste Durchlauf zeigt den Stand
      this._hints = hintsFrom(r.seen, all);
      this._render();
    } catch (e) {
      if (e && e.code === "unknown_command") this._noCentral = true; // ältere SmartLists-Version: beim Browser bleiben
    }
  }
  // „▲ am 10.11. 0,99 €“ (war billiger) bzw. „▼ zuletzt 1,49 €“ (jetzt billiger)
  _trendText(o) {
    const x = this._hints && this._hints[o.id], t = this._t;
    if (!x) return "";
    return (x.dir === "up" ? t.tr_up : t.tr_down).replace("{price}", this._money(x.price)).replace("{date}", this._day(x.date));
  }
  // kurz unter dem Preis: „▲ 9,99 €“ (war billiger) / „▼ 1,79 €“ (war teurer); der ganze Satz steht im Tooltip
  _trendEl(o) {
    const x = this._hints && this._hints[o.id];
    return x ? h("span", { class: `trend ${x.dir}`, title: this._trendText(o) }, `${x.dir === "up" ? "▲" : "▼"} ${this._money(x.price)}`) : null;
  }
  _unitLabel(o) { return o.unit ? `${this._money(o.unit.value)}/${o.unit.unit}` : ""; }
  // Grundpreis als eigene Zeile; grün, wenn er unter mehreren Angeboten mit derselben Einheit der niedrigste ist
  _unitEl(o, low) {
    if (!this._config.show_unit_price || !o.unit) return null;
    const u = o.unit;
    return h("span", { class: `u ${low ? "low" : ""}`, title: low ? this._t.unit_low : null }, h("b", {}, this._money(u.full ?? u.value)), `/${u.unit}`,
      u.full != null ? h("span", { class: "withbonus", title: this._t.with_bonus }, ` (${this._money(u.value)}/${u.unit})`) : null);
  }
  // Preis: der echte; mit Bonus gerechnet dahinter in Klammern der Preis nach Abzug des Guthabens
  _pr(o) { return o.full != null ? [this._money(o.full), h("span", { class: "withbonus", title: this._t.with_bonus }, ` (${this._money(o.price)})`)] : this._money(o.price); }
  _unitLow(offers) {
    const by = {}, low = new Set();
    offers.forEach((o) => { if (o.unit) (by[o.unit.unit] = by[o.unit.unit] || []).push(o); });
    Object.values(by).forEach((g) => { if (g.length > 1) low.add(g.reduce((a, b) => (b.unit.value < a.unit.value ? b : a)).id); });
    return low;
  }
  // günstiger: nach Grundpreis, wenn beide denselben haben – sonst nach Preis
  _cmp(a, b) { return cheaper(a, b); }

  // light = nur die Einträge neu holen (nach ＋/−): Rechte und Quell-Listen ändern sich dabei nicht
  async _loadList(light = false) {
    const id = this._config.list;
    if (!id || !this._hass.states[id]) { this._items = null; return; }
    try {
      const r = await this._hass.callWS({ type: "todo/item/list", entity_id: id });
      this._items = (r.items || []).filter((i) => i.status !== "completed").map((i) => ({ uid: i.uid, text: i.summary || "", note: i.description || "", name: itemName(i.summary) }));
    } catch (e) { this._items = []; this._error = (e && e.message) || this._t.error; }
    if (light && this._perm) return;
    // Mit SmartLists: dessen Rechte für diese Liste und diesen Benutzer gelten auch hier (nur abhaken = nichts hinzufügen/ändern).
    this._perm = { add: true, rename: true, delete: true, note: true };
    this._mine = [];
    if ((this._hass.config.components || []).includes("smartlists")) {
      try {
        const r = await this._hass.callWS({ type: "smartlists/get_list", entity_id: id });
        if (r && r.permissions) this._perm = { ...this._perm, ...r.permissions };
        // Kombinierte Liste: die eigenen Quell-Listen – daraus wählt jeder Benutzer in der Karte, wohin Neues kommt
        this._mine = r && r.type === "combined" && Array.isArray(r.sources) ? r.sources.filter((s) => s.mine).map((s) => ({ id: s.entity_id, name: s.name || s.entity_id })) : [];
        // Kombinierte Liste mit "mine_only": nur Artikel aus Quell-Listen, die zu diesem Benutzer gehören
        if (r && r.type === "combined" && this._config.mine_only && Array.isArray(r.sources) && Array.isArray(r.items)) {
          const mine = new Set(r.sources.filter((s) => s.mine).map((s) => s.entity_id));
          const src = Object.fromEntries(r.items.map((i) => [i.uid, i.source_entity]));
          this._items = this._items.filter((i) => !src[i.uid] || mine.has(src[i.uid]));
        }
      }
      catch (e) { /* keine SmartLists-Liste oder kein Zugriff: Home Assistant entscheidet beim Schreiben */ }
    }
  }
  _may(what) { return !this._perm || this._perm[what] !== false; }
  async _refresh(force) {
    if (!this._config || !this._hass) return;
    // nur neu laden/zeichnen, wenn sich eine Quelle oder die Liste geändert hat
    const st = this._hass.states;
    const ids = [...this._sources().map((s) => s.entity), this._config.list, this._config.watch_list].filter(Boolean);
    const sig = ids.map((e) => (st[e] ? st[e].last_updated || st[e].state : "")).join("|") + "|" + (this._hass.language || "");
    if (!force && sig === this._sig) return;
    this._sig = sig;
    // Angebote nur neu einlesen, wenn sich eine Angebots-Quelle geändert hat – nicht bei jeder Änderung an der Liste
    // (sonst kostet jedes ＋ das Einlesen aller Angebote und die Kategorien von SmartLists)
    const osig = this._sources().map((s) => `${s.entity}=${st[s.entity] ? st[s.entity].last_updated || st[s.entity].state : ""}`).join("|") + "|" + (this._config.use_bonus ? 1 : 0);
    if (force || osig !== this._osig || !this._every) {
      this._osig = osig;
      // „demnächst“ (gilt erst ab einem späteren Tag) getrennt führen: alles Übrige rechnet nur mit dem, was jetzt gilt
      this._every = this._offers();
      this._next = this._every.filter((o) => o.soon);
      this._all = this._every.filter((o) => !o.soon);
      this._remember();
      // „Ich nutze Bonus-Programme“: verglichen wird mit dem Preis nach Abzug des Guthabens (erst nach dem Preisverlauf,
      // der mit echten Preisen rechnet)
      if (this._config.use_bonus) this._all = this._all.map(withBonus);
      this._tellSources();
    }
    // Schnell sichtbar: die Angebote sofort zeichnen, Liste und Merkliste gleichzeitig laden (nicht nacheinander) und
    // die Kategorien von SmartLists zuletzt – das ist bei vielen Angeboten die längste Abfrage.
    const first = this._loading === undefined;
    if (first) { this._loading = true; this._render(); }
    await Promise.all([this._loadList(), this._loadWatch()]);
    this._loading = false;
    this._render();
    this._notify();
    const cats = this._catMap;
    await this._loadCats();
    if (this._catMap !== cats) this._render();
  }
  // ----- Merkliste: Produkte, bei denen man auf ein Angebot wartet.
  // Quelle: "watch" in der Konfiguration + eine To-do-Liste ("watch_list", gilt auf allen Geräten) oder – ohne sie – dieses Gerät.
  async _loadWatch() {
    const id = this._config.watch_list;
    // Mit SmartLists hat jeder Benutzer seine eigenen Merklisten in Home Assistant – das gilt dann IMMER, auch wenn in
    // der Karte noch eine „watch_list“ (To-do-Liste) eingetragen ist: die Karte gilt für alle, die das Dashboard öffnen,
    // und eine gemeinsame To-do-Liste würde die Merkliste eines jeden dort ablegen (und in jeder kombinierten Liste zeigen).
    this._watchSmart = (this._hass.config.components || []).includes("smartlists");
    this._watchShared = !this._watchSmart && !!(id && this._hass.states[id]);
    if (this._watchSmart) {
      try {
        // Merklisten je Benutzer (SmartLists ab 4.0.0-beta.13): r.lists nennt die eigenen, r.list die gezeigte
        const r = await this._hass.callWS({ type: "smartlists/watch", ...this._wl() });
        // r.items nennt je Produkt seine Liste (SmartLists ab 4.0.0-beta.14) – gebraucht für „Alle Merklisten“
        this._watchItems = Array.isArray(r.items) ? r.items.map((x) => ({ name: x.name, list: x.list })) : (r.names || []).map((name) => ({ name }));
        this._watchLists = Array.isArray(r.lists) ? r.lists : null; this._watchSel = r.list || null; this._watchDefault = r.default || null;
        this._watchCanAll = typeof r.show_all === "boolean";
        this._watchErr = "";
        await this._adoptLocalWatch();
        return;
      }
      catch (e) {
        if (e && e.code === "unknown_command") { this._watchSmart = false; this._watchShared = !!(id && this._hass.states[id]); }  // SmartLists-Version ohne Merkliste: wie ohne
        // SmartLists ist da, antwortet aber gerade nicht: nichts still auf dem Gerät ablegen, sondern den Fehler zeigen
        else { this._watchErr = (e && e.message) || this._t.error || "Error"; this._watchItems = this._watchItems || []; return; }
      }
    }
    // Ohne SmartLists: Merklisten je Benutzer im Benutzer-Speicher von Home Assistant (privat, auf allen Geräten) –
    // oder, wenn dieser Benutzer die Karte mit einer To-do-Liste verbunden hat, dort. „watch_list“ in der Karte geht vor.
    this._watchUser = false; this._watchLinked = false; this._watchEntity = id;
    if (!this._watchSmart && !this._watchShared && await this._udLoad()) {
      const linked = (this._ud.todo || {})[this._memKey("watch")];
      if (linked && this._hass.states[linked]) { this._watchShared = true; this._watchLinked = true; this._watchEntity = linked; }
      else {
        this._watchUser = true;
        const r = await this._udCmd(this._wl());
        this._watchItems = r.items; this._watchLists = r.lists; this._watchSel = r.list; this._watchDefault = r.default; this._watchCanAll = true; this._watchErr = "";
        await this._adoptLocalWatch();
        return;
      }
    }
    if (this._watchShared) {
      try {
        const r = await this._hass.callWS({ type: "todo/item/list", entity_id: this._watchEntity });
        this._watchItems = (r.items || []).filter((i) => i.status !== "completed").map((i) => ({ uid: i.uid, name: itemName(i.summary) || String(i.summary || "") }));
      } catch (e) { this._watchItems = []; }
    } else {
      let local = [];
      try { local = JSON.parse(localStorage.getItem("smartdiscounts-watch") || "[]"); } catch (e) { /* */ }
      this._watchItems = (Array.isArray(local) ? local : []).filter((x) => typeof x === "string" && x.trim()).map((name) => ({ name }));
    }
  }
  _wl() { return this._watchSel ? { list: this._watchSel } : {}; }
  // Merklisten in Home Assistant: mit SmartLists dessen Befehl, sonst der Benutzer-Speicher (gleiche Antwort)
  _wset(msg) { return this._watchUser ? this._udCmd(msg, true) : this._hass.callWS({ type: "smartlists/watch_set", ...msg }); }
  async _udLoad() {
    try { const r = await this._hass.callWS({ type: "frontend/get_user_data", key: "smartdiscounts" }); this._ud = r && r.value && typeof r.value === "object" ? r.value : {}; return true; }
    catch (e) { this._ud = null; return false; }  // kein Benutzer-Speicher: wie bisher in diesem Browser
  }
  _udSave() { return this._hass.callWS({ type: "frontend/set_user_data", key: "smartdiscounts", value: this._ud }); }
  // Bildet smartlists/watch und smartlists/watch_set nach: { names, items, lists, list, default, show_all }
  async _udCmd(msg, write) {
    const ud = this._ud, ck = this._memKey("watch");
    if (!Array.isArray(ud.lists) || !ud.lists.length) ud.lists = [{ id: "l1", name: this._t.tab_watch, names: [] }];
    if (!ud.lists.some((x) => x.id === ud.default)) ud.default = ud.lists[0].id;
    ud.sel = ud.sel || {};
    if (typeof msg.show_all === "boolean") ud.sel[ck] = msg.show_all ? "all" : (msg.list && msg.list !== "all" ? msg.list : ud.default);
    const pick = msg.list || ud.sel[ck];
    let cur = ud.lists.find((x) => x.id === pick) || ud.lists.find((x) => x.id === ud.default);
    const name = (v) => String(v || "").trim().slice(0, 40);
    if (msg.new_list && name(msg.new_list)) { cur = { id: `l${Date.now().toString(36)}`, name: name(msg.new_list), names: [] }; ud.lists.push(cur); ud.sel[ck] = cur.id; }
    if (msg.rename && name(msg.rename)) cur.name = name(msg.rename);
    if (msg.make_default) ud.default = cur.id;
    if (msg.delete_list && ud.lists.length > 1) {
      ud.lists = ud.lists.filter((x) => x !== cur);
      if (ud.default === cur.id) ud.default = ud.lists[0].id;
      cur = ud.lists.find((x) => x.id === ud.default); ud.sel[ck] = cur.id;
    }
    if (Array.isArray(msg.names)) cur.names = msg.names.map(String);
    if (msg.add && !cur.names.some((n) => norm(n) === norm(msg.add))) cur.names.push(String(msg.add));
    if (msg.remove) ud.lists.forEach((l) => { if (l === cur || pick === "all") l.names = l.names.filter((n) => n !== msg.remove); });
    if (write) await this._udSave();
    const all = (msg.new_list || msg.delete_list ? false : pick === "all") && ud.lists.length > 1;
    return { names: cur.names.slice(), items: (all ? ud.lists : [cur]).flatMap((l) => l.names.map((n) => ({ name: n, list: l.id }))),
      lists: ud.lists.map((l) => ({ id: l.id, name: l.name, count: l.names.length })), list: all ? "all" : cur.id, default: ud.default, show_all: all };
  }
  // ----- Merkliste als To-do-Liste führen (auf Nachfrage): Einträge ziehen um, diese Karte zeigt für diesen Benutzer dann die Liste
  _watchTodoPanel() {
    const t = this._t, admin = !!(this._hass.user && this._hass.user.is_admin);
    const todos = Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && e !== this._config.list);
    const sel = h("select", { class: "search", "aria-label": t.w_todo_pick },
      admin ? h("option", { value: "" }, "＋ " + t.w_todo_new) : null,
      todos.map((e) => h("option", { value: e }, (this._hass.states[e].attributes || {}).friendly_name || e)));
    const input = h("input", { type: "text", class: "search", maxlength: "40", placeholder: t.w_todo_name, "aria-label": t.w_todo_name, value: t.tab_watch });
    const sync = () => { input.hidden = !!sel.value; }; sel.addEventListener("change", sync); sync();
    const close = () => { this._wtodo = false; this._wtodoErr = ""; this._render(); };
    if (!admin && !todos.length) return h("div", { class: "foot", style: "text-align:left" }, t.w_todo_none, " ", h("button", { type: "button", class: "btn", onclick: close }, t.wl_cancel));
    return h("div", { class: "staged" }, h("div", { class: "bh" }, "📝 " + t.w_to_todo), h("div", { class: "foot", style: "text-align:left;padding:0 0 8px" }, t.w_todo_hint),
      h("div", { class: "filters one" }, sel, input),
      this._wtodoErr ? h("div", { class: "msg", role: "alert", style: "padding:4px 0;text-align:left;color:var(--error-color,#db4437)" }, this._wtodoErr) : null,
      h("div", { class: "acts" }, h("button", { type: "button", class: "btn", onclick: close }, t.wl_cancel),
        h("button", { type: "button", class: "btn pri", onclick: (e) => { e.currentTarget.disabled = true; this._watchToTodo(sel.value, input.value.trim()); } }, t.w_todo_go)));
  }
  async _watchToTodo(entity, name) {
    try {
      if (!entity) {  // neue lokale To-do-Liste (nur Admins)
        if (!name) throw new Error(this._t.w_todo_name);
        const before = new Set(Object.keys(this._hass.states).filter((e) => e.startsWith("todo.")));
        const flow = await this._hass.callApi("POST", "config/config_entries/flow", { handler: "local_todo", show_advanced_options: false });
        const done = await this._hass.callApi("POST", `config/config_entries/flow/${flow.flow_id}`, { todo_list_name: name });
        if (!done || done.type !== "create_entry") throw new Error(this._t.w_todo_fail);
        for (let i = 0; i < 40 && !entity; i++) {  // die Entität erscheint kurz nach dem Anlegen
          entity = Object.keys(this._hass.states).find((e) => e.startsWith("todo.") && !before.has(e)) || "";
          if (!entity) await new Promise((r) => setTimeout(r, 250));
        }
        if (!entity) throw new Error(this._t.w_todo_fail);
      }
      const r = await this._hass.callWS({ type: "todo/item/list", entity_id: entity });
      const have = new Set((r.items || []).filter((i) => i.status !== "completed").map((i) => norm(itemName(i.summary) || i.summary || "")));
      for (const x of this._watchItems || []) {
        if (have.has(norm(x.name))) continue;
        have.add(norm(x.name));
        await this._hass.callService("todo", "add_item", { item: x.name }, { entity_id: entity });
      }
      // umgezogen: aus dem Benutzer-Speicher nehmen (die gezeigte Liste bzw. alle) und die Karte mit der To-do-Liste verbinden
      const ud = this._ud, moved = new Set((this._watchItems || []).map((x) => x.name));
      (ud.lists || []).forEach((l) => { if (this._watchSel === "all" || l.id === this._watchSel) l.names = l.names.filter((n) => !moved.has(n)); });
      ud.todo = { ...(ud.todo || {}), [this._memKey("watch")]: entity };
      await this._udSave();
      this._wtodo = false; this._wtodoErr = "";
    } catch (e) { this._wtodoErr = (e && (e.message || (e.body && e.body.message))) || this._t.w_todo_fail; }
    this._sig = null; await this._refresh(true);
  }
  async _watchUnlink() {
    if (this._ud && this._ud.todo) { delete this._ud.todo[this._memKey("watch")]; try { await this._udSave(); } catch (e) { /* */ } }
    this._sig = null; await this._refresh(true);
  }
  // Was früher nur in diesem Browser lag, zieht einmal in die Merkliste in Home Assistant um – erst danach wird es hier entfernt
  async _adoptLocalWatch() {
    let local = [];
    try { local = JSON.parse(localStorage.getItem("smartdiscounts-watch") || "[]"); } catch (e) { return; }
    local = (Array.isArray(local) ? local : []).filter((x) => typeof x === "string" && x.trim());
    if (!local.length) return;
    const have = new Set((this._watchItems || []).map((x) => norm(x.name)));
    const fresh = local.filter((n) => !have.has(norm(n)) && have.add(norm(n)));
    try {
      if (fresh.length) {
        const r = await this._wset({ names: [...(this._watchItems || []).map((x) => x.name), ...fresh], ...(this._watchSel === "all" ? {} : this._wl()) });
        this._watchItems = (r.names || []).map((name) => ({ name }));
        if (Array.isArray(r.lists)) this._watchLists = r.lists;
        this._watchAdopted = fresh.length;
      }
      localStorage.removeItem("smartdiscounts-watch");
    } catch (e) { /* bleibt auf dem Gerät, nächster Versuch beim nächsten Laden */ }
  }
  // Eigene Merklisten verwalten (nur mit SmartLists): anlegen, umbenennen, Standard, löschen
  async _watchListCmd(patch) {
    this._wlErr = "";
    try {
      const r = await this._wset({ ...this._wl(), ...patch });
      this._watchSel = r.list || null; this._wlEdit = null; this._wlSure = false;
    } catch (e) { this._wlErr = (e && e.message) || this._t.error || "Error"; }
    this._sig = null; await this._refresh(true);
  }
  _watchListBar() {
    const t = this._t, lists = this._watchLists;
    if (!(this._watchSmart || this._watchUser) || !lists) return null;
    const err = this._wlErr ? h("div", { class: "msg", role: "alert", style: "padding:4px 0;text-align:left;color:var(--error-color,#db4437)" }, this._wlErr) : null;
    if (this._wlEdit) {
      const cur = lists.find((x) => x.id === this._watchSel);
      const input = h("input", { type: "text", class: "search", maxlength: "40", placeholder: t.wl_name, "aria-label": t.wl_name, value: this._wlEdit === "rename" && cur ? cur.name : "" });
      const ok = () => { const v = input.value.trim(); if (v) this._watchListCmd(this._wlEdit === "rename" ? { rename: v } : { new_list: v }); };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") ok(); if (e.key === "Escape") { this._wlEdit = null; this._wlErr = ""; this._render(); } });
      setTimeout(() => input.focus(), 30);
      return h("div", {}, h("div", { class: "filters one" }, input, h("button", { type: "button", class: "btn pri", onclick: ok }, t.wl_ok),
        h("button", { type: "button", class: "btn", onclick: () => { this._wlEdit = null; this._wlErr = ""; this._render(); } }, t.wl_cancel)), err);
    }
    // „Alle Merklisten“: alle eigenen Listen zusammen. Die Wahl merkt sich Home Assistant je Benutzer (nicht der Browser).
    const all = this._watchSel === "all", canAll = this._watchCanAll && lists.length > 1;
    const sel = h("select", { class: "search", "aria-label": t.wl_yours, onchange: (e) => {
      this._watchSel = e.target.value; this._wlSure = false;
      if (this._watchCanAll) this._watchListCmd({ show_all: this._watchSel === "all" }); else { this._sig = null; this._refresh(true); }
    } },
      canAll || all ? h("option", { value: "all", selected: all }, t.wl_all) : null,
      lists.map((x) => h("option", { value: x.id, selected: x.id === this._watchSel }, `${x.name} (${x.count})${x.id === this._watchDefault ? ` · ${t.wl_is_default}` : ""}`)));
    const b = (label, title, onclick, cls = "btn") => h("button", { type: "button", class: cls, title, "aria-label": title, onclick }, label);
    if (all) return h("div", {}, h("div", { class: "filters one", title: t.wl_private }, sel,
      b("＋", t.wl_new, () => { this._wlEdit = "new"; this._wlErr = ""; this._render(); })), h("div", { class: "foot", style: "text-align:left" }, t.wl_all_hint), err);
    return h("div", {}, h("div", { class: "filters one", title: t.wl_private }, sel,
      b("＋", t.wl_new, () => { this._wlEdit = "new"; this._wlErr = ""; this._render(); }),
      b("✎", t.wl_rename, () => { this._wlEdit = "rename"; this._wlErr = ""; this._render(); }),
      this._watchSel === this._watchDefault ? null : b("★", t.wl_default, () => this._watchListCmd({ make_default: true })),
      lists.length < 2 ? null : b(this._wlSure ? t.wl_delete_sure : "🗑", t.wl_delete, () => { if (this._wlSure) this._watchListCmd({ delete_list: true }); else { this._wlSure = true; this._render(); } }, this._wlSure ? "btn pri" : "btn")), err);
  }
  // Wo die Merkliste liegt – und, wenn Home Assistant sie gerade nicht liefert, der Fehler mit „Erneut versuchen“
  _watchNote() {
    const t = this._t;
    if (this._watchSmart && this._watchErr) return h("div", { class: "msg", role: "alert", style: "text-align:left;color:var(--error-color,#db4437)" },
      `${t.w_err} (${this._watchErr}) `, h("button", { type: "button", class: "btn", onclick: () => { this._sig = null; this._refresh(true); } }, t.w_retry));
    if (this._watchSmart) {
      // früher lag die Merkliste in einer To-do-Liste (watch_list): sagen, dass sie nicht mehr benutzt wird, und das Übernehmen anbieten
      const old = this._config.watch_list, st = old && this._hass.states[old];
      const unused = st && !this._watchTook ? h("div", { class: "foot", style: "text-align:left" }, t.w_list_unused.replace("{list}", (st.attributes && st.attributes.friendly_name) || old), " ",
        h("button", { type: "button", class: "btn", onclick: () => this._watchTakeOver(old) }, t.w_list_take)) : null;
      return h("div", {}, h("div", { class: "foot" }, this._watchAdopted ? `${t.w_adopted.replace("{n}", this._watchAdopted)} ` : "", t.w_ha), unused);
    }
    if (this._watchUser) return this._wtodo ? this._watchTodoPanel() : h("div", { class: "foot" }, this._watchAdopted ? `${t.w_adopted.replace("{n}", this._watchAdopted)} ` : "", t.w_user, " ",
      h("button", { type: "button", class: "btn", onclick: () => { this._wtodo = true; this._render(); } }, t.w_to_todo + " …"));
    if (this._watchLinked) { const st = this._hass.states[this._watchEntity];
      return h("div", { class: "foot" }, t.w_linked.replace("{list}", (st && st.attributes && st.attributes.friendly_name) || this._watchEntity), " ",
        h("button", { type: "button", class: "btn", onclick: () => this._watchUnlink() }, t.w_unlink)); }
    return this._watchShared ? null : h("div", { class: "foot" }, t.w_local);
  }
  // Offene Einträge der früheren To-do-Merkliste in die eigene Merkliste kopieren (dort bleibt alles stehen)
  async _watchTakeOver(entity) {
    try {
      const r = await this._hass.callWS({ type: "todo/item/list", entity_id: entity });
      const have = new Set((this._watchItems || []).map((x) => norm(x.name)));
      const fresh = (r.items || []).filter((i) => i.status !== "completed").map((i) => itemName(i.summary) || String(i.summary || "")).filter((n) => n && !have.has(norm(n)) && have.add(norm(n)));
      if (fresh.length) await this._hass.callWS({ type: "smartlists/watch_set", names: [...(this._watchItems || []).map((x) => x.name), ...fresh], ...this._wl() });
      this._watchTook = true; this._watchAdopted = fresh.length;
    } catch (e) { this._watchErr = (e && e.message) || this._t.error || "Error"; }
    this._sig = null; await this._refresh(true);
  }
  _watchTerms() {
    const fixed = (Array.isArray(this._config.watch) ? this._config.watch : [this._config.watch]).filter((x) => typeof x === "string" && x.trim()).map((name) => ({ name: name.trim(), fixed: true }));
    const seen = new Set(fixed.map((x) => norm(x.name)));
    return [...fixed, ...(this._watchItems || []).filter((x) => x.name && !seen.has(norm(x.name)) && seen.add(norm(x.name)))];
  }
  async _watchAdd(name) {
    name = String(name || "").trim();
    if (!name || this._watchTerms().some((x) => norm(x.name) === norm(name))) return;
    if (this._watchSmart || this._watchUser) { try { await this._wset({ add: name, ...this._wl() }); } catch (e) { this._watchErr = (e && e.message) || this._t.error || "Error"; this._render(); return; } }
    else if (this._watchShared) await this._hass.callService("todo", "add_item", { item: name }, { entity_id: this._watchEntity });
    else { try { localStorage.setItem("smartdiscounts-watch", JSON.stringify([...(this._watchItems || []).map((x) => x.name), name])); } catch (e) { /* */ } }
    this._sig = null; await this._refresh(true);
  }
  async _watchRemove(term) {
    if (this._watchSmart || this._watchUser) { try { await this._wset({ remove: term.name, ...this._wl() }); } catch (e) { this._watchErr = (e && e.message) || this._t.error || "Error"; this._render(); return; } }
    else if (this._watchShared && term.uid) await this._hass.callService("todo", "remove_item", { item: term.uid }, { entity_id: this._watchEntity });
    else { try { localStorage.setItem("smartdiscounts-watch", JSON.stringify((this._watchItems || []).map((x) => x.name).filter((n) => n !== term.name))); } catch (e) { /* */ } }
    this._sig = null; await this._refresh(true);
  }
  // Benachrichtigung in Home Assistant, sobald etwas von der Merkliste neu im Angebot ist.
  // Läuft in der Karte: gemeldet wird, wenn ein Dashboard mit der Karte geöffnet ist. Jedes Angebot nur einmal je Gerät.
  async _notify() {
    const c = this._config;
    if (!c.notify || this._notifying || this._watchSmart) return;  // mit SmartLists meldet die Integration selbst
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem("smartdiscounts-notified") || "[]"); } catch (e) { /* */ }
    // zusätzlich im Speicher merken – falls der Browser keinen dauerhaften Speicher erlaubt
    seen = [...new Set([...(Array.isArray(seen) ? seen : []), ...(this._notified || [])])];
    const fresh = [];
    for (const term of this._watchTerms()) for (const o of dealsForCached(this._all, term.name, c.match)) {
      const key = `${norm(term.name)}|${o.store}|${o.name}|${o.price}|${o.until || ""}`;
      if (!seen.includes(key)) { seen.push(key); fresh.push({ term, o }); }
    }
    if (!fresh.length) return;
    this._notifying = true; this._notified = seen.slice(-400);
    try { localStorage.setItem("smartdiscounts-notified", JSON.stringify(seen.slice(-400))); } catch (e) { /* */ }
    const t = this._t;
    const message = fresh.slice(0, 12).map(({ term, o }) => `${term.name}: ${o.name} – ${this._money(o.full ?? o.price)} (${o.store}${o.until ? `, ${t.until} ${this._day(o.until)}` : ""})`).join("\n")
      + (fresh.length > 12 ? `\n+${fresh.length - 12}` : "");
    try {
      await this._hass.callService("persistent_notification", "create", { title: `🏷️ ${t.n_title}`, message, notification_id: "smartdiscounts_watch" });
      // weitere Ziele: notify-Dienste (Companion-App, Telegram, …) und notify-Entitäten
      const targets = [...new Set((Array.isArray(c.notify_targets) ? c.notify_targets : []).filter((x) => typeof x === "string" && x))];
      for (const id of targets) {
        // nur notify-Dienste: die Karte ruft sie mit den Rechten des Betrachters auf – kein anderer Dienst über die Konfiguration
        const m = id.match(/^(notify)\.([a-z0-9_]+)$/);
        if (!m) continue;
        try {
          if (m[1] === "notify" && this._hass.states[id]) await this._hass.callService("notify", "send_message", { entity_id: id, title: `🏷️ ${t.n_title}`, message });
          else await this._hass.callService(m[1], m[2], { title: `🏷️ ${t.n_title}`, message, data: { tag: "smartdiscounts_watch" } });
        } catch (e) { console.warn("smartdiscounts-card: notify", id, e); }
      }
    } catch (e) { console.warn("smartdiscounts-card: notify", e); }
    this._notifying = false;
  }
  _renderWatch() {
    if (this._loading && this._watchItems === undefined && this._watchSmart === undefined) return h("div", { class: "msg" }, this._t.loading);
    const t = this._t, c = this._config, terms = this._watchTerms();
    const input = h("input", { class: "search", type: "text", placeholder: t.w_add, "aria-label": t.w_add });
    const go = async () => { const v = input.value; input.value = ""; try { await this._watchAdd(v); } catch (e) { input.value = v; } };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    const row = (o) => {
      const sub = [c.show_unit_price ? this._unitLabel(o) : "", this._valid(o)].filter(Boolean).join(" · ");
      return h("div", { class: "lrow", title: o.name },
        c.show_images ? h("div", { class: "thumb", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image ? null : "🏷️") : null,
        h("div", { class: "n" }, o.name, h("small", {}, this._storeBadge(o), sub ? ` ${sub}` : "")),
        h("div", { class: "pr" }, h("b", {}, this._pr(o)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null, this._trendEl(o)),
        this._slot(o));
    };
    const blocks = terms.map((term) => {
      const offers = dealsForCached(this._all, term.name, c.match);
      const from = this._watchSel === "all" && term.list ? (this._watchLists || []).find((x) => x.id === term.list) : null;
      return h("div", { class: "shelf" }, h("h4", {}, "⭐ ", term.name, h("small", {}, offers.length ? `${offers.length} ${offers.length > 1 ? t.offers : t.offer1}` : t.none, from ? ` · ${from.name}` : ""), h("span", { class: "sp" }),
        term.fixed ? h("small", {}, t.w_fixed) : h("button", { type: "button", "aria-label": `${t.exp_remove}: ${term.name}`, onclick: () => this._watchRemove(term) }, t.exp_remove)),
        offers.length ? h("div", { class: "lrows" }, offers.map(row)) : null);
    });
    return h("div", {}, this._watchListBar(), h("div", { class: "filters one" }, input, h("button", { type: "button", class: "btn pri", onclick: go }, t.w_add_btn)),
      terms.length ? blocks : h("div", { class: "msg" }, t.w_empty), this._watchNote(), this._foot());
  }
  _matchesFor(item) { return item.name ? dealsForCached(this._all, item.name, this._config.match) : []; }
  _attached(item) { return /[⚙⚙]️?\s*OFFER\s*:|🏷️/.test(item.note || ""); }

  _render() {
    const t = this._t, c = this._config;
    const stores = [...new Set(this._all.map((o) => o.store))];
    const head = h("div", { class: "head" }, h("h1", {}, c.title || t.title), h("small", {}, `${this._all.length} ${t.offers} · ${stores.length ? stores.join(", ") : "–"}`));
    const hits = this._watchHits();
    const names = { list: "📝 " + t.tab_list + (this._collect() && this._staged.length ? ` · 🛒 ${this._staged.length}` : ""), all: "🏷️ " + t.tab_all, watch: "⭐ " + t.tab_watch + (hits ? ` · ${hits}` : "") };
    const shown = this._tabs();
    // nur ein Reiter gewählt: keine Reiter-Leiste
    const tabs = shown.length > 1 ? h("div", { class: "tabs" }, shown.map((v) =>
      h("button", { type: "button", class: this._tab === v ? "on" : "", onclick: () => { this._tab = v; this._render(); } }, names[v]))) : null;
    const body = !this._all.length ? h("div", { class: "msg" }, t.no_sources) : this._tab === "list" ? this._renderList(stores) : this._tab === "watch" ? this._renderWatch() : this._renderAll(stores);
    this._card.className = `wrap ${c.show_images ? "" : "noimg"}`;
    this._card.replaceChildren(...[head, tabs, body].filter(Boolean));  // ohne Reiter-Leiste sonst „null“ als Text
  }
  // Kategorie eines Angebots: mit SmartLists dessen Einkaufs-Kategorien (einheitlich über alle Märkte), sonst die des Sensors
  async _loadCats() {
    // "store": Kategorien des Markts – SmartLists wird nur noch für Angebote gefragt, deren Markt keine brauchbare liefert
    // "store_only": nur die des Markts – SmartLists wird gar nicht gefragt
    const src = this._config.category_source;
    const need = src === "store_only" ? [] : src === "store" ? this._every.filter((o) => !this._ownCat(o)) : this._every;
    if (!need.length || !(this._hass.config.components || []).includes("smartlists")) { this._catMap = null; return; }
    // gleiche Angebots-Namen: nicht erneut fragen (auch wenn die Angebote neu eingelesen wurden)
    const key = need.map((o) => o.name).sort().join("\n");
    if (this._catFor === key && this._catLang === this._hass.language) return;
    this._catMap = null; this._catFor = key; this._catLang = this._hass.language;
    try {
      const r = await this._hass.callWS({ type: "smartlists/categorize", names: [...new Set(need.map((o) => o.name))], language: this._hass.language });
      const labels = Object.fromEntries((r.categories || []).map((x) => [x.id, x.label]));
      this._catOrder = (r.categories || []).map((x) => x.label);
      this._catMap = Object.fromEntries(Object.entries(r.map || {}).map(([n, id]) => [n, labels[id] || id]));
    } catch (e) { this._catMap = null; }  // ältere SmartLists-Version: Kategorien der Sensoren
  }
  // Kategorie des Markts, wenn sie etwas über das Produkt sagt. „Store“, „Online“, „Angebote“ … tun das nicht (Lidl
  // liefert nur solche) und zählen als „keine“. `category_map` verknüpft Markt-Kategorien mit eigenen Namen, z. B.
  // mit denen von SmartLists: { "Molkereiprodukte": "Kühlung", "Store": "" } (leer = keine Kategorie).
  _ownCat(o) {
    const raw = String(o.category || "").trim(), map = CATEGORY_MAP ? this._config.category_map : null;
    if (map && typeof map === "object") {
      if (!this._cmap || this._cmapOf !== map) { this._cmapOf = map; this._cmap = new Map(Object.entries(map).map(([k, v]) => [norm(k).trim(), String(v == null ? "" : v).trim()])); }
      if (this._cmap.has(norm(raw))) return this._cmap.get(norm(raw));
    }
    return NO_CATEGORY.test(norm(raw)) ? "" : raw;
  }
  _catOf(o) {
    const smart = this._catMap && this._catMap[o.name], own = this._ownCat(o);
    const src = this._config.category_source;
    return (src === "store_only" ? own : src === "store" ? own || smart : smart || own) || this._t.other;
  }
  // "tabs": welche Reiter in welcher Reihenfolge, z. B. [all, watch]. Ohne Angabe alle drei.
  _tabs() {
    // „Meine Liste“ ist vorerst ausgeschaltet (LIST_TAB in 00-head.js) – der Code bleibt
    const c = this._config, all = LIST_TAB ? ["list", "all", "watch"] : ["all", "watch"];
    const picked = (Array.isArray(c.tabs) ? c.tabs : []).filter((x, i, a) => all.includes(x) && a.indexOf(x) === i);
    const out = (picked.length ? picked : all);
    return out.length ? out : ["all"];
  }
  // Mit SmartLists: eigene Quellen (sources: mit Feld-Zuordnung) einmal melden, damit auch die Hintergrund-Prüfung
  // der Merkliste sie kennt. Übernommen wird nur von Admins; für alle anderen ist der Aufruf wirkungslos.
  _tellSources() {
    const own = Array.isArray(this._config.sources) ? this._config.sources.filter((s) => s && typeof s === "object" && s.entity) : [];
    const key = JSON.stringify(own);
    if (!own.length || this._told === key || !(this._hass.config.components || []).includes("smartlists") || !(this._hass.user && this._hass.user.is_admin)) return;
    this._told = key;
    this._hass.callWS({ type: "smartlists/watch_sources", sources: own.map((s) => ({ entity: s.entity, attribute: s.attribute, store: s.store, map: s.map })) }).catch(() => {});
  }
  _watchHits() { return this._watchTerms().filter((x) => dealsForCached(this._all, x.name, this._config.match).length).length; }
  _storeBadge(o) {
    const store = h("span", { class: "store", style: `background:${o.color};${/^#(f|e)[0-9a-f]{5}$/i.test(o.color) ? "color:#1a1a1a" : ""}` }, o.store);
    return o.bonus ? [store, " ", this._bonusEl(o)] : store;
  }
  // Bonus-Aktion deutlich kennzeichnen: es gibt Guthaben (nicht weniger zu zahlen), und nur mit der App des Markts
  _bonusEl(o) {
    const t = this._t, b = o.bonus;
    const amount = b.kind === "pct" ? `${String(b.value).replace(".", ",")} %` : this._money(b.value);
    return h("span", { class: "bonus" }, `🎁 ${t.bonus_label.replace("{amount}", amount).replace("{store}", o.store)}`);
  }
  _priceChip(item, o, best, low) {
    const t = this._t, c = this._config, sel = this._sel[item.uid] && this._sel[item.uid].id === o.id;
    const extra = [this._valid(o), this._trendText(o)].filter(Boolean).join(" · ");
    return h("button", { type: "button", class: `pc ${best ? "best" : ""} ${sel ? "sel" : ""}`, title: o.name, "aria-pressed": String(!!sel),
      onclick: () => { if (sel) delete this._sel[item.uid]; else this._sel[item.uid] = o; this._render(); } },
      h("span", { class: "s" }, h("span", { class: "dot", style: `background:${o.color}` }), o.store, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null, best ? h("span", { class: "star", title: t.best }, "★") : null,
        o.bonus ? h("span", { class: "bonus", "aria-label": t.bonus_label.replace("{amount}", "").replace("{store}", o.store).trim() }, "🎁") : null),
      h("b", {}, this._pr(o)), o.old ? h("s", {}, this._money(o.old)) : null, this._unitEl(o, low),
      h("span", { class: "x" }, o.name), extra ? h("span", { class: "x" }, extra) : null);
  }
  // „Meine Liste“ als Zeilen: ein Angebot je Zeile mit kleinem Bild, antippen wählt es
  _offerRow(item, o, best, low) {
    const t = this._t, c = this._config, sel = this._sel[item.uid] && this._sel[item.uid].id === o.id;
    const sub = [this._valid(o), this._trendText(o)].filter(Boolean).join(" · ");
    return h("button", { type: "button", class: `orow ${sel ? "sel" : ""} ${best ? "best" : ""}`, "aria-pressed": String(!!sel), title: o.name,
      onclick: () => { if (sel) delete this._sel[item.uid]; else this._sel[item.uid] = o; this._render(); } },
      h("span", { class: `radio ${sel ? "on" : ""}` }, sel ? "✓" : ""),
      c.show_images ? h("span", { class: "thumb sm", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image ? null : "🏷️") : null,
      h("span", { class: "n" }, o.name, h("small", {}, this._storeBadge(o), sub ? ` ${sub}` : "")),
      h("span", { class: "pr" }, h("b", {}, best ? "★ " : "", this._pr(o)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null, this._unitEl(o, low)));
  }
  _renderList(stores) {
    const t = this._t, c = this._config;
    if (!c.list || !this._hass.states[c.list]) return h("div", { class: "msg" }, t.no_list);
    if (this._loading && this._items === undefined) return h("div", { class: "msg" }, t.loading);
    const items = this._items || [];
    if (!items.length) return h("div", {}, this._stagedBox(), h("div", { class: "msg" }, this._error || t.list_empty));
    const rows = items.map((it) => ({ it, offers: this._matchesFor(it) }));
    const hit = rows.filter((r) => r.offers.length);
    // Wie viele Artikel der Liste hat welcher Markt im Angebot?
    const cover = stores.map((s) => [s, hit.filter((r) => r.offers.some((o) => o.store === s)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
    const choose = (fn) => { this._sel = {}; hit.forEach((r) => { const o = fn(r); if (o) this._sel[r.it.uid] = o; }); this._render(); };
    const clear = () => { this._sel = {}; this._render(); };  // noch einmal antippen hebt die Auswahl wieder auf
    const isCheapest = hit.length && hit.every((r) => this._sel[r.it.uid] && this._sel[r.it.uid].id === r.offers[0].id);
    const asCompact = this._lview === "compact", asTable = this._lview === "table", asRows = !asCompact && !asTable;
    // drei Ansichten zum Umschalten: ein Angebot je Zeile · kompakt (eine Zeile je Artikel) · Tabelle
    const toggle = h("span", { class: "vsw", role: "group", "aria-label": t.e_lview }, [["rows", "☰", t.v_rows], ["table", "▤", t.v_table]].map(([v, icon, label]) =>
      h("button", { type: "button", class: `btn vbtn sm ${this._lview === v ? "on" : ""}`, title: label, "aria-label": label, "aria-pressed": String(this._lview === v),
        onclick: () => { this._lview = v; try { localStorage.setItem(this._memKey("list-view"), v); } catch (e) { /* */ } this._render(); } }, icon)));
    const plan = h("div", { class: "plan" }, h("div", { class: "ph" }, h("b", {}, "💡 " + t.on_offer.replace("{n}", hit.length).replace("{m}", items.length)), hit.length && !this._locked("list_view") ? toggle : null),
      hit.length ? h("div", { class: "chips" },
        h("button", { type: "button", class: `chip ${isCheapest ? "on" : ""}`, "aria-pressed": String(!!isCheapest),
          onclick: () => (isCheapest ? clear() : choose((r) => r.offers[0])) }, "★ " + t.cheapest),
        cover.map(([s, n]) => { const col = (this._all.find((o) => o.store === s) || {}).color;
          const on = hit.some((r) => r.offers.some((o) => o.store === s)) && hit.every((r) => { const o = r.offers.find((x) => x.store === s); return o ? this._sel[r.it.uid] && this._sel[r.it.uid].id === o.id : !this._sel[r.it.uid]; });
          return h("button", { type: "button", class: `chip ${on ? "on" : ""}`, "aria-pressed": String(!!on), onclick: () => (on ? clear() : choose((r) => r.offers.find((o) => o.store === s))) }, h("span", { class: "dot", style: `background:${col}` }), `${t.only.replace("{store}", s)} · ${n}`); })) : null);
    // Günstigster Einkauf: ein Markt für möglichst viel – und ob ein zweiter, dritter … Markt etwas bringt
    // vorerst ausgeschaltet (show_cheapest_trip: true schaltet es wieder ein)
    const bb = this._config.show_cheapest_trip && hit.length > 1 ? bestBasket(hit.map((r) => ({ uid: r.it.uid, offers: r.offers }))) : { one: null, two: null, all: [] };
    const isBasket = (b) => b && hit.every((r) => (b.picks[r.it.uid] ? this._sel[r.it.uid] && this._sel[r.it.uid].id === b.picks[r.it.uid].id : !this._sel[r.it.uid]));
    const basketRow = (b, label) => h("button", { type: "button", class: `bk ${isBasket(b) ? "on" : ""}`, "aria-pressed": String(!!isBasket(b)),
      onclick: () => (isBasket(b) ? clear() : choose((r) => b.picks[r.it.uid])) },
      h("span", { class: "bl" }, h("b", {}, label), " ", b.stores.map((s) => this._storeBadge(this._all.find((o) => o.store === s)))),
      h("span", { class: "bm" }, t.bk_items.replace("{n}", b.count).replace("{m}", hit.length), b.more ? h("span", {}, " · " + t.bk_more.replace("{n}", b.more).replace("{sum}", this._money(b.extra))) : null,
        b.saving ? h("span", { class: "sv" }, " · " + (b.more ? t.bk_rest : t.bk_saves).replace("{sum}", this._money(b.saving))) : null),
      h("b", { class: "bs" }, this._money(b.total)));
    const bkLabel = (n) => (n === 1 ? t.bk_one : n === 2 ? t.bk_two : t.bk_n.replace("{n}", n));
    // Aufklappbar unter einem Einkauf: Artikel, bei denen eine größere Packung gewählt ist – mehr an der Kasse,
    // pro Liter/Kilo günstiger
    const nameOf = (uid) => { const r = hit.find((x) => x.it.uid === uid); return r ? r.it.name || r.it.text : ""; };
    const amt = (v, u) => `${String(v).replace(".", ",")} ${u}`;
    const per = (v, u) => `${this._money(v)}/${u}`;
    const bigBox = (b, key) => {
      if (!b.bigger || !b.bigger.length) return null;
      const open = this._bkOpen.has(key);
      return [h("button", { type: "button", class: "bkx", "aria-expanded": String(open), onclick: () => { if (open) this._bkOpen.delete(key); else this._bkOpen.add(key); this._render(); } },
        (open ? "▾ " : "▸ ") + (b.bigger.length === 1 ? t.bk_big1 : t.bk_big.replace("{n}", b.bigger.length))),
        open ? b.bigger.map((x) => h("div", { class: "bkd" },
          h("div", {}, h("span", {}, `${nameOf(x.uid)} · ${t.bk_bigger}`), h("span", {}, t.bk_more_pay.replace("{sum}", this._money(x.more)))),
          h("div", { class: "mut" }, h("span", {}, t.bk_amount.replace("{a}", amt(x.amountOther, x.unit)).replace("{b}", amt(x.amountMine, x.unit))),
            h("span", { class: "ok" }, t.bk_per.replace("{a}", per(x.unitOther, x.unit)).replace("{b}", per(x.unitMine, x.unit)))),
          h("div", { class: "ok" }, t.bk_same.replace("{a}", amt(x.amountMine, x.unit)).replace("{sum}", this._money(x.saves))))) : null];
    };
    const basket = bb.one && (stores.length > 1 || bb.two) ? h("div", { class: "basket" }, h("div", { class: "bh" }, "🧮 " + t.bk_title),
      bb.all.map((b, i) => [basketRow(b, bkLabel(i + 1)), bigBox(b, b.stores.slice().sort().join("|"))])) : null;
    // demnächst im Angebot (gilt erst ab einem späteren Tag)
    const soon = this._next.length ? items.map((it) => [it, it.name ? dealsForCached(this._next, it.name, c.match)[0] : null]).filter(([, o]) => o) : [];
    const soonBox = soon.length ? h("div", { class: "soonbox" }, h("b", {}, "📅 " + t.soon_title), " ",
      soon.slice(0, 6).map(([it, o], i) => [i ? ", " : "", `${it.name} (${o.store} ${this._money(o.price)}, ${t.from} ${this._day(o.from)})`]), soon.length > 6 ? " …" : "") : null;
    const line = (r) => {
      const { it, offers } = r, sel = this._sel[it.uid];
      if (!offers.length && c.hide_without_offer) return null;
      const low = this._unitLow(offers);
      if (asCompact) {
        // kompakt: eine Zeile je Artikel mit dem günstigsten (oder gewählten) Angebot; „+1“ klappt die anderen auf
        if (!offers.length) return h("div", { class: "cl none" }, h("span", { class: "radio" }), h("span", { class: "n" }, it.name || it.text), h("small", {}, this._attached(it) ? "🏷️ " + t.attached : t.none));
        const cur = sel || offers[0], open = this._cexp.has(it.uid);
        return [h("div", { class: `cl ${sel ? "sel" : ""}`, role: "button", tabindex: "0", title: cur.name,
          onclick: (e) => { if (e.target.closest(".more")) { if (open) this._cexp.delete(it.uid); else this._cexp.add(it.uid); } else if (sel) delete this._sel[it.uid]; else this._sel[it.uid] = offers[0]; this._render(); } },
          h("span", { class: `radio ${sel ? "on" : ""}` }, sel ? "✓" : ""), h("span", { class: "n" }, it.name || it.text), this._storeBadge(cur),
          offers.length > 1 ? h("button", { type: "button", class: "more", "aria-expanded": String(open) }, `+${offers.length - 1} ${open ? "▴" : "▾"}`) : null,
          h("b", { class: cur.id === offers[0].id ? "best" : "" }, cur.id === offers[0].id && offers.length > 1 ? "★ " : "", this._pr(cur))),
          open ? h("div", { class: "prices", style: "margin:0 0 8px 28px" }, offers.map((o, i) => this._priceChip(it, o, i === 0 && offers.length > 1, low.has(o.id)))) : null];
      }
      const img = sel ? sel.image : offers[0] && offers[0].image;
      return h("div", { class: "it" },
        h("div", { class: "top" }, c.show_images && !asRows ? h("div", { class: "thumb", style: img ? `background-image:url("${String(img).replace(/"/g, "%22")}");background-color:#fff` : null }, img ? null : "🛒") : null,
          h("div", { class: "n" }, it.name || it.text, sel ? [" ", this._storeBadge(sel)] : null, sel ? h("small", {}, sel.name) : it.text !== it.name ? h("small", {}, it.text) : null),
          sel ? h("span", { class: "st ok" }, this._pr(sel)) : this._attached(it) ? h("span", { class: "st ok" }, "🏷️ " + t.attached)
            : h("span", { class: "st" }, offers.length ? `${offers.length} ${offers.length > 1 ? t.offers : t.offer1}` : t.none)),
        !offers.length ? null : asRows ? h("div", { class: "orows" }, offers.map((o, i) => this._offerRow(it, o, i === 0 && offers.length > 1, low.has(o.id))))
          : h("div", { class: "prices" }, offers.map((o, i) => this._priceChip(it, o, i === 0 && offers.length > 1, low.has(o.id)))));
    };
    // Tabelle Artikel × Märkte – nur in der Ansicht „Preise nebeneinander“. Früher schaltete eine breite Karte von
    // selbst darauf um; dann sah dieselbe Ansicht schmal anders aus (mit Bildern) als breit (ohne).
    const mstores = cover.map(([s]) => s);
    const mx = h("div", { class: `mx ${asTable && mstores.length ? "force" : ""}`,
      style: `grid-template-columns:minmax(84px,1.6fr) repeat(${mstores.length}, minmax(84px,1fr));max-width:${this._tableMax(mstores.length)}` },
      h("div", { class: "hd l" }, t.item), mstores.map((s) => h("div", { class: "hd" }, this._storeBadge(this._all.find((o) => o.store === s)))),
      rows.filter((r) => r.offers.length || !c.hide_without_offer).map((r) => [h("div", { class: "l" }, r.it.name || r.it.text),
        mstores.map((s) => { const o = r.offers.find((x) => x.store === s), low = r.low || (r.low = this._unitLow(r.offers));
          if (!o) return h("div", { class: "na" }, "–");
          const sel = this._sel[r.it.uid] && this._sel[r.it.uid].id === o.id;
          return h("div", { class: `cell ${r.offers[0].id === o.id && r.offers.length > 1 ? "best" : ""} ${sel ? "sel" : ""}`, title: o.name, role: "button", tabindex: "0",
            onclick: () => { if (sel) delete this._sel[r.it.uid]; else this._sel[r.it.uid] = o; this._render(); } },
            h("span", { class: "cp" }, r.offers[0].id === o.id && r.offers.length > 1 ? "★ " : "", this._pr(o)), this._unitEl(o, low.has(o.id))); })]));
    const chosen = Object.entries(this._sel).filter(([uid]) => items.some((i) => i.uid === uid));
    const total = chosen.reduce((a, [, o]) => a + o.price, 0);
    const sum = h("div", { class: "sum" }, h("div", {}, chosen.length ? t.chosen.replace("{n}", chosen.length) : t.pick_hint,
      chosen.length ? h("small", {}, `${t.sum} ${this._money(total)} · ${[...new Set(chosen.map(([, o]) => o.store))].join(", ")}`) : null),
      h("span", { class: "sp" }), chosen.length && this._may("rename") ? h("button", { type: "button", class: "btn pri", onclick: (e) => this._apply(chosen, e.currentTarget) }, t.apply) : null);
    const same = (i) => `${norm(this._withCount(i.text, 1)).replace(/\s+/g, " ").trim()}|${String(i.note || "").trim()}`;
    const groups = Object.values(items.reduce((a, i) => { const k = same(i); if (i.name) (a[k] = a[k] || []).push(i); return a; }, {})).filter((g) => g.length > 1);
    const dupBox = groups.length && !this._dupLater && this._may("rename") && this._may("delete") ? groups.slice(0, 3).map((g) => h("div", { class: "expbox", role: "status" }, h("b", {}, "🧹 " + t.dup_n.replace("{name}", g[0].name).replace("{n}", g.length)),
      h("span", { class: "sp" }), h("button", { type: "button", class: "btn", onclick: () => { this._dupLater = true; this._render(); } }, t.exp_later),
      h("button", { type: "button", class: "btn pri", onclick: (e) => this._merge(g, e.currentTarget) }, t.dup_merge))) : null;
    const old = items.filter((i) => this._expiredNote(i.note));
    const expBox = old.length && !this._expLater && this._may("rename") ? h("div", { class: "expbox", role: "status" }, h("b", {}, "🏷️ " + t.exp_n.replace("{n}", old.length)), h("small", {}, old.slice(0, 3).map((i) => i.name || i.text).join(", ")),
      h("span", { class: "sp" }), h("button", { type: "button", class: "btn", onclick: () => { this._expLater = true; this._render(); } }, t.exp_later),
      h("button", { type: "button", class: "btn pri", onclick: (e) => this._clearExpired(e.currentTarget) }, t.exp_remove)) : null;
    const ro = this._may("add") && this._may("rename") ? null : h("div", { class: "foot", role: "status" }, "🔒 " + t.read_only);
    return h("div", {}, ro, this._stagedBox(), expBox, dupBox, plan, basket, soonBox, mx, h("div", { class: "rows" }, rows.map(line)), sum, this._foot());
  }
  _renderAll(stores) {
    const t = this._t, c = this._config;
    const byCat = this._group === "category";
    const names = (this._items || []).map((i) => i.name).filter(Boolean);
    const onList = (o) => names.some((n) => matches(n, o.name, c.match));
    const q = norm(this._query);
    // gibt es Angebote, die erst später gelten (Prospekt der nächsten Woche)? Dann oben umschaltbar
    const soonFrom = this._next.length ? this._next.map((o) => o.from).sort()[0] : null;
    if (!soonFrom) this._when = "now";
    const pool = this._when === "next" ? this._next : this._all;
    const whenSel = soonFrom ? h("div", { class: "catbar when" }, [["now", t.w_now, this._all.length], ["next", t.w_next.replace("{date}", this._day(soonFrom)), this._next.length]].map(([v, label, n]) =>
      h("button", { type: "button", class: `chip ${(this._when || "now") === v ? "on" : ""}`, "aria-pressed": String((this._when || "now") === v),
        onclick: () => { this._when = v; this._cat = ""; this._render(); } }, label, h("small", {}, ` ${n}`)))) : null;
    const shown = pool.filter((o) => (!q || norm(`${o.name} ${o.brand} ${o.category} ${this._catOf(o)} ${o.store}`).includes(q)) && (!this._cat || this._catOf(o) === this._cat));
    const search = h("input", { class: "search", type: "search", placeholder: t.search, "aria-label": t.search, value: this._query });
    // Tippen: nicht die ganze Karte neu zeichnen – kurz warten und nur die Treffer unter dem Suchfeld ersetzen
    // (das Feld selbst bleibt stehen, Cursor und Bildschirmtastatur bleiben, wo sie sind)
    search.addEventListener("input", () => {
      this._query = search.value;
      clearTimeout(this._qTimer);
      this._qTimer = setTimeout(() => {
        const host = search.closest(".filters") && search.closest(".filters").parentNode;
        if (!host || !host.isConnected) return;
        const fresh = this._renderAll(stores);
        while (host.children.length > 1) host.lastChild.remove();
        [...fresh.children].slice(1).forEach((el) => host.append(el));
      }, 140);
    });
    // Kategorien zum Antippen mit Anzahl: die größten zuerst, der Rest hinter „+N mehr“ – umbrechend, kein Scrollbalken
    const catKey = (o) => this._catOf(o);
    const counts = pool.reduce((a, o) => { const k = catKey(o); if (k) a[k] = (a[k] || 0) + 1; return a; }, {});
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const FIRST = 5, visible = this._allCats ? ranked : [...new Set([...ranked.slice(0, FIRST), ...(this._cat ? [this._cat] : [])])];
    const cchip = (key, label, n) => h("button", { type: "button", class: `chip ${this._cat === key ? "on" : ""}`, "aria-pressed": String(this._cat === key),
      onclick: () => { this._cat = this._cat === key ? "" : key; this._render(); } }, label, h("small", {}, ` ${n}`));
    const catSel = ranked.length > 1 ? h("div", { class: "catbar" }, cchip("", t.all, pool.length), visible.map((k) => cchip(k, k, counts[k])),
      ranked.length > visible.length || this._allCats ? h("button", { type: "button", class: "chip more", onclick: () => { this._allCats = !this._allCats; this._render(); } },
        this._allCats ? t.less : t.more_n.replace("{n}", ranked.length - visible.length)) : null) : null;
    const tile = (o) => {
      const got = this._onListCount(o), mine = !got && onList(o);
      // steht genau dieses Angebot schon auf der Liste: Bild grün abgedunkelt, Haken darüber, Anzahl unten rechts
      return h("div", { class: `tl ${got ? "got" : ""}`, title: got ? `${o.name} – ${t.on_n.replace("{n}", got)}` : o.name }, o.pct ? h("span", { class: "pctb" }, `−${o.pct}%`) : null, mine ? h("span", { class: "on", title: t.on_list }, "📝") : null,
        c.show_images ? h("div", { class: "img", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}")` : "background:none" },
          got ? [h("span", { class: "gotck", "aria-hidden": "true" }, "✓"), h("span", { class: "gotn" }, `${got}×`)] : null) : null,
        h("div", { class: "t" }, !c.show_images && got ? h("span", { class: "gott" }, "✓ ") : null, o.name), byCat ? h("div", { class: "x" }, this._storeBadge(o)) : null, h("div", {}, h("b", {}, this._pr(o)), o.old ? h("s", { style: "margin-left:4px;font-size:.7rem;opacity:.7" }, this._money(o.old)) : null),
        h("div", { class: "x" }, [c.show_unit_price ? this._unitLabel(o) : "", this._valid(o), this._trendText(o)].filter(Boolean).join(" · ") || " "),
        this._addCtl(o, true));
    };
    // Listen-Darstellung: kleine Bilder, eine Zeile je Angebot
    const row = (o) => {
      const got = this._onListCount(o), mine = !got && onList(o);
      const sub = [c.show_unit_price ? this._unitLabel(o) : "", this._valid(o), byCat ? "" : this._ownCat(o)].filter(Boolean).join(" · ");
      return h("div", { class: `lrow ${got ? "got" : ""}`, title: o.name },
        c.show_images ? h("div", { class: "thumb", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image || got ? null : "🏷️",
          got ? h("span", { class: "gotck", "aria-hidden": "true" }, "✓") : null) : null,
        h("div", { class: "n" }, mine ? h("span", { title: t.on_list }, "📝 ") : null, o.name,
          sub || byCat || got ? h("small", {}, got ? h("b", { class: "gott" }, `✓ ${t.on_n.replace("{n}", got)}${sub || byCat ? " · " : ""}`) : null, byCat ? [this._storeBadge(o), " "] : null, sub) : null),
        h("div", { class: "pr" }, h("b", {}, this._pr(o)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null, this._trendEl(o)),
        this._slot(o));
    };
    const asList = this._view === "list";
    const toggle = h("button", { type: "button", class: "btn vbtn", title: asList ? t.v_tiles : t.v_list, "aria-label": asList ? t.v_tiles : t.v_list,
      onclick: () => { this._view = asList ? "tiles" : "list"; try { localStorage.setItem(this._memKey("view"), this._view); } catch (e) { /* */ } this._render(); } }, asList ? "▦" : "☰");
    const gbtn = h("button", { type: "button", class: "btn vbtn", title: `${t.e_group}: ${byCat ? t.g_store : t.g_cat}`, "aria-label": `${t.e_group}: ${byCat ? t.g_store : t.g_cat}`,
      onclick: async () => { this._group = byCat ? "store" : "category"; this._cat = ""; this._open.clear(); try { localStorage.setItem(this._memKey("group"), this._group); } catch (e) { /* */ }
        await this._loadCats(); this._render(); } }, byCat ? "🏬" : "🗂️");
    // Gruppen: je Markt (Standard) oder je Kategorie – dann in der Reihenfolge der Einkaufs-Kategorien, sonst nach Namen
    const order = this._catMap && this._catOrder ? this._catOrder : [];
    const keys = byCat ? [...new Set(shown.map((o) => this._catOf(o)))].sort((a, b) => ((order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999)) || a.localeCompare(b)) : stores;
    const shelves = keys.map((s) => {
      const all = shown.filter((o) => (byCat ? this._catOf(o) === s : o.store === s));
      if (!all.length) return null;
      // Angebote für die eigene Liste zuerst
      const sorted = [...all.filter(onList), ...all.filter((o) => !onList(o))];
      const open = this._open.has(s) || !!q || !!this._cat;
      const lim = Math.min(20, Math.max(1, Number(c.max_per_store) || 10));  // höchstens 20 je Markt, der Rest hinter „alle →“
      const list = open ? sorted : sorted.slice(0, lim);
      if (byCat) {
        // nach Kategorie: Überschrift zum Auf- und Zuklappen, mit den Märkten als Punkte
        // Standard: aufgeklappt (categories_open: false = zugeklappt); Antippen kehrt es für diese Kategorie um
        const shut = ((c.categories_open === false) !== this._closed.has(s)) && !q && !this._cat;
        const dots = [...new Map(all.map((o) => [o.store, o.color])).entries()].map(([st, col]) => h("span", { class: "dot", title: st, style: `background:${col}` }));
        return h("div", { class: `shelf fold ${shut ? "" : "open"}` },
          h("button", { type: "button", class: "foldh", "aria-expanded": String(!shut), onclick: () => { if (this._closed.has(s)) this._closed.delete(s); else this._closed.add(s); this._render(); } },
            h("b", {}, s), h("span", { class: "sp" }), dots, h("small", {}, `${all.length} ${all.length > 1 ? t.offers : t.offer1}`), h("span", { class: "chev" }, "›")),
          shut ? null : asList ? h("div", { class: "lrows" }, sorted.map(row)) : h("div", { class: "rail open" }, sorted.map(tile)));
      }
      return h("div", { class: "shelf" }, h("h4", {}, this._storeBadge(all[0]), h("small", {}, `${all.length} ${t.offers}`), h("span", { class: "sp" }),
        all.length > lim && !q && !this._cat ? h("button", { type: "button", onclick: () => { if (open) this._open.delete(s); else this._open.add(s); this._render(); } }, open ? t.less : `${t.all} →`) : null),
        asList ? h("div", { class: "lrows" }, list.map(row)) : h("div", { class: `rail ${open || c.tile_flow !== "scroll" ? "open" : ""}` }, list.map(tile)));  // Standard: Raster von oben nach unten; "scroll" = eine Zeile zum Wischen
    });
    return h("div", {}, h("div", { class: "filters" }, search, this._locked("group_by") ? null : gbtn, this._locked("all_view") ? null : toggle), whenSel, catSel, shown.length ? shelves : h("div", { class: "msg" }, t.no_hits), this._foot());
  }
  _foot() {
    const ts = this._sources().map((s) => this._hass.states[s.entity].last_updated).filter(Boolean).sort().pop();
    let when = "";
    try { when = ts ? new Date(ts).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" }) : ""; } catch (e) { /* */ }
    return h("div", { class: "foot" }, this._addPick(), when ? `${this._t.stand} ${when}` : "");
  }
  // Ziel für neue Artikel: Wahl dieses Benutzers in der Karte (nur eigene Quell-Listen der kombinierten Liste, je
  // Benutzer und Browser gemerkt) → sonst "add_to" der Karte → sonst die Liste selbst (deren Standard-Liste)
  // Gemerkte Ansicht je Karte, nicht je Browser: zwei Karten auf einem Dashboard (z. B. „nur REWE“ und „nur ALDI“)
  // verstellen sich sonst gegenseitig. Kennung = was die Karte ausmacht (Liste, Titel, Märkte, Sensoren).
  _memKey(name) {
    const c = this._config, id = JSON.stringify([c.list, c.title, c.stores, c.entities, c.sources, c.tabs]);
    let hsh = 0;
    for (let i = 0; i < id.length; i++) hsh = (hsh * 31 + id.charCodeAt(i)) | 0;
    return `smartdiscounts:${(hsh >>> 0).toString(36)}:${name}`;
  }
  _locked(k) { const l = this._config.locked; return l === true || (Array.isArray(l) && l.includes(k)); }
  _addKey() { return `smartdiscounts-addto:${(this._hass.user && this._hass.user.id) || ""}:${this._config.list}`; }
  _addTarget() {
    const mine = this._mine || [];
    let own = this._addOwn || "";  // ohne Browser-Speicher (privates Fenster) gilt die Wahl, solange die Karte offen ist
    try { own = localStorage.getItem(this._addKey()) || own; } catch (e) { /* */ }
    if (own && !this._locked("add_to") && mine.some((m) => m.id === own)) return own;
    return this._config.add_to || this._config.list;
  }
  _addPick() {
    const mine = this._mine || [];
    if (!mine.length || !this._may("add") || this._locked("add_to")) return null;
    const cur = this._addTarget(), t = this._t;
    const opts = [{ id: this._config.list, name: t.add_std }, ...mine];
    if (!opts.some((o) => o.id === cur)) opts.push({ id: cur, name: (this._hass.states[cur] && this._hass.states[cur].attributes.friendly_name) || cur });
    const sel = h("select", { class: "addsel", "aria-label": t.add_in, onchange: (e) => {
      this._addOwn = e.target.value === (this._config.add_to || this._config.list) ? "" : e.target.value;
      try { if (e.target.value === (this._config.add_to || this._config.list)) localStorage.removeItem(this._addKey()); else localStorage.setItem(this._addKey(), e.target.value); } catch (err) { /* */ }
      this._render(); } },
      opts.map((o) => { const el = h("option", { value: o.id }, o.name); if (o.id === cur) el.selected = true; return el; }));
    return h("label", { class: "addpick" }, `＋ ${t.add_in} `, sel);
  }
  // Mit SmartLists: Angebot als ⚙OFFER-Zeile an den Artikel (wird dort als Badge mit Markt, Preis, „bis“ gezeigt).
  // Ohne SmartLists: lesbarer Text in der Beschreibung des Eintrags.
  _offerNote(o) {
    const smart = (this._hass.config.components || []).includes("smartlists");
    // c = Warengruppe laut Markt: SmartLists (ab 4.0.0-beta.15) ordnet den Artikel danach ein, wenn der Name in die Irre führt
    // b/bk = Bonus-Aktion (Guthaben in der App des Markts, kein niedrigerer Preis): SmartLists zeigt dann „🎁 Bonus“ statt „Angebot“
    const bonus = o.bonus ? { b: o.bonus.value, ...(o.bonus.kind === "pct" ? { bk: "pct" } : {}) } : {};
    if (smart) return `⚙OFFER:${JSON.stringify({ s: o.store, p: o.full ?? o.price, ...(o.old ? { o: o.old } : {}), ...(o.until ? { e: o.until } : {}), ...(o.category ? { c: String(o.category).slice(0, 60) } : {}), ...bonus, a: Math.floor(Date.now() / 1000) })}`;
    // Datum mit Jahr, damit sich ein abgelaufenes Angebot später erkennen lässt
    const extra = o.bonus ? ` · 🎁 ${this._t.bonus_label.replace("{amount}", o.bonus.kind === "pct" ? `${o.bonus.value} %` : this._money(o.bonus.value)).replace("{store}", o.store)}` : "";
    return `🏷️ ${o.store} · ${this._money(o.full ?? o.price)}${extra}${o.until ? ` · ${this._t.until} ${this._day(o.until)}${String(o.until).slice(0, 4)}` : ""} · ${o.name}`;
  }
  // Ist das an den Eintrag geschriebene Angebot abgelaufen? (⚙OFFER-Zeile von SmartLists oder die lesbare 🏷️-Zeile)
  _expiredNote(note) {
    const today = new Date().toISOString().slice(0, 10);
    for (const l of String(note || "").split("\n")) {
      const j = l.match(/[⚙\u2699]\ufe0f?\s*OFFER\s*:\s*(\{.*\})/);
      if (j) { try { const e = String(JSON.parse(j[1]).e || "").slice(0, 10); if (e && e < today) return true; } catch (e) { /* */ } }
      const d = /^\s*🏷️/.test(l) && l.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (d && `${d[3]}-${d[2]}-${d[1]}` < today) return true;
    }
    return false;
  }
  async _clearExpired(btn) {
    btn.disabled = true;
    try {
      if ((this._hass.config.components || []).includes("smartlists")) await this._hass.callWS({ type: "smartlists/clear_expired_offers", entity_id: this._config.list });
      else for (const it of this._items.filter((i) => this._expiredNote(i.note)))
        await this._hass.callService("todo", "update_item", { item: it.uid, description: this._cleanNote(it.note) }, { entity_id: this._config.list });
      this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  _cleanNote(note) { return String(note || "").split("\n").filter((l) => !/^\s*([⚙⚙]️?\s*OFFER\s*:|🏷️)/.test(l)).join("\n").trim(); }
  async _apply(chosen, btn) {
    btn.disabled = true;
    try {
      for (const [uid, o] of chosen) {
        const it = this._items.find((i) => i.uid === uid);
        const note = [this._cleanNote(it && it.note), this._offerNote(o)].filter(Boolean).join("\n");
        await this._hass.callService("todo", "update_item", { item: uid, description: note }, { entity_id: this._config.list });
      }
      this._sel = {}; this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  // Anzahl im Text eines Eintrags: "2x Bio Orangen" oder "Bio Orangen 2" (so schreibt es SmartLists)
  _smart() { return (this._hass.config.components || []).includes("smartlists"); }
  // Zahl am Ende („Butter 2“) nur mit SmartLists als Anzahl lesen – sonst kann sie zum Namen gehören („Cola Zero 4“)
  _countOf(text) { const a = String(text).match(/^\s*(\d{1,3})\s?[x×]\s+\S/i), b = this._smart() && String(text).match(/\s(\d{1,3})\s*$/); return a ? +a[1] : b ? +b[1] : 1; }
  _withCount(text, n) {
    let bare = String(text).replace(/^\s*\d{1,3}\s?[x×]\s+(?=\S)/i, "");
    if (this._smart()) bare = bare.replace(/\s\d{1,3}\s*$/, "");
    bare = bare.trim();
    return n > 1 ? `${n}x ${bare}` : bare;
  }
  // Einträge der Liste, die dasselbe meinen wie dieses Angebot (gleicher Name ohne Menge und Zeichen)
  // Vergleichs-Schlüssel eines Eintrags: Text ohne Anzahl und ohne @Markt/#Schlagwort/*Person – die Größe zählt mit
  // („Coca-Cola 1,5 l“ ist nicht „Coca-Cola 2 l“, und „Butter“ ist nicht „Landliebe Butter“).
  _key(text) { return norm(this._withCount(String(text || "").split(/\s+/).filter((w) => w && !/^[@#*!+~]/.test(w)).join(" "), 1)).replace(/\s+/g, " ").trim(); }
  _same(o) { const key = this._key(o.name); return key ? (this._items || []).filter((i) => this._key(i.text) === key) : []; }
  _onListCount(o) { return this._same(o).reduce((a, i) => a + this._countOf(i.text), 0); }
  // ＋/− zählen sofort (in der Karte), geschrieben wird danach im Hintergrund; danach nur die Einträge neu holen
  async _step(o, delta, btn) {
    const it = this._same(o)[0];
    if (!it) return this._add(o, btn);
    if (String(it.uid).startsWith("tmp-")) return;  // gerade erst hinzugefügt – kurz warten, bis Home Assistant es kennt
    const n = this._countOf(it.text) + delta, before = it.text;
    if (n <= 0) this._items = this._items.filter((x) => x !== it); else { it.text = this._withCount(it.text, n); it.name = itemName(it.text); }
    this._render();
    try {
      if (n <= 0) await this._hass.callService("todo", "remove_item", { item: it.uid }, { entity_id: this._config.list });
      else await this._hass.callService("todo", "update_item", { item: it.uid, rename: this._withCount(before, n) }, { entity_id: this._config.list });
      this._sig = null; await this._loadList(true); this._render();
    } catch (e) { await this._loadList(true); this._render(); this._toastErr(e); }
  }
  _toastErr(e) { this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message: (e && e.message) || this._t.error }, bubbles: true, composed: true })); }
  // Breite der Tabelle „Märkte als Spalten“: wächst mit der Karte bis zu einer Grenze. `table_max_width` (in px) setzt
  // sie selbst, 0 = keine Grenze (immer die ganze Breite).
  _tableMax(stores) {
    const own = this._config.table_max_width;
    if (own !== undefined && own !== null && own !== "" && Number.isFinite(Number(own))) return Number(own) > 0 ? `${Number(own)}px` : "none";
    return `${760 + stores * 260}px`;
  }
  // Listenansicht: in jeder Zeile derselbe Zähler (− 0 +), bei 0 nur blasser – so steht alles in einer Flucht
  // und nichts springt, wenn ein Artikel auf die Liste kommt
  _slot(o) {
    const t = this._t, n = this._onListCount(o);
    if (!this._config.list || !this._may("add")) return null;  // ohne Recht zum Hinzufügen: nur ansehen
    if (!n && this._collect()) return this._stageBtn(o, false);
    return h("span", { class: `stepper slot ${n ? "" : "zero"}`, title: n ? t.on_n.replace("{n}", n) : t.add },
      h("button", { type: "button", "aria-label": `− ${o.name}`, disabled: n ? null : "", onclick: (e) => this._step(o, -1, e.currentTarget) }, "−"),
      h("b", {}, String(n)),
      h("button", { type: "button", "aria-label": `${n ? "+" : t.add + ":"} ${o.name}`, onclick: (e) => (n ? this._step(o, 1, e.currentTarget) : this._add(o, e.currentTarget)) }, "+"));
  }
  // ＋ oder – steht der Artikel schon auf der Liste – ein Zähler (− 2× +)
  _addCtl(o, wide) {
    const t = this._t, n = this._onListCount(o);
    if (!this._config.list || !this._may("add")) return null;  // ohne Recht zum Hinzufügen: nur ansehen
    if (!n && this._collect()) return this._stageBtn(o, wide);
    if (!n) return h("button", { type: "button", class: wide ? "btn" : "btn plus", title: t.add, "aria-label": `${t.add}: ${o.name}`, onclick: (e) => this._add(o, e.currentTarget) }, wide ? "＋ " + t.add : "＋");
    return h("span", { class: "stepper", title: t.on_n.replace("{n}", n) },
      h("button", { type: "button", "aria-label": `− ${o.name}`, onclick: (e) => this._step(o, -1, e.currentTarget) }, "−"), h("b", {}, `${n}×`),
      h("button", { type: "button", "aria-label": `+ ${o.name}`, onclick: (e) => this._step(o, 1, e.currentTarget) }, "+"));
  }
  // Doppelte Einträge zu einem zusammenfassen (Summe der Anzahl, Notiz des ersten bleibt)
  async _merge(group, btn) {
    btn.disabled = true;
    try {
      const total = group.reduce((a, i) => a + this._countOf(i.text), 0);
      await this._hass.callService("todo", "update_item", { item: group[0].uid, rename: this._withCount(group[0].text, total) }, { entity_id: this._config.list });
      await this._hass.callService("todo", "remove_item", { item: group.slice(1).map((i) => i.uid) }, { entity_id: this._config.list });
      this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  // Sammeln geht nur, wenn es den Reiter „Meine Liste“ gibt – sonst wie gewohnt direkt auf die Liste
  _collect() { return LIST_TAB && !!this._config.collect_first && this._tabs().includes("list"); }
  _stagedIdx(o) { return this._staged.findIndex((x) => x.store === o.store && x.name === o.name); }
  _saveStaged() { try { localStorage.setItem(this._memKey("staged"), JSON.stringify(this._staged)); } catch (e) { /* */ } }
  _toggleStaged(o) {
    const i = this._stagedIdx(o);
    if (i >= 0) this._staged.splice(i, 1);
    else this._staged.push({ name: o.name, store: o.store, color: o.color, price: o.price, full: o.full, old: o.old, until: o.until, category: o.category, bonus: o.bonus });
    this._saveStaged(); this._render();
  }
  // Knopf in „Alle Angebote“, wenn gesammelt wird: ＋ merkt vor, ✓ nimmt wieder heraus
  _stageBtn(o, wide) {
    const t = this._t, on = this._stagedIdx(o) >= 0;
    return h("button", { type: "button", class: `${wide ? "btn" : "btn plus"} ${on ? "pri" : ""}`, title: on ? t.st_on : t.st_add, "aria-pressed": String(on),
      "aria-label": `${on ? t.st_on : t.st_add}: ${o.name}`, onclick: () => this._toggleStaged(o) }, on ? (wide ? "✓ " + t.st_on : "✓") : (wide ? "＋ " + t.st_add : "＋"));
  }
  // Kasten oben in „Meine Liste“: was vorgemerkt ist, und alles auf einmal auf die Liste
  _stagedBox() {
    const t = this._t;
    if (!this._collect() || !this._staged.length) return null;
    const sum = this._staged.reduce((a, o) => a + (o.full ?? o.price ?? 0), 0);
    return h("div", { class: "staged" },
      h("div", { class: "bh" }, `🛒 ${t.st_title} · ${this._staged.length}`, h("span", { class: "sp" }), h("b", {}, this._money(sum))),
      this._staged.map((o) => h("div", { class: "strow" },
        h("span", { class: "store", style: `background:${o.color || "#888"}` }, o.store), h("span", { class: "n" }, o.name),
        h("span", { class: "p" }, this._money(o.full ?? o.price)),
        h("button", { type: "button", class: "btn plus", title: t.exp_remove, "aria-label": `${t.exp_remove}: ${o.name}`, onclick: () => this._toggleStaged(o) }, "✕"))),
      h("div", { class: "acts" },
        h("button", { type: "button", class: "btn", onclick: () => { this._staged = []; this._saveStaged(); this._render(); } }, t.st_clear),
        this._may("add") ? h("button", { type: "button", class: "btn pri", onclick: (e) => this._addStaged(e.currentTarget) }, "＋ " + t.st_apply) : null));
  }
  async _addStaged(btn) {
    btn.disabled = true;
    try {
      for (const o of this._staged.slice()) {
        await this._hass.callService("todo", "add_item", { item: o.name, description: this._offerNote(o) }, { entity_id: this._addTarget() });
        this._staged.splice(this._stagedIdx(o), 1); this._saveStaged();
      }
      this._sig = null; await this._loadList(); this._render();
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  async _add(o, btn) {
    // sofort als „1“ zählen (vorläufiger Eintrag), dann im Hintergrund schreiben
    const note = this._offerNote(o);
    if (this._addTarget() === this._config.list) {
      this._items = [...(this._items || []), { uid: `tmp-${Date.now()}`, text: o.name, note, name: itemName(o.name) }];
      this._render();
    } else if (btn) btn.disabled = true;
    try {
      // "add_to": in diese Liste hinzufügen (z. B. die eigene Quell-Liste einer kombinierten Liste) – sonst in "list"
      await this._hass.callService("todo", "add_item", { item: o.name, description: note }, { entity_id: this._addTarget() });
      this._sig = null; await this._loadList(true); this._render();
    } catch (e) { await this._loadList(true); this._render(); this._toastErr(e); }
  }
}

