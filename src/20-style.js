const STYLE = `
  :host { display:block; --sd-accent: var(--smartdiscounts-accent, var(--primary-color)); --sd-q: var(--smartlists-qty-color, #e39a1c); --sd-ok: var(--success-color, #43a047); }
  ha-card { display:block; padding:14px 12px 12px; border-radius: var(--ha-card-border-radius, 12px); }
  .wrap { container-type:inline-size; }
  [hidden] { display:none !important; }
  .head { display:flex; align-items:center; gap:8px; padding:0 4px 6px; }
  .head h1 { margin:0; font-size:1.25rem; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .head small { color:var(--secondary-text-color); font-size:.78rem; white-space:nowrap; }
  .tabs { display:flex; border-bottom:1px solid var(--divider-color,#ddd); margin-bottom:10px; }
  .tabs button { flex:1; background:none; border:0; border-bottom:2px solid transparent; color:var(--secondary-text-color); font:inherit; font-size:.9rem; padding:8px 4px; cursor:pointer; }
  .tabs button.on { color:var(--sd-accent); border-color:var(--sd-accent); font-weight:600; }
  .msg { padding:18px 10px; text-align:center; color:var(--secondary-text-color); font-size:.9rem; }
  .plan { border-radius:12px; padding:10px 12px; background:color-mix(in srgb, var(--sd-ok) 12%, transparent); border:1px solid color-mix(in srgb, var(--sd-ok) 35%, transparent); }
  .plan b { font-size:.95rem; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .chip { border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff); color:var(--primary-text-color); border-radius:14px; padding:3px 10px; font:inherit; font-size:.8rem; cursor:pointer; display:inline-flex; gap:6px; align-items:center; }
  .chip.on { border-color:var(--sd-ok); color:var(--sd-ok); font-weight:600; }
  .dot { width:9px; height:9px; border-radius:50%; flex:none; }
  .store { font-size:.68rem; font-weight:800; padding:0 6px; border-radius:4px; color:#fff; white-space:nowrap; }
  .it { padding:9px 2px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .it:last-child { border-bottom:0; }
  .it .top { display:flex; align-items:center; gap:8px; }
  .thumb { width:40px; height:40px; border-radius:10px; background:var(--secondary-background-color,#f2f2f2) center/contain no-repeat; flex:none; display:grid; place-items:center; font-size:1.1rem; }
  .it .n { flex:1; min-width:0; font-weight:500; overflow-wrap:anywhere; }
  .it .n small { display:block; color:var(--secondary-text-color); font-weight:400; font-size:.76rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .it .st { color:var(--secondary-text-color); font-size:.76rem; white-space:nowrap; }
  .it .st.ok { color:var(--sd-ok); font-weight:700; }
  .prices { display:flex; gap:6px; overflow-x:auto; padding:7px 0 1px; scrollbar-width:none; margin-left:48px; }
  .noimg .prices { margin-left:0; }
  .pc { flex:none; border:1px solid var(--divider-color,#ddd); background:var(--secondary-background-color,#f6f6f6); border-radius:10px; padding:4px 9px; cursor:pointer; text-align:left; font:inherit; color:var(--primary-text-color); min-width:84px; max-width:170px; }
  .pc .s { font-size:.66rem; font-weight:800; display:flex; gap:4px; align-items:center; }
  .pc b { font-size:.95rem; font-variant-numeric:tabular-nums; } .pc s { color:var(--secondary-text-color); font-size:.7rem; margin-left:4px; }
  .pc .x { color:var(--secondary-text-color); font-size:.68rem; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pc.best { border-color:var(--sd-ok); background:color-mix(in srgb, var(--sd-ok) 12%, transparent); }
  .pc.sel { border-color:var(--sd-accent); box-shadow:0 0 0 1px var(--sd-accent) inset; }
  .pc .star { color:var(--sd-ok); margin-left:auto; }
  .u { display:block; color:var(--secondary-text-color); font-size:.7rem; font-weight:400; font-variant-numeric:tabular-nums; white-space:nowrap; line-height:1.25; }
  .u b, .orow .pr .u b, .lrow .pr .u b { display:inline; color:var(--primary-text-color); font-weight:500; font-size:inherit; } .u.low, .u.low b, .orow .pr .u.low b { color:var(--sd-ok); }
  .mx .cell { flex-direction:column; align-items:flex-end; justify-content:center; gap:0; } .mx .cp { white-space:nowrap; }
  .pc .pct { color:var(--error-color,#db4437); font-weight:800; }
  .withbonus { color:var(--warning-color,#e65100); font-weight:600; }
  .bonus { display:inline-block; font-size:.7rem; font-weight:700; padding:0 6px; border-radius:6px; border:1px dashed var(--warning-color,#ff9800); color:var(--warning-color,#e65100); white-space:nowrap; }
  .tl .pctb { position:absolute; left:6px; top:6px; background:var(--error-color,#db4437); color:#fff; font-size:.66rem; font-weight:800; padding:0 5px; border-radius:7px; z-index:1; }
  .sum { margin-top:10px; padding:10px 12px; background:var(--secondary-background-color,#f6f6f6); border-radius:12px; display:flex; align-items:center; gap:10px; font-size:.86rem; flex-wrap:wrap; }
  .sum small { display:block; color:var(--secondary-text-color); font-size:.76rem; } .sum .sp { flex:1; }
  .btn { border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff); color:var(--sd-accent); border-radius:9px; padding:6px 12px; font:inherit; font-size:.82rem; cursor:pointer; white-space:nowrap; }
  .btn.pri { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--text-primary-color,#fff); font-weight:600; }
  .btn.done { color:var(--sd-ok); border-color:color-mix(in srgb, var(--sd-ok) 50%, transparent); }
  input.search, select.search, select.cat { width:100%; box-sizing:border-box; height:40px; border-radius:10px; border:1px solid transparent; background:var(--secondary-background-color,#f2f2f2); color:var(--primary-text-color); padding:0 12px; font:inherit; }
  .filters { display:flex; gap:8px; flex-wrap:wrap; }
  .filters.one { flex-wrap:nowrap; align-items:center; margin-bottom:6px; } .filters.one .search { flex:1 1 0 !important; min-width:0; }
  .filters .search { flex:1 1 180px; width:auto; } .filters .cat { flex:1 1 140px; width:auto; max-width:220px; }
  .vbtn { width:40px; height:40px; padding:0; font-size:1.1rem; flex:none; color:var(--primary-text-color); }
  @container (max-width: 480px) { .filters .search { flex-basis:100%; } .filters .cat { max-width:none; flex:1 1 0; } }
  .lrow { display:flex; align-items:center; gap:10px; padding:7px 2px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow:last-child { border-bottom:0; }
  .lrow .n { flex:1; min-width:0; font-size:.9rem; overflow-wrap:anywhere; }
  .lrow .n small { display:block; color:var(--secondary-text-color); font-size:.74rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* Listenansicht: Preis in fester Spalte, daneben in jeder Zeile derselbe Zähler (bei 0 blass) – nichts springt */
  .lrow .pr { width:74px; flex:none; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .lrow .stepper.slot { flex:none; }
  .lrow .stepper.zero { border-color:var(--divider-color,#ccc); background:none; }
  .lrow .stepper.zero b { color:var(--secondary-text-color); font-weight:500; opacity:.7; }
  .lrow .stepper.zero button { color:var(--sd-accent); }
  .lrow .stepper.zero button:disabled { opacity:.3; cursor:default; }
  .lrow .pr b { display:block; } .lrow .pr s { color:var(--secondary-text-color); font-size:.72rem; }
  .lrow .pr .pct { color:var(--error-color,#db4437); font-weight:800; font-size:.72rem; margin-left:4px; }
  .lrow .plus { width:34px; height:34px; padding:0; font-size:1.1rem; flex:none; }
  .expbox { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; padding:9px 12px; border-radius:12px; font-size:.86rem;
    background:color-mix(in srgb, var(--warning-color,#ff9800) 14%, transparent); border:1px solid color-mix(in srgb, var(--warning-color,#ff9800) 40%, transparent); }
  .expbox small { color:var(--secondary-text-color); } .expbox .sp { flex:1; }
  .plan .ph { display:flex; align-items:center; gap:8px; } .plan .ph b { flex:1; }
  .vbtn.sm { width:32px; height:32px; font-size:.95rem; }
  .orows { display:flex; flex-direction:column; gap:4px; margin-top:6px; }
  .orow { display:flex; align-items:center; gap:10px; width:100%; text-align:left; font:inherit; color:var(--primary-text-color); cursor:pointer; padding:6px 8px; box-sizing:border-box;
    border:1px solid var(--divider-color,#ddd); border-radius:10px; background:var(--secondary-background-color,#f6f6f6); }
  .orow.best { border-color:color-mix(in srgb, var(--sd-ok) 60%, transparent); }
  .orow.sel { border-color:var(--sd-accent); box-shadow:0 0 0 1px var(--sd-accent) inset; }
  .orow .radio { width:18px; height:18px; border-radius:50%; border:2px solid var(--secondary-text-color); flex:none; display:grid; place-items:center; font-size:.7rem; color:var(--text-primary-color,#fff); box-sizing:border-box; }
  .orow .radio.on { background:var(--sd-accent); border-color:var(--sd-accent); }
  .thumb.sm { width:34px; height:34px; border-radius:8px; font-size:.9rem; }
  .orow .n { flex:1; min-width:0; font-size:.88rem; overflow-wrap:anywhere; }
  .orow .n small { display:block; color:var(--secondary-text-color); font-size:.72rem; margin-top:1px; }
  .orow .pr { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .orow .pr b { display:block; } .orow.best .pr b { color:var(--sd-ok); }
  .orow .pr s { color:var(--secondary-text-color); font-size:.72rem; } .orow .pr .pct { color:var(--error-color,#db4437); font-weight:800; font-size:.72rem; margin-left:4px; }
  /* schon auf der Liste: Haken über dem (abgedunkelten) Bild */
  .tl .img, .lrow .thumb { position:relative; overflow:hidden; }
  .tl.got .img::before, .lrow.got .thumb::before { content:""; position:absolute; inset:0; background:rgba(20,60,25,.62); }
  .gotck { position:absolute; inset:0; margin:auto; width:34px; height:34px; border-radius:50%; background:#43a047; color:#fff; font-weight:800; font-size:1.2rem; display:grid; place-items:center; box-shadow:0 3px 10px rgba(0,0,0,.4); }
  .lrow .gotck { width:auto; height:auto; background:none; box-shadow:none; font-size:1.15rem; }
  .gotn { position:absolute; right:4px; bottom:4px; background:#0d2a12; color:#bff0c2; font-size:.68rem; font-weight:800; border-radius:999px; padding:0 6px; }
  .gott { color:#4caf50; font-weight:700; }
  .tl, .lrow { content-visibility:auto; contain-intrinsic-size:auto 150px; } .lrow { contain-intrinsic-size:auto 56px; }
  .catbar { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 2px; }
  .catbar .chip small { color:var(--secondary-text-color); } .catbar .chip.more { border-style:dashed; color:var(--sd-accent); }
  .stepper { display:inline-flex; align-items:center; height:34px; border-radius:10px; border:1px solid color-mix(in srgb, #4caf50 55%, transparent); background:color-mix(in srgb, #4caf50 12%, transparent); flex:none; }
  .stepper button { background:none; border:0; color:#4caf50; font:inherit; font-size:1.1rem; width:30px; height:32px; cursor:pointer; } .stepper b { min-width:26px; text-align:center; font-size:.82rem; }
  .tl .stepper { align-self:flex-start; margin-top:4px; }
  .shelf.fold { border-top:1px solid var(--divider-color,#e0e0e0); } .shelf.fold:first-of-type { border-top:0; }
  .foldh { display:flex; align-items:center; gap:8px; width:100%; padding:11px 2px; border:0; background:none; color:inherit; font:inherit; font-size:.92rem; text-align:left; cursor:pointer; }
  .foldh small { color:var(--secondary-text-color); } .foldh .sp { flex:1; } .foldh .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
  .foldh .chev { color:var(--secondary-text-color); transition:transform .15s; } .shelf.fold.open .chev { transform:rotate(90deg); }
  .shelf h4 { margin:12px 0 6px; font-size:.84rem; display:flex; gap:8px; align-items:center; font-weight:500; }
  .shelf h4 small { color:var(--secondary-text-color); } .shelf h4 .sp { flex:1; }
  .shelf h4 button { background:none; border:0; color:var(--sd-accent); font:inherit; font-size:.8rem; cursor:pointer; }
  .rail { display:flex; gap:8px; overflow-x:auto; scrollbar-width:thin; padding-bottom:4px; }
  .rail.open { display:grid; grid-template-columns:repeat(auto-fill, minmax(124px,1fr)); overflow:visible; }
  .tl { flex:none; width:124px; background:var(--secondary-background-color,#f6f6f6); border-radius:12px; padding:8px; position:relative; display:flex; flex-direction:column; gap:3px; box-sizing:border-box; }
  .rail.open .tl { width:auto; }
  .tl .img { height:64px; border-radius:8px; background:#fff center/contain no-repeat; }
  .tl .t { font-size:.76rem; line-height:1.25; height:2.5em; overflow:hidden; }
  .tl b { font-size:.95rem; } .tl .x { color:var(--secondary-text-color); font-size:.66rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tl .on { position:absolute; right:6px; top:6px; font-size:.8rem; background:var(--card-background-color,#fff); border-radius:50%; width:20px; height:20px; display:grid; place-items:center; }
  .tl .btn { padding:3px 6px; font-size:.74rem; margin-top:auto; }
  .mx { display:none; }
  /* Ansicht „Tabelle“: auch auf schmalen Karten, dichter gesetzt */
  /* Tabelle „Märkte als Spalten“: wächst mit der Karte, aber nicht endlos (Standard: 760 px für den Artikel und
     260 px je Markt, einstellbar mit table_max_width – sonst liefen die Spalten sehr weit auseinander); Trennlinien gerade */
  .mx.force { display:grid; font-size:.84rem; margin-top:8px; overflow-x:auto; }
  .mx.force + .rows { display:none; }
  .mx.force > div { padding:8px 10px; border-bottom:1px solid var(--divider-color,#e0e0e0); display:flex; align-items:center; gap:4px; justify-content:flex-end; font-variant-numeric:tabular-nums; white-space:nowrap; min-width:0; border-radius:0; }
  .mx.force > div.l { justify-content:flex-start; white-space:normal; overflow-wrap:anywhere; padding-left:4px; }
  .mx.force .hd { color:var(--secondary-text-color); font-size:.72rem; font-weight:700; }
  .mx.force .cell { cursor:pointer; align-items:flex-end; } .mx.force .cell.best { color:var(--sd-ok); font-weight:700; }
  .mx.force .cell:hover { background:color-mix(in srgb, var(--sd-accent) 8%, transparent); }
  .mx.force .cell.sel { background:color-mix(in srgb, var(--sd-accent) 16%, transparent); box-shadow:0 0 0 2px var(--sd-accent) inset; } .mx.force .na { color:var(--secondary-text-color); }
  .vsw { display:inline-flex; gap:4px; } .vbtn.on { border-color:var(--sd-accent); color:var(--sd-accent); }
  /* Ansicht „kompakt“ */
  .cl { display:flex; align-items:center; gap:8px; padding:8px 2px; border-bottom:1px solid var(--divider-color,#e0e0e0); cursor:pointer; font-size:.92rem; }
  .cl .n { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .cl b { font-variant-numeric:tabular-nums; min-width:58px; text-align:right; } .cl b.best { color:var(--sd-ok); }
  .cl .more { background:none; border:0; color:var(--secondary-text-color); font:inherit; font-size:.76rem; cursor:pointer; padding:4px 2px; }
  .cl.none { opacity:.55; cursor:default; } .cl.none small { color:var(--secondary-text-color); }
  .cl .radio { width:20px; height:20px; border-radius:50%; border:2px solid var(--secondary-text-color); flex:none; display:grid; place-items:center; font-size:.72rem; color:#fff; }
  .cl .radio.on { background:var(--sd-accent); border-color:var(--sd-accent); }
  /* Günstigster Einkauf und „demnächst im Angebot“ */
  .basket { margin-top:10px; border:1px solid var(--divider-color,#e0e0e0); border-radius:12px; padding:8px 10px; }
  .basket .bh { font-weight:700; font-size:.86rem; margin:2px 2px 6px; }
  .bk { display:flex; align-items:center; gap:10px; width:100%; text-align:left; font:inherit; color:inherit; background:none; border:1px solid transparent; border-radius:10px; padding:7px 8px; cursor:pointer; }
  .bk:hover { background:var(--secondary-background-color,#f6f6f6); } .bk.on { border-color:var(--sd-accent); background:color-mix(in srgb, var(--sd-accent) 12%, transparent); }
  .bk .bl { flex:1; min-width:0; display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:.86rem; }
  .bk .bm { color:var(--secondary-text-color); font-size:.76rem; white-space:nowrap; } .bk .sv { color:var(--sd-ok); font-weight:700; }
  .bk .bs { font-variant-numeric:tabular-nums; min-width:62px; text-align:right; }
  .bkx { font:inherit; font-size:.76rem; color:var(--secondary-text-color); background:none; border:0; padding:0 8px 4px; cursor:pointer; }
  .bkd { margin:0 8px 6px; border:1px solid var(--divider-color,#e0e0e0); border-radius:8px; padding:6px 8px; font-size:.78rem; }
  .bkd > div { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; } .bkd .mut { color:var(--secondary-text-color); } .bkd .ok { color:var(--sd-ok); }
  .soonbox { margin-top:10px; font-size:.8rem; color:var(--secondary-text-color); padding:8px 10px; border-radius:10px; background:var(--secondary-background-color,#f6f6f6); }
  .soonbox b { color:var(--primary-text-color); }
  .lrow .pr .trend { display:block; font-size:.68rem; font-weight:600; } .trend.up { color:var(--error-color,#db4437); } .trend.down { color:var(--sd-ok); }
  .catbar.when { margin-bottom:2px; }
  .foot { color:var(--secondary-text-color); font-size:.72rem; text-align:center; margin-top:10px; }
  .addpick { display:flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap; font-size:.8rem; margin-bottom:6px; color:var(--primary-text-color); }
  .addsel { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color,#f6f6f6); border:1px solid var(--divider-color,#ddd); border-radius:8px; padding:4px 8px; max-width:100%; }
  @container (min-width: 720px) {
  }
`;

