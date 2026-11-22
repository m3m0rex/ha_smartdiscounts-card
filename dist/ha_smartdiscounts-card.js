/* SmartDiscounts-Karte – Angebote der Supermärkte, abgeglichen mit deiner Einkaufsliste.
 *   type: custom:smartdiscounts-card
 *   list: todo.einkauf            # optional – jede To-do-Liste von Home Assistant
 *
 * Eigenständige Karte (Repository ha_smartdiscounts-card). Läuft ohne SmartLists; ist SmartLists installiert, nutzt sie
 * dessen Kategorien, Rechte, Merkliste und Angebots-Badges – und die SmartLists-Karte zeigt mit ihr Angebots-Hinweise.
 * Quellen: jeder Sensor mit einer Liste von Angeboten in einem Attribut ("discounts", "offers" …), z. B. die
 * Angebots-Integrationen von FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma, ha-grocery-deals – https://github.com/FaserF)
 * oder jeder andere/eigene REST-/Template-Sensor.
 * Feldnamen werden erkannt (product/title/name, price, picture_link/image_url, valid_until/end_date,
 * base_price/price_per_unit, category) und lassen sich je Quelle mit `map:` festlegen.
 * Keine externen Abhängigkeiten; nutzt die Theme-Variablen von Home Assistant. */
(() => {
const VERSION = "1.3.28";
const TAG = "smartdiscounts-card";
// Reiter „Meine Liste“ (Abgleich mit der Liste, Sammeln, günstigster Einkauf) – vorerst ausgeschaltet
const LIST_TAB = false;
// Markt-Kategorien mit eigenen verknüpfen (category_map, Abschnitt im Editor) – vorerst ausgeschaltet
const CATEGORY_MAP = false;
if (customElements.get(TAG)) return;  // schon geladen (z. B. doppelt als Ressource eingetragen)

// Texte: je Sprache eine Datei in lang/<sprache>.json – scripts/build.py setzt sie hier ein.
const TEXTS = {
  "de": {"cm_title": "Markt-Kategorien verknüpfen", "cm_help": "Links die Kategorie, die der Markt liefert, rechts der Name, unter dem sie erscheinen soll – z. B. eine Kategorie von SmartLists. Leer = unverändert, ∅ = zählt nicht als Kategorie.", "cm_keep": "unverändert", "cm_none": "keine Kategorie", "cm_empty": "Die Sensoren liefern gerade keine Kategorien.", "e_locked": "Fest einstellen – in der Karte nicht umschaltbar", "lk_list": "Ansicht „Meine Liste“ (▦ ☰ ≡ ▤)", "lk_all": "„Alle Angebote“: Kacheln / Liste", "lk_group": "„Alle Angebote“: nach Markt / Kategorie", "lk_add": "Ziel-Liste für neue Artikel", "add_in": "Neue Artikel in", "add_std": "Standard-Liste", "e_cat_map": "Markt-Kategorien verknüpfen (Kategorie des Markts: gewünschte Kategorie)", "unit_low": "Niedrigster Grundpreis", "v_compact": "kompakt – eine Zeile je Artikel", "v_table": "Tabelle – Märkte als Spalten", "e_tabs": "Reiter anzeigen (Reihenfolge durch Ziehen)", "e_flow": "Kacheln anordnen", "tf_grid": "untereinander (Raster)", "tf_scroll": "in einer Zeile zum Wischen", "search_targets": "Durchsuchen", "s_look": "Darstellung", "s_watch": "Merkliste & Benachrichtigung", "s_more": "Erweitert", "e_mine": "Kombinierte Liste: nur meine Listen berücksichtigen", "e_add_to": "Hinzufügen in diese Liste (leer = Standard der Liste)", "read_only": "Auf dieser Liste darfst du nur ansehen oder abhaken – hinzufügen und ändern ist für dich nicht freigegeben.", "e_stores": "Nur diese Märkte (leer = alle)", "e_cat_open": "Kategorien anfangs aufgeklappt", "more_n": "+{n} mehr", "on_n": "{n}× auf der Liste", "dup_n": "„{name}“ steht {n}-mal auf der Liste", "dup_merge": "Zusammenfassen", "e_list_tab": "Reiter „Meine Liste“ anzeigen", "e_cat_src": "Kategorien", "cs_auto": "von SmartLists, sonst vom Markt", "cs_store": "vom Markt, sonst von SmartLists", "e_entities": "Nur diese Angebots-Sensoren (leer = alle erkannten)", "e_group": "„Alle Angebote“ gruppieren nach", "g_store": "Markt", "g_cat": "Kategorie", "other": "Sonstiges", "tab_watch": "Merkliste", "w_add": "Produkt merken, z. B. Kaffee", "w_add_btn": "Merken", "w_empty": "Noch nichts gemerkt. Trage Produkte ein, bei denen du auf ein Angebot wartest.", "w_local": "Auf diesem Gerät gespeichert. Mit „watch_list“ (eine To-do-Liste) gilt die Merkliste auf allen Geräten.", "w_ha": "In Home Assistant gespeichert – auf allen deinen Geräten gleich.", "w_err": "Die Merkliste konnte nicht aus Home Assistant geladen werden. Es wurde nichts gespeichert.", "w_retry": "Erneut versuchen", "w_adopted": "{n} Produkte von diesem Gerät übernommen.", "w_list_unused": "Die Merkliste liegt jetzt bei dir in Home Assistant. Die To-do-Liste „{list}“ aus der Karten-Einstellung wird dafür nicht mehr benutzt; was dort steht, bleibt stehen.", "w_list_take": "In meine Merkliste kopieren", "bonus_label": "{amount} Bonus", "bonus_help": "Bonus-Aktion: Du zahlst den normalen Preis und bekommst das Guthaben in der {store}-App gutgeschrieben – nur, wenn du sie beim Bezahlen nutzt.", "e_bonus": "Bonus-Programme nutzen (Preise mit Bonus vergleichen)", "with_bonus": "mit Bonus-Guthaben gerechnet", "w_fixed": "aus der Konfiguration", "n_title": "Angebot für deine Merkliste", "e_watch": "Merkliste: Produkte", "e_watch_list": "Merkliste als To-do-Liste (gilt auf allen Geräten)", "e_notify": "Benachrichtigen, wenn etwas von der Merkliste im Angebot ist", "e_notify_service": "Zusätzlich senden an (Smartphones, Dienste – mehrere möglich)", "e_symbol": "Eigenes Währungssymbol (statt „currency“)", "title": "Angebote", "tab_list": "Meine Liste", "tab_all": "Alle Angebote", "search": "Angebote durchsuchen …", "no_sources": "Keine Angebots-Sensoren gefunden. Installiere z. B. eine Angebots-Integration von FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) oder trage unter „sources“ einen eigenen Sensor ein.", "no_list": "Keine Liste gewählt – trage in der Karte unter „list“ eine To-do-Liste ein, um Angebote mit ihr abzugleichen.", "list_empty": "Die Liste ist leer.", "none": "kein Angebot", "offers": "Angebote", "offer1": "Angebot", "on_offer": "{n} von {m} Artikeln im Angebot", "cheapest": "Günstigste wählen", "only": "nur {store}", "chosen": "{n} gewählt", "sum": "Summe", "apply": "In Liste übernehmen", "applied": "✓ übernommen", "pick_hint": "Preis antippen, um ein Angebot zu wählen", "until": "bis", "today": "nur noch heute", "expired": "abgelaufen", "add": "Auf die Liste", "added": "✓ auf der Liste", "all": "alle", "less": "weniger", "on_list": "steht auf deiner Liste", "best": "günstigster", "item": "Artikel", "no_hits": "Nichts gefunden.", "exp_n": "Abgelaufene Angebote auf der Liste: {n}", "exp_remove": "Entfernen", "exp_later": "Später", "all_cats": "Alle Kategorien", "error": "Das hat nicht geklappt.", "attached": "Angebot gewählt", "stand": "Stand", "in_offer": "im Angebot", "without": "ohne Angebot", "e_title": "Titel", "e_list": "Einkaufsliste (To-do)", "e_match": "Artikel passt zum Angebot, wenn", "m_word": "ganzes Wort im Namen (Butter ≠ Butterkeks)", "m_exact": "nur genau dieses Wort", "m_part": "Teil des Namens", "e_tab": "Start-Reiter", "e_images": "Bilder", "e_unit": "Grundpreis (€/kg, €/l)", "e_until": "Gültig bis", "e_hide_none": "Artikel ohne Angebot ausblenden", "e_max": "Angebote je Markt (Reiter „Alle“) – höchstens 20", "e_view": "Darstellung „Alle Angebote“", "v_tiles": "Kacheln", "v_list": "Liste mit kleinen Bildern", "e_lview": "Darstellung „Meine Liste“", "v_chips": "Preise nebeneinander", "v_rows": "ein Angebot je Zeile", "e_sources": "Quellen werden automatisch erkannt. Eigene Sensoren und Feld-Zuordnung: im Code-Editor unter „sources“ (siehe README).", "from": "ab", "w_now": "Jetzt", "w_next": "Ab {date}", "tr_up": "▲ am {date} {price}", "tr_down": "▼ zuletzt {price}", "bk_title": "Günstigster Einkauf", "bk_one": "Ein Markt", "bk_two": "Zwei Märkte", "bk_n": "{n} Märkte", "bk_items": "{n} von {m} Angebots-Artikeln", "bk_saves": "spart {sum}", "soon_title": "Demnächst im Angebot:", "e_trend": "Hinweis, wenn ein Angebot vorher billiger oder teurer war", "wl_yours": "Deine Merklisten", "wl_new": "Neue Merkliste", "wl_rename": "Umbenennen", "wl_default": "Als Standard festlegen", "wl_is_default": "Standard", "wl_delete": "Merkliste löschen", "wl_delete_sure": "Wirklich löschen?", "wl_name": "Name der Merkliste", "wl_ok": "OK", "wl_cancel": "Abbrechen", "wl_all": "Alle Merklisten", "wl_all_hint": "Alle deine Merklisten zusammen. Neues kommt in deine Standard-Liste, Entfernen gilt für jede Liste.", "wl_private": "Nur du siehst deine Merklisten.", "bk_more": "{n} Artikel mehr für {sum}", "bk_rest": "die übrigen {sum} günstiger", "bk_big1": "1 größere Packung", "bk_big": "{n} größere Packungen", "bk_bigger": "größere Packung", "bk_more_pay": "+{sum} an der Kasse", "bk_amount": "{a} statt {b}", "bk_per": "{a} statt {b}", "bk_same": "für {a} wären das {sum} weniger", "loading": "Lädt …", "e_collect": "Erst unter „Meine Liste“ sammeln (＋ in „Alle Angebote“ merkt vor, übernommen wird unter „Meine Liste“)", "st_title": "Vorgemerkt", "st_add": "Vormerken", "st_on": "Vorgemerkt", "st_apply": "Auf die Liste", "st_clear": "Leeren", "cs_store_only": "nur vom Markt", "w_user": "In Home Assistant gespeichert – nur für dich, auf allen deinen Geräten.", "w_to_todo": "Als To-do-Liste führen", "w_todo_pick": "To-do-Liste", "w_todo_new": "Neue To-do-Liste anlegen", "w_todo_name": "Name der neuen Liste", "w_todo_hint": "Die gemerkten Produkte ziehen in eine To-do-Liste um, und diese Karte zeigt sie für dich von dort. Eine To-do-Liste sehen alle Benutzer von Home Assistant.", "w_todo_go": "Umziehen", "w_todo_fail": "Die To-do-Liste konnte nicht angelegt werden.", "w_todo_none": "Es gibt keine To-do-Liste zur Auswahl. Eine neue anlegen können nur Admins.", "w_linked": "Deine Merkliste liegt in der To-do-Liste „{list}“.", "w_unlink": "Wieder privat führen", "e_show_title": "Titel und Zahl der Angebote anzeigen", "tab_shop": "Meine Einkaufsliste", "sh_connect_title": "Verbinde deine Einkaufsliste", "sh_connect_sub": "Dann siehst du hier, was du aus den Angeboten hinzugefügt hast.", "sh_pick": "Liste wählen …", "sh_from_offers": "Aus Angeboten hinzugefügt", "sh_rest": "Weitere Einträge", "sh_sum": "Angebote auf der Liste", "sh_empty": "Die Liste ist leer. Mit ＋ unter „Alle Angebote“ kommt etwas dazu.", "sh_done": "Erledigt", "sh_change": "Andere Liste verbinden", "on_yours": "Auf deiner Liste", "e_shop_view": "„Meine Einkaufsliste“ anzeigen", "sv_own": "Eigene Ansicht (Angebote oben)", "sv_smart": "Im Stil von SmartLists", "e_preview": "Sensoren mit den Angeboten der nächsten Woche (Vorschau)", "sh_not_yet": "gilt erst ab {date}", "sh_later": "Noch nicht gültig", "sh_next": "ab {date} {price} bei {store} (statt {old})", "e_preview_start": "Vorschau ohne Datum startet am (falls der Markt kein Ende der laufenden Angebote nennt)", "no_offers_now": "Heute gilt kein Angebot – die Sensoren liefern gerade keine gültigen Angebote (z. B. zwischen zwei Prospekten). Sobald neue da sind, erscheinen sie hier."},
  "en": {"cm_title": "Link store categories", "cm_help": "Left: the category the store reports. Right: the name it should appear under – e.g. a SmartLists category. Empty = unchanged, ∅ = does not count as a category.", "cm_keep": "unchanged", "cm_none": "no category", "cm_empty": "The sensors report no categories right now.", "e_locked": "Fix – cannot be switched in the card", "lk_list": "\"My list\" view (▦ ☰ ≡ ▤)", "lk_all": "\"All offers\": tiles / list", "lk_group": "\"All offers\": by store / category", "lk_add": "Target list for new items", "add_in": "New items go to", "add_std": "default list", "e_cat_map": "Link store categories (store category: category you want)", "unit_low": "Lowest unit price", "v_compact": "compact – one line per item", "v_table": "table – stores as columns", "e_tabs": "Tabs to show (drag to reorder)", "e_flow": "Arrange tiles", "tf_grid": "top to bottom (grid)", "tf_scroll": "in one row to swipe", "search_targets": "Search", "s_look": "Appearance", "s_watch": "Watch list & notifications", "s_more": "Advanced", "e_mine": "Combined list: only consider my lists", "e_add_to": "Add to this list (empty = the list's default)", "read_only": "On this list you may only view or check off – adding and changing is not enabled for you.", "e_stores": "Only these stores (empty = all)", "e_cat_open": "Categories expanded at first", "more_n": "+{n} more", "on_n": "{n}× on the list", "dup_n": "\"{name}\" is on the list {n} times", "dup_merge": "Merge", "e_list_tab": "Show the \"My list\" tab", "e_cat_src": "Categories", "cs_auto": "from SmartLists, otherwise from the store", "cs_store": "from the store, otherwise from SmartLists", "e_entities": "Only these offer sensors (empty = all detected)", "e_group": "Group \"All offers\" by", "g_store": "Store", "g_cat": "Category", "other": "Other", "tab_watch": "Watch list", "w_add": "Watch a product, e.g. coffee", "w_add_btn": "Watch", "w_empty": "Nothing here yet. Enter products you are waiting to see on offer.", "w_local": "Stored on this device. With \"watch_list\" (a to-do list) the watch list applies on all devices.", "w_ha": "Saved in Home Assistant – the same on all your devices.", "w_err": "The watch list could not be loaded from Home Assistant. Nothing was saved.", "w_retry": "Try again", "w_adopted": "{n} products taken over from this device.", "w_list_unused": "Your watch list is now kept for you in Home Assistant. The to-do list “{list}” from the card settings is no longer used for it; what is on it stays there.", "w_list_take": "Copy to my watch list", "bonus_label": "{amount} bonus", "bonus_help": "Bonus offer: you pay the normal price and get the credit in the {store} app – only if you use it at checkout.", "e_bonus": "I use bonus programmes (compare prices with the bonus)", "with_bonus": "with the bonus credit taken off", "w_fixed": "from the configuration", "n_title": "Offer for your watch list", "e_watch": "Watch list: products", "e_watch_list": "Watch list as a to-do list (applies on all devices)", "e_notify": "Notify when something on the watch list is on offer", "e_notify_service": "Also send to (phones, services – several possible)", "e_symbol": "Own currency symbol (instead of \"currency\")", "title": "Offers", "tab_list": "My list", "tab_all": "All offers", "search": "Search offers …", "no_sources": "No offer sensors found. Install e.g. one of FaserF's offer integrations (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) or add your own sensor under \"sources\".", "no_list": "No list selected – set a to-do list under \"list\" to match offers against it.", "list_empty": "The list is empty.", "none": "no offer", "offers": "offers", "offer1": "offer", "on_offer": "{n} of {m} items on offer", "cheapest": "Pick cheapest", "only": "only {store}", "chosen": "{n} selected", "sum": "Total", "apply": "Apply to list", "applied": "✓ applied", "pick_hint": "Tap a price to pick an offer", "until": "until", "today": "today only", "expired": "expired", "add": "Add to list", "added": "✓ on the list", "all": "all", "less": "less", "on_list": "is on your list", "best": "cheapest", "item": "Item", "no_hits": "Nothing found.", "exp_n": "Expired offers on the list: {n}", "exp_remove": "Remove", "exp_later": "Later", "all_cats": "All categories", "error": "That did not work.", "attached": "offer selected", "stand": "as of", "in_offer": "on offer", "without": "no offer", "e_title": "Title", "e_list": "Shopping list (to-do)", "e_match": "Item matches an offer if", "m_word": "whole word in the name (butter ≠ butter biscuit)", "m_exact": "exactly this word only", "m_part": "part of the name", "e_tab": "Start tab", "e_images": "Images", "e_unit": "Unit price (€/kg, €/l)", "e_until": "Valid until", "e_hide_none": "Hide items without an offer", "e_max": "Offers per store (\"All\" tab) – at most 20", "e_view": "\"All offers\" layout", "v_tiles": "Tiles", "v_list": "List with small images", "e_lview": "\"My list\" layout", "v_chips": "Prices side by side", "v_rows": "One offer per row", "e_sources": "Sources are detected automatically. Own sensors and field mapping: in the code editor under \"sources\" (see README).", "from": "from", "w_now": "Now", "w_next": "From {date}", "tr_up": "▲ {price} on {date}", "tr_down": "▼ was {price}", "bk_title": "Cheapest shopping trip", "bk_one": "One shop", "bk_two": "Two shops", "bk_n": "{n} stores", "bk_items": "{n} of {m} items on offer", "bk_saves": "saves {sum}", "soon_title": "On offer soon:", "e_trend": "Hint when an offer was cheaper or dearer before", "wl_yours": "Your watch lists", "wl_new": "New watch list", "wl_rename": "Rename", "wl_default": "Make default", "wl_is_default": "default", "wl_delete": "Delete watch list", "wl_delete_sure": "Really delete?", "wl_name": "Name of the watch list", "wl_ok": "OK", "wl_cancel": "Cancel", "wl_all": "All watch lists", "wl_all_hint": "All your watch lists together. New products go to your default list, removing applies to every list.", "wl_private": "Only you see your watch lists.", "bk_more": "{n} more items for {sum}", "bk_rest": "the others {sum} cheaper", "bk_big1": "1 bigger pack", "bk_big": "{n} bigger packs", "bk_bigger": "bigger pack", "bk_more_pay": "+{sum} at the till", "bk_amount": "{a} instead of {b}", "bk_per": "{a} instead of {b}", "bk_same": "for {a} that is {sum} less", "loading": "Loading …", "e_collect": "Collect under \"My list\" first (＋ in \"All offers\" sets aside, \"My list\" adds to the list)", "st_title": "Set aside", "st_add": "Set aside", "st_on": "Set aside", "st_apply": "Add to list", "st_clear": "Clear", "cs_store_only": "from the store only", "w_user": "Kept in Home Assistant – only for you, on all your devices.", "w_to_todo": "Keep as a to-do list", "w_todo_pick": "To-do list", "w_todo_new": "Create a new to-do list", "w_todo_name": "Name of the new list", "w_todo_hint": "The products move to a to-do list, and this card shows them for you from there. All Home Assistant users can see a to-do list.", "w_todo_go": "Move", "w_todo_fail": "The to-do list could not be created.", "w_todo_none": "There is no to-do list to choose. Only admins can create a new one.", "w_linked": "Your watch list is kept in the to-do list \"{list}\".", "w_unlink": "Keep it private again", "e_show_title": "Show title and number of offers", "tab_shop": "My shopping list", "sh_connect_title": "Connect your shopping list", "sh_connect_sub": "Then you see here what you added from the offers.", "sh_pick": "Choose a list …", "sh_from_offers": "Added from offers", "sh_rest": "Other items", "sh_sum": "Offers on the list", "sh_empty": "The list is empty. ＋ under \"All offers\" adds something.", "sh_done": "Done", "sh_change": "Connect another list", "on_yours": "On your list", "e_shop_view": "Show \"My shopping list\"", "sv_own": "Own view (offers on top)", "sv_smart": "In the SmartLists style", "e_preview": "Sensors with next week's offers (preview)", "sh_not_yet": "valid from {date}", "sh_later": "Not valid yet", "sh_next": "from {date} {price} at {store} (instead of {old})", "e_preview_start": "A preview without a date starts on (if the store gives no end of the current offers)", "no_offers_now": "No offer is valid today – the sensors have no valid offers right now (for example between two leaflets). New ones show up here as soon as they arrive."},
  "es": {"cm_title": "Vincular categorías de la tienda", "cm_help": "A la izquierda la categoría que da la tienda, a la derecha el nombre con el que debe aparecer, p. ej. una categoría de SmartLists. Vacío = sin cambios, ∅ = no cuenta como categoría.", "cm_keep": "sin cambios", "cm_none": "sin categoría", "cm_empty": "Los sensores no dan categorías ahora mismo.", "e_locked": "Fijar: no se puede cambiar en la tarjeta", "lk_list": "Vista «Mi lista» (▦ ☰ ≡ ▤)", "lk_all": "«Todas las ofertas»: mosaico / lista", "lk_group": "«Todas las ofertas»: por tienda / categoría", "lk_add": "Lista de destino para artículos nuevos", "add_in": "Artículos nuevos en", "add_std": "lista predeterminada", "e_cat_map": "Vincular categorías de la tienda (categoría de la tienda: categoría deseada)", "unit_low": "Precio por unidad más bajo", "v_compact": "compacto – una línea por artículo", "v_table": "tabla – tiendas en columnas", "e_tabs": "Pestañas visibles (arrastra para ordenar)", "e_flow": "Disposición del mosaico", "tf_grid": "de arriba abajo (cuadrícula)", "tf_scroll": "en una fila para deslizar", "search_targets": "Buscar", "s_look": "Apariencia", "s_watch": "Seguimiento y avisos", "s_more": "Avanzado", "e_mine": "Lista combinada: tener en cuenta solo mis listas", "e_add_to": "Añadir a esta lista (vacío = la predeterminada)", "read_only": "En esta lista solo puedes ver o marcar – añadir y cambiar no está permitido para ti.", "e_stores": "Solo estas tiendas (vacío = todas)", "e_cat_open": "Categorías desplegadas al inicio", "more_n": "+{n} más", "on_n": "{n}× en la lista", "dup_n": "«{name}» está {n} veces en la lista", "dup_merge": "Unir", "e_list_tab": "Mostrar la pestaña «Mi lista»", "e_cat_src": "Categorías", "cs_auto": "de SmartLists, si no de la tienda", "cs_store": "de la tienda, si no de SmartLists", "e_entities": "Solo estos sensores de ofertas (vacío = todos)", "e_group": "Agrupar «Todas las ofertas» por", "g_store": "Tienda", "g_cat": "Categoría", "other": "Otros", "tab_watch": "Seguimiento", "w_add": "Seguir un producto, p. ej. café", "w_add_btn": "Seguir", "w_empty": "Aún no hay nada. Escribe los productos de los que esperas una oferta.", "w_local": "Guardado en este dispositivo. Con «watch_list» (una lista de tareas) el seguimiento vale en todos los dispositivos.", "w_ha": "Guardada en Home Assistant: igual en todos tus dispositivos.", "w_err": "No se pudo cargar la lista de seguimiento desde Home Assistant. No se guardó nada.", "w_retry": "Reintentar", "w_adopted": "{n} productos traídos de este dispositivo.", "w_list_unused": "Tu lista de seguimiento se guarda ahora para ti en Home Assistant. La lista de tareas «{list}» de los ajustes de la tarjeta ya no se usa; lo que hay en ella se queda.", "w_list_take": "Copiar a mi lista de seguimiento", "bonus_label": "{amount} de bonificación", "bonus_help": "Oferta bonus: pagas el precio normal y recibes el saldo en la app de {store}, solo si la usas al pagar.", "e_bonus": "Uso programas de bonus (comparar con el bonus)", "with_bonus": "con el bonus descontado", "w_fixed": "de la configuración", "n_title": "Oferta para tu seguimiento", "e_watch": "Seguimiento: productos", "e_watch_list": "Seguimiento como lista de tareas (todos los dispositivos)", "e_notify": "Avisar cuando algo en seguimiento esté en oferta", "e_notify_service": "Enviar también a (smartphones, servicios – varios posibles)", "e_symbol": "Símbolo de moneda propio (en lugar de «currency»)", "title": "Ofertas", "tab_list": "Mi lista", "tab_all": "Todas las ofertas", "search": "Buscar ofertas …", "no_sources": "No se encontraron sensores de ofertas. Instala p. ej. una integración de FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) o añade tu propio sensor en «sources».", "no_list": "No hay lista elegida – indica una lista de tareas en «list» para compararla con las ofertas.", "list_empty": "La lista está vacía.", "none": "sin oferta", "offers": "ofertas", "offer1": "oferta", "on_offer": "{n} de {m} artículos en oferta", "cheapest": "Elegir las más baratas", "only": "solo {store}", "chosen": "{n} elegidas", "sum": "Total", "apply": "Pasar a la lista", "applied": "✓ aplicado", "pick_hint": "Toca un precio para elegir una oferta", "until": "hasta el", "today": "solo hoy", "expired": "caducada", "add": "A la lista", "added": "✓ en la lista", "all": "todas", "less": "menos", "on_list": "está en tu lista", "best": "la más barata", "item": "Artículo", "no_hits": "No se encontró nada.", "exp_n": "Ofertas caducadas en la lista: {n}", "exp_remove": "Quitar", "exp_later": "Más tarde", "all_cats": "Todas las categorías", "error": "No ha funcionado.", "attached": "oferta elegida", "stand": "actualizado", "in_offer": "en oferta", "without": "sin oferta", "e_title": "Título", "e_list": "Lista de la compra (tareas)", "e_match": "Un artículo coincide con una oferta si", "m_word": "palabra completa en el nombre (mantequilla ≠ galleta de mantequilla)", "m_exact": "solo exactamente esta palabra", "m_part": "parte del nombre", "e_tab": "Pestaña inicial", "e_images": "Imágenes", "e_unit": "Precio por unidad (€/kg, €/l)", "e_until": "Válido hasta", "e_hide_none": "Ocultar artículos sin oferta", "e_max": "Ofertas por tienda (pestaña «Todas») – 20 como máximo", "e_view": "Vista de «Todas las ofertas»", "v_tiles": "Mosaico", "v_list": "Lista con imágenes pequeñas", "e_lview": "Vista de «Mi lista»", "v_chips": "Precios lado a lado", "v_rows": "una oferta por fila", "e_sources": "Las fuentes se detectan automáticamente. Sensores propios y asignación de campos: en el editor de código, en «sources» (ver README).", "from": "desde", "w_now": "Ahora", "w_next": "Desde el {date}", "tr_up": "▲ {price} el {date}", "tr_down": "▼ antes {price}", "bk_title": "La compra más barata", "bk_one": "Una tienda", "bk_two": "Dos tiendas", "bk_n": "{n} tiendas", "bk_items": "{n} de {m} artículos en oferta", "bk_saves": "ahorra {sum}", "soon_title": "Pronto en oferta:", "e_trend": "Aviso si una oferta era antes más barata o más cara", "wl_yours": "Tus listas de seguimiento", "wl_new": "Nueva lista de seguimiento", "wl_rename": "Cambiar nombre", "wl_default": "Usar como predeterminada", "wl_is_default": "predeterminada", "wl_delete": "Eliminar lista de seguimiento", "wl_delete_sure": "¿Eliminar de verdad?", "wl_name": "Nombre de la lista de seguimiento", "wl_ok": "OK", "wl_cancel": "Cancelar", "wl_all": "Todas las listas de seguimiento", "wl_all_hint": "Todas tus listas de seguimiento juntas. Lo nuevo va a tu lista predeterminada; quitar se aplica a todas las listas.", "wl_private": "Solo tú ves tus listas de seguimiento.", "bk_more": "{n} artículos más por {sum}", "bk_rest": "el resto {sum} más barato", "bk_big1": "1 envase más grande", "bk_big": "{n} envases más grandes", "bk_bigger": "envase más grande", "bk_more_pay": "+{sum} en caja", "bk_amount": "{a} en vez de {b}", "bk_per": "{a} en vez de {b}", "bk_same": "para {a} son {sum} menos", "loading": "Cargando …", "e_collect": "Reunir primero en «Mi lista» (＋ en «Todas las ofertas» aparta, «Mi lista» añade)", "st_title": "Apartado", "st_add": "Apartar", "st_on": "Apartado", "st_apply": "Añadir a la lista", "st_clear": "Vaciar", "cs_store_only": "solo de la tienda", "w_user": "Guardado en Home Assistant: solo para ti, en todos tus dispositivos.", "w_to_todo": "Llevar como lista de tareas", "w_todo_pick": "Lista de tareas", "w_todo_new": "Crear una lista de tareas nueva", "w_todo_name": "Nombre de la lista nueva", "w_todo_hint": "Los productos pasan a una lista de tareas y esta tarjeta te los muestra desde allí. Todos los usuarios de Home Assistant ven una lista de tareas.", "w_todo_go": "Mover", "w_todo_fail": "No se pudo crear la lista de tareas.", "w_todo_none": "No hay ninguna lista de tareas para elegir. Solo los administradores pueden crear una.", "w_linked": "Tu lista de seguimiento está en la lista de tareas «{list}».", "w_unlink": "Volver a llevarla en privado", "e_show_title": "Mostrar título y número de ofertas", "tab_shop": "Mi lista de la compra", "sh_connect_title": "Conecta tu lista de la compra", "sh_connect_sub": "Así ves aquí lo que has añadido desde las ofertas.", "sh_pick": "Elegir una lista …", "sh_from_offers": "Añadido desde ofertas", "sh_rest": "Otros artículos", "sh_sum": "Ofertas en la lista", "sh_empty": "La lista está vacía. ＋ en «Todas las ofertas» añade algo.", "sh_done": "Hecho", "sh_change": "Conectar otra lista", "on_yours": "En tu lista", "e_shop_view": "Mostrar «Mi lista de la compra»", "sv_own": "Vista propia (ofertas arriba)", "sv_smart": "Al estilo de SmartLists", "e_preview": "Sensores con las ofertas de la próxima semana (avance)", "sh_not_yet": "válido desde el {date}", "sh_later": "Aún no válido", "sh_next": "desde el {date} {price} en {store} (en vez de {old})", "e_preview_start": "Un avance sin fecha empieza el (si la tienda no indica el fin de las ofertas actuales)", "no_offers_now": "Hoy no hay ninguna oferta válida: los sensores no tienen ofertas válidas ahora mismo (por ejemplo, entre dos folletos). Las nuevas aparecerán aquí."},
  "fr": {"cm_title": "Relier les catégories du magasin", "cm_help": "À gauche la catégorie fournie par le magasin, à droite le nom sous lequel elle doit apparaître – p. ex. une catégorie de SmartLists. Vide = inchangé, ∅ = ne compte pas comme catégorie.", "cm_keep": "inchangé", "cm_none": "aucune catégorie", "cm_empty": "Les capteurs ne fournissent aucune catégorie pour l'instant.", "e_locked": "Figer – non modifiable dans la carte", "lk_list": "Vue « Ma liste » (▦ ☰ ≡ ▤)", "lk_all": "« Toutes les promos » : tuiles / liste", "lk_group": "« Toutes les promos » : par magasin / catégorie", "lk_add": "Liste cible des nouveaux articles", "add_in": "Nouveaux articles dans", "add_std": "liste par défaut", "e_cat_map": "Relier les catégories du magasin (catégorie du magasin : catégorie voulue)", "unit_low": "Prix unitaire le plus bas", "v_compact": "compact – une ligne par article", "v_table": "tableau – magasins en colonnes", "e_tabs": "Onglets à afficher (glisser pour réordonner)", "e_flow": "Disposition des tuiles", "tf_grid": "de haut en bas (grille)", "tf_scroll": "sur une ligne à faire défiler", "search_targets": "Rechercher", "s_look": "Affichage", "s_watch": "Produits surveillés et notifications", "s_more": "Avancé", "e_mine": "Liste combinée : ne tenir compte que de mes listes", "e_add_to": "Ajouter à cette liste (vide = liste par défaut)", "read_only": "Sur cette liste, tu peux seulement consulter ou cocher – ajouter et modifier ne t'est pas autorisé.", "e_stores": "Seulement ces magasins (vide = tous)", "e_cat_open": "Catégories dépliées au départ", "more_n": "+{n} de plus", "on_n": "{n}× dans la liste", "dup_n": "« {name} » est {n} fois dans la liste", "dup_merge": "Regrouper", "e_list_tab": "Afficher l'onglet « Ma liste »", "e_cat_src": "Catégories", "cs_auto": "de SmartLists, sinon du magasin", "cs_store": "du magasin, sinon de SmartLists", "e_entities": "Seulement ces capteurs de promos (vide = tous)", "e_group": "Regrouper « Toutes les promos » par", "g_store": "Magasin", "g_cat": "Catégorie", "other": "Autres", "tab_watch": "À surveiller", "w_add": "Surveiller un produit, p. ex. café", "w_add_btn": "Surveiller", "w_empty": "Rien pour l'instant. Saisis les produits dont tu attends une promo.", "w_local": "Enregistré sur cet appareil. Avec « watch_list » (une liste de tâches), la liste vaut sur tous les appareils.", "w_ha": "Enregistrée dans Home Assistant – identique sur tous vos appareils.", "w_err": "La liste de suivi n’a pas pu être chargée depuis Home Assistant. Rien n’a été enregistré.", "w_retry": "Réessayer", "w_adopted": "{n} produits repris de cet appareil.", "w_list_unused": "Votre liste de suivi est maintenant enregistrée pour vous dans Home Assistant. La liste de tâches « {list} » des réglages de la carte n’est plus utilisée ; son contenu reste en place.", "w_list_take": "Copier dans ma liste de suivi", "bonus_label": "{amount} de bonus", "bonus_help": "Offre bonus : tu paies le prix normal et reçois le crédit dans l'app {store} – seulement si tu l'utilises en caisse.", "e_bonus": "J'utilise les programmes bonus (comparer avec le bonus)", "with_bonus": "bonus déduit", "w_fixed": "depuis la configuration", "n_title": "Promo pour ta liste à surveiller", "e_watch": "À surveiller : produits", "e_watch_list": "Liste à surveiller comme liste de tâches (tous les appareils)", "e_notify": "Notifier quand un produit surveillé est en promo", "e_notify_service": "Envoyer aussi à (smartphones, services – plusieurs possibles)", "e_symbol": "Symbole monétaire personnalisé (au lieu de « currency »)", "title": "Promos", "tab_list": "Ma liste", "tab_all": "Toutes les promos", "search": "Rechercher des promos …", "no_sources": "Aucun capteur de promos trouvé. Installe p. ex. une intégration de FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) ou ajoute ton propre capteur sous « sources ».", "no_list": "Aucune liste choisie – indique une liste de tâches sous « list » pour la comparer aux promos.", "list_empty": "La liste est vide.", "none": "pas de promo", "offers": "promos", "offer1": "promo", "on_offer": "{n} articles sur {m} en promo", "cheapest": "Choisir les moins chères", "only": "seulement {store}", "chosen": "{n} choisies", "sum": "Total", "apply": "Reporter dans la liste", "applied": "✓ reporté", "pick_hint": "Touche un prix pour choisir une promo", "until": "jusqu'au", "today": "aujourd'hui seulement", "expired": "expirée", "add": "Ajouter à la liste", "added": "✓ dans la liste", "all": "toutes", "less": "moins", "on_list": "est sur ta liste", "best": "la moins chère", "item": "Article", "no_hits": "Rien trouvé.", "exp_n": "Promos expirées dans la liste : {n}", "exp_remove": "Retirer", "exp_later": "Plus tard", "all_cats": "Toutes les catégories", "error": "Cela n'a pas fonctionné.", "attached": "promo choisie", "stand": "état au", "in_offer": "en promo", "without": "sans promo", "e_title": "Titre", "e_list": "Liste de courses (tâches)", "e_match": "Un article correspond à une promo si", "m_word": "mot entier dans le nom (beurre ≠ biscuit au beurre)", "m_exact": "exactement ce mot", "m_part": "partie du nom", "e_tab": "Onglet de départ", "e_images": "Images", "e_unit": "Prix à l'unité (€/kg, €/l)", "e_until": "Valable jusqu'au", "e_hide_none": "Masquer les articles sans promo", "e_max": "Promos par magasin (onglet « Toutes ») – 20 au plus", "e_view": "Affichage « Toutes les promos »", "v_tiles": "Tuiles", "v_list": "Liste avec petites images", "e_lview": "Affichage « Ma liste »", "v_chips": "Prix côte à côte", "v_rows": "une promo par ligne", "e_sources": "Les sources sont détectées automatiquement. Capteurs personnels et correspondance des champs : dans l'éditeur de code sous « sources » (voir README).", "from": "dès le", "w_now": "Maintenant", "w_next": "Dès le {date}", "tr_up": "▲ {price} le {date}", "tr_down": "▼ avant {price}", "bk_title": "Courses les moins chères", "bk_one": "Un magasin", "bk_two": "Deux magasins", "bk_n": "{n} magasins", "bk_items": "{n} articles en promo sur {m}", "bk_saves": "économise {sum}", "soon_title": "Bientôt en promo :", "e_trend": "Indication si une offre était moins chère ou plus chère avant", "wl_yours": "Vos listes de suivi", "wl_new": "Nouvelle liste de suivi", "wl_rename": "Renommer", "wl_default": "Définir par défaut", "wl_is_default": "par défaut", "wl_delete": "Supprimer la liste de suivi", "wl_delete_sure": "Vraiment supprimer ?", "wl_name": "Nom de la liste de suivi", "wl_ok": "OK", "wl_cancel": "Annuler", "wl_all": "Toutes les listes de suivi", "wl_all_hint": "Toutes vos listes de suivi réunies. Les nouveaux produits vont dans votre liste par défaut, la suppression vaut pour chaque liste.", "wl_private": "Vous seul voyez vos listes de suivi.", "bk_more": "{n} articles de plus pour {sum}", "bk_rest": "les autres {sum} moins chers", "bk_big1": "1 plus grand format", "bk_big": "{n} plus grands formats", "bk_bigger": "plus grand format", "bk_more_pay": "+{sum} à la caisse", "bk_amount": "{a} au lieu de {b}", "bk_per": "{a} au lieu de {b}", "bk_same": "pour {a}, c'est {sum} de moins", "loading": "Chargement …", "e_collect": "Rassembler d’abord sous « Ma liste » (＋ dans « Toutes les promos » met de côté, « Ma liste » ajoute)", "st_title": "De côté", "st_add": "Mettre de côté", "st_on": "Mis de côté", "st_apply": "Ajouter à la liste", "st_clear": "Vider", "cs_store_only": "seulement du magasin", "w_user": "Enregistré dans Home Assistant – rien que pour toi, sur tous tes appareils.", "w_to_todo": "Tenir comme liste de tâches", "w_todo_pick": "Liste de tâches", "w_todo_new": "Créer une nouvelle liste de tâches", "w_todo_name": "Nom de la nouvelle liste", "w_todo_hint": "Les produits passent dans une liste de tâches, et cette carte les affiche pour toi à partir de là. Tous les utilisateurs de Home Assistant voient une liste de tâches.", "w_todo_go": "Déplacer", "w_todo_fail": "La liste de tâches n’a pas pu être créée.", "w_todo_none": "Aucune liste de tâches à choisir. Seuls les admins peuvent en créer une.", "w_linked": "Ta liste de suivi est dans la liste de tâches « {list} ».", "w_unlink": "La garder privée à nouveau", "e_show_title": "Afficher le titre et le nombre de promos", "tab_shop": "Ma liste de courses", "sh_connect_title": "Connecte ta liste de courses", "sh_connect_sub": "Tu vois alors ici ce que tu as ajouté depuis les promos.", "sh_pick": "Choisir une liste …", "sh_from_offers": "Ajouté depuis les promos", "sh_rest": "Autres articles", "sh_sum": "Promos sur la liste", "sh_empty": "La liste est vide. ＋ sous « Toutes les promos » y ajoute quelque chose.", "sh_done": "Fait", "sh_change": "Connecter une autre liste", "on_yours": "Sur ta liste", "e_shop_view": "Afficher « Ma liste de courses »", "sv_own": "Vue propre (promos en haut)", "sv_smart": "Dans le style SmartLists", "e_preview": "Capteurs avec les promos de la semaine prochaine (aperçu)", "sh_not_yet": "valable à partir du {date}", "sh_later": "Pas encore valable", "sh_next": "dès le {date} {price} chez {store} (au lieu de {old})", "e_preview_start": "Un aperçu sans date commence le (si le magasin n’indique pas la fin des promos en cours)", "no_offers_now": "Aucune promo valable aujourd’hui – les capteurs n’ont pas de promos valables pour l’instant (par exemple entre deux prospectus). Les nouvelles apparaîtront ici."},
  "it": {"cm_title": "Collega le categorie del negozio", "cm_help": "A sinistra la categoria fornita dal negozio, a destra il nome con cui deve apparire, ad es. una categoria di SmartLists. Vuoto = invariato, ∅ = non conta come categoria.", "cm_keep": "invariato", "cm_none": "nessuna categoria", "cm_empty": "Al momento i sensori non forniscono categorie.", "e_locked": "Fissa: non modificabile nella scheda", "lk_list": "Vista «La mia lista» (▦ ☰ ≡ ▤)", "lk_all": "«Tutte le offerte»: tessere / elenco", "lk_group": "«Tutte le offerte»: per negozio / categoria", "lk_add": "Lista di destinazione dei nuovi articoli", "add_in": "Nuovi articoli in", "add_std": "lista predefinita", "e_cat_map": "Collega le categorie del negozio (categoria del negozio: categoria desiderata)", "unit_low": "Prezzo unitario più basso", "v_compact": "compatta – una riga per articolo", "v_table": "tabella – negozi in colonne", "e_tabs": "Schede da mostrare (trascina per riordinare)", "e_flow": "Disposizione dei riquadri", "tf_grid": "dall'alto in basso (griglia)", "tf_scroll": "in una riga da scorrere", "search_targets": "Cerca", "s_look": "Aspetto", "s_watch": "Prodotti seguiti e notifiche", "s_more": "Avanzate", "e_mine": "Lista combinata: considera solo le mie liste", "e_add_to": "Aggiungi a questa lista (vuoto = predefinita)", "read_only": "In questa lista puoi solo vedere o spuntare – aggiungere e modificare non ti è consentito.", "e_stores": "Solo questi negozi (vuoto = tutti)", "e_cat_open": "Categorie aperte all'inizio", "more_n": "+{n} altre", "on_n": "{n}× in lista", "dup_n": "«{name}» è {n} volte in lista", "dup_merge": "Unisci", "e_list_tab": "Mostra la scheda «La mia lista»", "e_cat_src": "Categorie", "cs_auto": "da SmartLists, altrimenti dal negozio", "cs_store": "del negozio, altrimenti di SmartLists", "e_entities": "Solo questi sensori di offerte (vuoto = tutti)", "e_group": "Raggruppa «Tutte le offerte» per", "g_store": "Negozio", "g_cat": "Categoria", "other": "Altro", "tab_watch": "Da tenere d'occhio", "w_add": "Tieni d'occhio un prodotto, ad es. caffè", "w_add_btn": "Aggiungi", "w_empty": "Ancora niente. Inserisci i prodotti di cui aspetti un'offerta.", "w_local": "Salvato su questo dispositivo. Con «watch_list» (una lista di cose da fare) vale su tutti i dispositivi.", "w_ha": "Salvata in Home Assistant: uguale su tutti i tuoi dispositivi.", "w_err": "Impossibile caricare la lista dei preferiti da Home Assistant. Non è stato salvato nulla.", "w_retry": "Riprova", "w_adopted": "{n} prodotti ripresi da questo dispositivo.", "w_list_unused": "La tua lista dei preferiti ora è salvata per te in Home Assistant. La lista «{list}» delle impostazioni della scheda non viene più usata; ciò che contiene resta lì.", "w_list_take": "Copia nella mia lista", "bonus_label": "{amount} di bonus", "bonus_help": "Offerta bonus: paghi il prezzo normale e ricevi il credito nell'app {store}, solo se la usi alla cassa.", "e_bonus": "Uso i programmi bonus (confronta con il bonus)", "with_bonus": "con il bonus sottratto", "w_fixed": "dalla configurazione", "n_title": "Offerta per i prodotti che segui", "e_watch": "Da tenere d'occhio: prodotti", "e_watch_list": "Elenco come lista di cose da fare (tutti i dispositivi)", "e_notify": "Avvisa quando un prodotto seguito è in offerta", "e_notify_service": "Invia anche a (smartphone, servizi – più di uno)", "e_symbol": "Simbolo di valuta personalizzato (al posto di «currency»)", "title": "Offerte", "tab_list": "La mia lista", "tab_all": "Tutte le offerte", "search": "Cerca offerte …", "no_sources": "Nessun sensore di offerte trovato. Installa ad es. un'integrazione di FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) oppure aggiungi un tuo sensore in «sources».", "no_list": "Nessuna lista scelta – indica una lista di cose da fare in «list» per confrontarla con le offerte.", "list_empty": "La lista è vuota.", "none": "nessuna offerta", "offers": "offerte", "offer1": "offerta", "on_offer": "{n} articoli su {m} in offerta", "cheapest": "Scegli le più convenienti", "only": "solo {store}", "chosen": "{n} scelte", "sum": "Totale", "apply": "Riporta nella lista", "applied": "✓ riportato", "pick_hint": "Tocca un prezzo per scegliere un'offerta", "until": "fino al", "today": "solo oggi", "expired": "scaduta", "add": "Aggiungi alla lista", "added": "✓ in lista", "all": "tutte", "less": "meno", "on_list": "è nella tua lista", "best": "la più conveniente", "item": "Articolo", "no_hits": "Nessun risultato.", "exp_n": "Offerte scadute nella lista: {n}", "exp_remove": "Rimuovi", "exp_later": "Più tardi", "all_cats": "Tutte le categorie", "error": "Non ha funzionato.", "attached": "offerta scelta", "stand": "aggiornato al", "in_offer": "in offerta", "without": "senza offerta", "e_title": "Titolo", "e_list": "Lista della spesa (cose da fare)", "e_match": "Un articolo corrisponde a un'offerta se", "m_word": "parola intera nel nome (burro ≠ biscotto al burro)", "m_exact": "solo esattamente questa parola", "m_part": "parte del nome", "e_tab": "Scheda iniziale", "e_images": "Immagini", "e_unit": "Prezzo unitario (€/kg, €/l)", "e_until": "Valida fino al", "e_hide_none": "Nascondi gli articoli senza offerta", "e_max": "Offerte per negozio (scheda «Tutte») – al massimo 20", "e_view": "Vista «Tutte le offerte»", "v_tiles": "Riquadri", "v_list": "Elenco con piccole immagini", "e_lview": "Vista «La mia lista»", "v_chips": "Prezzi affiancati", "v_rows": "un'offerta per riga", "e_sources": "Le fonti vengono riconosciute automaticamente. Sensori propri e mappatura dei campi: nell'editor di codice in «sources» (vedi README).", "from": "dal", "w_now": "Adesso", "w_next": "Dal {date}", "tr_up": "▲ {price} il {date}", "tr_down": "▼ prima {price}", "bk_title": "La spesa più conveniente", "bk_one": "Un negozio", "bk_two": "Due negozi", "bk_n": "{n} negozi", "bk_items": "{n} di {m} voci in offerta", "bk_saves": "risparmi {sum}", "soon_title": "Presto in offerta:", "e_trend": "Avviso se un’offerta prima costava meno o di più", "wl_yours": "Le tue liste dei preferiti", "wl_new": "Nuova lista dei preferiti", "wl_rename": "Rinomina", "wl_default": "Imposta come predefinita", "wl_is_default": "predefinita", "wl_delete": "Elimina lista dei preferiti", "wl_delete_sure": "Eliminare davvero?", "wl_name": "Nome della lista dei preferiti", "wl_ok": "OK", "wl_cancel": "Annulla", "wl_all": "Tutte le liste dei preferiti", "wl_all_hint": "Tutte le tue liste insieme. I nuovi prodotti vanno nella lista predefinita, la rimozione vale per ogni lista.", "wl_private": "Solo tu vedi le tue liste dei preferiti.", "bk_more": "{n} articoli in più per {sum}", "bk_rest": "gli altri {sum} in meno", "bk_big1": "1 confezione più grande", "bk_big": "{n} confezioni più grandi", "bk_bigger": "confezione più grande", "bk_more_pay": "+{sum} alla cassa", "bk_amount": "{a} invece di {b}", "bk_per": "{a} invece di {b}", "bk_same": "per {a} sono {sum} in meno", "loading": "Caricamento …", "e_collect": "Raccogli prima in «La mia lista» (＋ in «Tutte le offerte» mette da parte, «La mia lista» aggiunge)", "st_title": "Messi da parte", "st_add": "Metti da parte", "st_on": "Messo da parte", "st_apply": "Aggiungi alla lista", "st_clear": "Svuota", "cs_store_only": "solo dal negozio", "w_user": "Salvato in Home Assistant: solo per te, su tutti i tuoi dispositivi.", "w_to_todo": "Tieni come lista di cose da fare", "w_todo_pick": "Lista di cose da fare", "w_todo_new": "Crea una nuova lista di cose da fare", "w_todo_name": "Nome della nuova lista", "w_todo_hint": "I prodotti passano a una lista di cose da fare e questa scheda te li mostra da lì. Tutti gli utenti di Home Assistant vedono una lista di cose da fare.", "w_todo_go": "Sposta", "w_todo_fail": "Impossibile creare la lista di cose da fare.", "w_todo_none": "Nessuna lista di cose da fare da scegliere. Solo gli amministratori possono crearne una.", "w_linked": "La tua lista dei preferiti è nella lista di cose da fare «{list}».", "w_unlink": "Tienila di nuovo privata", "e_show_title": "Mostra titolo e numero di offerte", "tab_shop": "La mia lista della spesa", "sh_connect_title": "Collega la tua lista della spesa", "sh_connect_sub": "Così vedi qui cosa hai aggiunto dalle offerte.", "sh_pick": "Scegli una lista …", "sh_from_offers": "Aggiunti dalle offerte", "sh_rest": "Altri articoli", "sh_sum": "Offerte nella lista", "sh_empty": "La lista è vuota. ＋ in «Tutte le offerte» aggiunge qualcosa.", "sh_done": "Fatto", "sh_change": "Collega un’altra lista", "on_yours": "Nella tua lista", "e_shop_view": "Mostra «La mia lista della spesa»", "sv_own": "Vista propria (offerte in alto)", "sv_smart": "Nello stile di SmartLists", "e_preview": "Sensori con le offerte della prossima settimana (anteprima)", "sh_not_yet": "valido dal {date}", "sh_later": "Non ancora valido", "sh_next": "dal {date} {price} da {store} (invece di {old})", "e_preview_start": "Un’anteprima senza data inizia di (se il negozio non indica la fine delle offerte in corso)", "no_offers_now": "Oggi nessuna offerta valida: i sensori non hanno offerte valide al momento (ad esempio tra due volantini). Le nuove compariranno qui."},
  "pl": {"cm_title": "Powiąż kategorie sklepu", "cm_help": "Po lewej kategoria podawana przez sklep, po prawej nazwa, pod którą ma się pojawić – np. kategoria SmartLists. Puste = bez zmian, ∅ = nie liczy się jako kategoria.", "cm_keep": "bez zmian", "cm_none": "brak kategorii", "cm_empty": "Sensory nie podają teraz żadnych kategorii.", "e_locked": "Ustaw na stałe – bez przełączania w karcie", "lk_list": "Widok „Moja lista” (▦ ☰ ≡ ▤)", "lk_all": "„Wszystkie promocje”: kafelki / lista", "lk_group": "„Wszystkie promocje”: wg sklepu / kategorii", "lk_add": "Lista docelowa nowych produktów", "add_in": "Nowe produkty do", "add_std": "lista domyślna", "e_cat_map": "Powiąż kategorie sklepu (kategoria sklepu: wybrana kategoria)", "unit_low": "Najniższa cena jednostkowa", "v_compact": "zwarty – jeden wiersz na produkt", "v_table": "tabela – sklepy w kolumnach", "e_tabs": "Widoczne zakładki (przeciągnij, aby zmienić kolejność)", "e_flow": "Układ kafelków", "tf_grid": "z góry na dół (siatka)", "tf_scroll": "w jednym rzędzie do przewijania", "search_targets": "Szukaj", "s_look": "Wygląd", "s_watch": "Obserwowane i powiadomienia", "s_more": "Zaawansowane", "e_mine": "Lista łączona: uwzględniaj tylko moje listy", "e_add_to": "Dodawaj do tej listy (puste = domyślna)", "read_only": "Na tej liście możesz tylko przeglądać lub odhaczać – dodawanie i zmiany nie są dla ciebie włączone.", "e_stores": "Tylko te sklepy (puste = wszystkie)", "e_cat_open": "Kategorie początkowo rozwinięte", "more_n": "+{n} więcej", "on_n": "{n}× na liście", "dup_n": "„{name}” jest na liście {n} razy", "dup_merge": "Połącz", "e_list_tab": "Pokaż zakładkę „Moja lista”", "e_cat_src": "Kategorie", "cs_auto": "z SmartLists, w innym razie ze sklepu", "cs_store": "ze sklepu, w razie braku ze SmartLists", "e_entities": "Tylko te sensory promocji (puste = wszystkie)", "e_group": "Grupuj „Wszystkie promocje” według", "g_store": "Sklep", "g_cat": "Kategoria", "other": "Inne", "tab_watch": "Obserwowane", "w_add": "Obserwuj produkt, np. kawa", "w_add_btn": "Obserwuj", "w_empty": "Jeszcze nic. Wpisz produkty, na których promocję czekasz.", "w_local": "Zapisane na tym urządzeniu. Z „watch_list” (lista zadań) obserwowane działają na wszystkich urządzeniach.", "w_ha": "Zapisana w Home Assistant – taka sama na wszystkich Twoich urządzeniach.", "w_err": "Nie udało się wczytać listy obserwowanych z Home Assistant. Nic nie zostało zapisane.", "w_retry": "Spróbuj ponownie", "w_adopted": "Przeniesiono {n} produktów z tego urządzenia.", "w_list_unused": "Twoja lista obserwowanych jest teraz zapisana dla Ciebie w Home Assistant. Lista zadań „{list}” z ustawień karty nie jest już do tego używana; jej zawartość pozostaje.", "w_list_take": "Skopiuj na moją listę", "bonus_label": "{amount} bonusu", "bonus_help": "Oferta bonusowa: płacisz normalną cenę, a kredyt trafia do aplikacji {store} – tylko jeśli użyjesz jej przy kasie.", "e_bonus": "Korzystam z programów bonusowych (porównuj z bonusem)", "with_bonus": "po odjęciu bonusu", "w_fixed": "z konfiguracji", "n_title": "Promocja dla obserwowanych", "e_watch": "Obserwowane: produkty", "e_watch_list": "Obserwowane jako lista zadań (wszystkie urządzenia)", "e_notify": "Powiadom, gdy obserwowany produkt jest w promocji", "e_notify_service": "Wyślij też do (smartfony, usługi – można kilka)", "e_symbol": "Własny symbol waluty (zamiast „currency”)", "title": "Promocje", "tab_list": "Moja lista", "tab_all": "Wszystkie promocje", "search": "Szukaj promocji …", "no_sources": "Nie znaleziono sensorów promocji. Zainstaluj np. integrację od FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) albo dodaj własny sensor w „sources”.", "no_list": "Nie wybrano listy – wpisz listę zadań w „list”, aby porównać ją z promocjami.", "list_empty": "Lista jest pusta.", "none": "brak promocji", "offers": "promocji", "offer1": "promocja", "on_offer": "{n} z {m} produktów w promocji", "cheapest": "Wybierz najtańsze", "only": "tylko {store}", "chosen": "wybrano: {n}", "sum": "Suma", "apply": "Przenieś na listę", "applied": "✓ przeniesiono", "pick_hint": "Dotknij ceny, aby wybrać promocję", "until": "do", "today": "tylko dziś", "expired": "wygasła", "add": "Na listę", "added": "✓ na liście", "all": "wszystkie", "less": "mniej", "on_list": "jest na twojej liście", "best": "najtańsza", "item": "Produkt", "no_hits": "Nic nie znaleziono.", "exp_n": "Wygasłe promocje na liście: {n}", "exp_remove": "Usuń", "exp_later": "Później", "all_cats": "Wszystkie kategorie", "error": "Nie udało się.", "attached": "wybrano promocję", "stand": "stan na", "in_offer": "w promocji", "without": "bez promocji", "e_title": "Tytuł", "e_list": "Lista zakupów (zadania)", "e_match": "Produkt pasuje do promocji, gdy", "m_word": "całe słowo w nazwie (masło ≠ ciastko maślane)", "m_exact": "tylko dokładnie to słowo", "m_part": "część nazwy", "e_tab": "Zakładka startowa", "e_images": "Zdjęcia", "e_unit": "Cena jednostkowa (€/kg, €/l)", "e_until": "Ważne do", "e_hide_none": "Ukryj produkty bez promocji", "e_max": "Promocji na sklep (zakładka „Wszystkie”) – najwyżej 20", "e_view": "Widok „Wszystkie promocje”", "v_tiles": "Kafelki", "v_list": "Lista z małymi zdjęciami", "e_lview": "Widok „Moja lista”", "v_chips": "Ceny obok siebie", "v_rows": "jedna promocja w wierszu", "e_sources": "Źródła są wykrywane automatycznie. Własne sensory i mapowanie pól: w edytorze kodu w „sources” (zob. README).", "from": "od", "w_now": "Teraz", "w_next": "Od {date}", "tr_up": "▲ {price} dnia {date}", "tr_down": "▼ wcześniej {price}", "bk_title": "Najtańsze zakupy", "bk_one": "Jeden sklep", "bk_two": "Dwa sklepy", "bk_n": "Sklepy: {n}", "bk_items": "{n} z {m} pozycji w ofercie", "bk_saves": "oszczędzasz {sum}", "soon_title": "Wkrótce w ofercie:", "e_trend": "Wskazówka, gdy oferta była wcześniej tańsza lub droższa", "wl_yours": "Twoje listy obserwowanych", "wl_new": "Nowa lista obserwowanych", "wl_rename": "Zmień nazwę", "wl_default": "Ustaw jako domyślną", "wl_is_default": "domyślna", "wl_delete": "Usuń listę obserwowanych", "wl_delete_sure": "Na pewno usunąć?", "wl_name": "Nazwa listy obserwowanych", "wl_ok": "OK", "wl_cancel": "Anuluj", "wl_all": "Wszystkie listy obserwowanych", "wl_all_hint": "Wszystkie Twoje listy razem. Nowe produkty trafiają na listę domyślną, usunięcie dotyczy każdej listy.", "wl_private": "Tylko ty widzisz swoje listy obserwowanych.", "bk_more": "{n} produktów więcej za {sum}", "bk_rest": "pozostałe taniej o {sum}", "bk_big1": "1 większe opakowanie", "bk_big": "Większe opakowania: {n}", "bk_bigger": "większe opakowanie", "bk_more_pay": "+{sum} przy kasie", "bk_amount": "{a} zamiast {b}", "bk_per": "{a} zamiast {b}", "bk_same": "za {a} to o {sum} mniej", "loading": "Wczytywanie …", "e_collect": "Najpierw zbieraj w „Moja lista” (＋ w „Wszystkie promocje” odkłada, „Moja lista” dodaje)", "st_title": "Odłożone", "st_add": "Odłóż", "st_on": "Odłożone", "st_apply": "Dodaj do listy", "st_clear": "Wyczyść", "cs_store_only": "tylko ze sklepu", "w_user": "Zapisane w Home Assistant – tylko dla ciebie, na wszystkich twoich urządzeniach.", "w_to_todo": "Prowadź jako listę zadań", "w_todo_pick": "Lista zadań", "w_todo_new": "Utwórz nową listę zadań", "w_todo_name": "Nazwa nowej listy", "w_todo_hint": "Produkty przenoszą się na listę zadań, a ta karta pokazuje ci je stamtąd. Listę zadań widzą wszyscy użytkownicy Home Assistant.", "w_todo_go": "Przenieś", "w_todo_fail": "Nie udało się utworzyć listy zadań.", "w_todo_none": "Brak listy zadań do wyboru. Nową mogą utworzyć tylko administratorzy.", "w_linked": "Twoja lista obserwowanych jest na liście zadań „{list}”.", "w_unlink": "Prowadź znów prywatnie", "e_show_title": "Pokaż tytuł i liczbę promocji", "tab_shop": "Moja lista zakupów", "sh_connect_title": "Połącz swoją listę zakupów", "sh_connect_sub": "Wtedy zobaczysz tutaj, co dodano z promocji.", "sh_pick": "Wybierz listę …", "sh_from_offers": "Dodane z promocji", "sh_rest": "Pozostałe pozycje", "sh_sum": "Promocje na liście", "sh_empty": "Lista jest pusta. ＋ w „Wszystkie promocje” coś doda.", "sh_done": "Gotowe", "sh_change": "Połącz inną listę", "on_yours": "Na twojej liście", "e_shop_view": "Pokaż „Moja lista zakupów”", "sv_own": "Własny widok (promocje na górze)", "sv_smart": "W stylu SmartLists", "e_preview": "Czujniki z promocjami na przyszły tydzień (zapowiedź)", "sh_not_yet": "ważne od {date}", "sh_later": "Jeszcze nieważne", "sh_next": "od {date} {price} w {store} (zamiast {old})", "e_preview_start": "Zapowiedź bez daty zaczyna się w (jeśli sklep nie podaje końca bieżących promocji)", "no_offers_now": "Dziś żadna promocja nie obowiązuje – czujniki nie mają teraz ważnych promocji (np. między dwiema gazetkami). Nowe pojawią się tutaj."},
};
const DEFAULTS = { show_title: true, preview_start: "monday", shop_view: "own", use_bonus: false, show_cheapest_trip: false, collect_first: false, list: "", match: "word", default_tab: "all", show_images: true, show_unit_price: true, show_valid_until: true, show_price_trend: true, hide_without_offer: false, max_per_store: 10, all_view: "tiles", list_view: "chips", sources: "auto", group_by: "store", tile_flow: "grid", mine_only: false, add_to: "", category_source: "auto", categories_open: true, watch: [], watch_list: "", notify: false, notify_service: "" };
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
  .lrow .pr { min-width:74px; flex:none; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .lrow .pr .withbonus { display:block; font-size:.74rem; }  /* Preis mit Bonus unter den echten Preis, sonst schiebt er sich über den Zähler */
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
  .staged { margin-bottom:10px; padding:10px 12px; border:1px solid var(--sd-accent); border-radius:12px; }
  .staged .bh { display:flex; align-items:center; gap:6px; font-weight:600; margin-bottom:6px; } .staged .sp { flex:1; }
  .staged .strow { display:flex; align-items:center; gap:8px; padding:4px 0; } .staged .strow .n { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .staged .strow .store { color:#fff; border-radius:6px; padding:1px 6px; font-size:.75rem; font-weight:700; } .staged .acts { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; }
  .staged.onlist { border-color:var(--sd-ok); padding:2px 10px 4px; } .staged.onlist .foldh { display:flex; align-items:center; gap:8px; width:100%; background:none; border:0; color:inherit; font:inherit; padding:8px 0; cursor:pointer; }
  .slwrap { margin:0 -4px; }
  .soon { color:var(--warning-color,#e65100); font-weight:600; } .shopsum small.soon { font-weight:500; }
  .shophead { display:flex; align-items:center; gap:8px; font-size:.86rem; color:var(--secondary-text-color); padding:2px 2px 6px; } .shophead .sp { flex:1; }
  .grp2 { font-size:.78rem; color:var(--secondary-text-color); padding:10px 2px 2px; }
  .lrow .ck { width:22px; height:22px; flex:none; border-radius:50%; border:1.5px solid var(--secondary-text-color); background:none; cursor:pointer; padding:0; }
  .lrow .ck:hover { border-color:var(--sd-ok); background:rgba(67,160,71,.15); }
  .lrow .n small .store { color:#fff; border-radius:5px; padding:0 5px; font-size:.7rem; font-weight:700; } .lrow .exp { color:var(--error-color,#db4437); } .lrow .hint { color:var(--sd-ok); }
  .shopsum { display:flex; justify-content:space-between; padding:10px 2px 0; margin-top:6px; border-top:1px solid var(--divider-color,#e0e0e0); font-size:.86rem; }
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

class SmartDiscountsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(TAG + "-editor"); }
  static getStubConfig(hass) {
    const todo = Object.keys((hass && hass.states) || {}).find((e) => e.startsWith("todo."));
    return { list: todo || "" };
  }
  setConfig(config) {
    const before = this._config;
    this._config = { ...DEFAULTS, ...(config || {}) };
    // „Meine Einkaufsliste“: ohne `list` in der Karte gilt die Liste, die man in der Karte verbunden hat (dieser Browser)
    setPreviewDay(this._config.preview_start);
    this._pickKey = this._memKey("picked"); this._picked = false;
    if (!this._config.list) { try { const v = localStorage.getItem(this._pickKey); if (v) { this._config.list = v; this._picked = true; } } catch (e) { /* */ } }
    // Beim Ändern einer Einstellung (Editor) bleibt man, wo man ist: Reiter, Suche, Auf- und Zugeklapptes. Nur beim
    // ersten Aufbau – oder wenn gerade der Start-Reiter geändert wurde – gilt `default_tab`.
    if (!before || before.default_tab !== this._config.default_tab || !this._tab) {
      this._tab = ["all", "watch", "shop"].includes(this._config.default_tab) ? this._config.default_tab : "list";
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
    if (this._slCard) this._slCard.hass = hass;  // eingebettete SmartLists-Karte („Meine Einkaufsliste“ im Stil von SmartLists)
    this._refresh(false);
  }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  // "entities": nur diese Sensoren (z. B. eine Karte nur für REWE) – einfache Form von "sources", im Editor auswählbar.
  // Eigene Angaben unter "sources" (store, color, map) bleiben für diese Sensoren erhalten.
  _src() {
    const base = this._srcBase(), c = this._config;
    // "preview_entities": diese Sensoren liefern die Angebote der nächsten Woche – sie zählen als Vorschau und kommen dazu
    const pv = (Array.isArray(c.preview_entities) ? c.preview_entities : c.preview_entities ? [c.preview_entities] : []).filter((e) => typeof e === "string" && e);
    if (!pv.length) return base;
    const arr = Array.isArray(base) ? base.slice() : ["auto"];
    pv.forEach((e) => {
      const i = arr.findIndex((s) => (typeof s === "string" ? s : s && s.entity) === e);
      const obj = i >= 0 && typeof arr[i] === "object" ? { ...arr[i], preview: true } : { entity: e, preview: true };
      if (i >= 0) arr[i] = obj; else arr.push(obj);
    });
    return arr;
  }
  _srcBase() {
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
        // Kombinierte Liste: zu jedem Eintrag der Name seiner Quell-Liste (für „Meine Einkaufsliste“)
        const nm = r && r.type === "combined" && Array.isArray(r.sources) ? Object.fromEntries(r.sources.map((x) => [x.entity_id, x.name || x.entity_id])) : null;
        this._srcName = nm && Array.isArray(r.items) ? Object.fromEntries(r.items.map((i) => [i.uid, nm[i.source_entity] || ""])) : {};
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
  // ----- Meine Einkaufsliste: die Einträge der verbundenen Liste – oben, was aus Angeboten kam
  // Angebot an einem Eintrag: ⚙OFFER-Zeile (SmartLists) oder die lesbare 🏷️-Zeile
  _noteOffer(note) {
    const s = String(note || ""), m = s.match(/[⚙\u2699]\ufe0f?\s*OFFER\s*:\s*(\{.*\})/);
    if (m) { try { const j = JSON.parse(m[1]); if (j && j.s) return { store: String(j.s), price: num(j.p), until: j.e || "", from: this._soonDay(j.v), bonus: num(j.b) ? { value: num(j.b), kind: j.bk === "pct" ? "pct" : "eur" } : null }; } catch (e) { /* */ } }
    const l = s.split("\n").find((x) => /^\s*🏷️/.test(x));
    if (!l) return null;
    const p = l.replace(/^\s*🏷️\s*/, "").split(" · ");
    // nach Markt und Preis nur, was zum Angebot gehört (Bonus, Nachlass, „bis …“) – nicht noch einmal den Preis oder den Namen
    const keep = new RegExp(`^(🎁|${this._t.until} |bis |until |statt |\\(statt )|%`, "i");
    // „ab 23.11.2026“ / „ab 23.11.“ (so schreibt es SmartLists) → Startdatum, wenn es noch in der Zukunft liegt
    const ab = p.slice(2).map((x) => x.match(new RegExp(`^(?:ab|from|${this._t.from})\\s+(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})?`, "i"))).find(Boolean);
    let from = "";
    if (ab) { const now = new Date(); let y = ab[3] ? +ab[3] : now.getFullYear(); const mk = (yy) => `${yy}-${String(ab[2]).padStart(2, "0")}-${String(ab[1]).padStart(2, "0")}`;
      if (!ab[3] && mk(y) < new Date(now.getTime() - 200 * 864e5).toISOString().slice(0, 10)) y += 1; from = this._soonDay(mk(y)); }
    return { store: p[0] || "", price: num(p[1]), from, text: p.slice(2).filter((x) => keep.test(x)).join(" · ") };
  }
  // Startdatum nur, solange es noch nicht erreicht ist
  _soonDay(d) {
    const v = String(d || "").slice(0, 10), n = new Date(), today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    return /^\d{4}-\d\d-\d\d$/.test(v) && v > today ? v : "";
  }
  _weekday(d) { try { return new Date(`${d}T12:00:00`).toLocaleDateString(this._hass.language || "de", { weekday: "short" }); } catch (e) { return ""; }
  }
  _shopConnect() {
    const t = this._t;
    const todos = Object.keys(this._hass.states).filter((e) => e.startsWith("todo."));
    const sel = h("select", { class: "search", "aria-label": t.sh_pick, onchange: (e) => {
      if (!e.target.value) return;
      try { localStorage.setItem(this._pickKey, e.target.value); } catch (err) { /* gilt, solange die Karte offen ist */ }
      this._config = { ...this._config, list: e.target.value }; this._picked = true; this._items = undefined; this._perm = null; this._sig = null; this._refresh(true);
    } }, h("option", { value: "" }, t.sh_pick), todos.map((e) => h("option", { value: e }, (this._hass.states[e].attributes || {}).friendly_name || e)));
    return h("div", { class: "msg" }, h("div", { style: "font-size:1.6rem" }, "🛒"), h("b", {}, t.sh_connect_title), h("div", { style: "margin:4px 0 12px" }, t.sh_connect_sub), sel);
  }
  async _checkOff(it) {
    this._items = this._items.filter((x) => x !== it); this._render();
    try { await this._hass.callService("todo", "update_item", { item: it.uid, status: "completed" }, { entity_id: this._config.list }); this._sig = null; await this._loadList(true); this._render(); }
    catch (e) { await this._loadList(true); this._render(); this._toastErr(e); }
  }
  _renderShop() {
    const t = this._t, c = this._config;
    if (!c.list || !this._hass.states[c.list]) return this._shopConnect();
    // shop_view: smartlists – die Liste in der echten SmartLists-Karte zeigen (nur mit SmartLists, sonst die eigene Ansicht)
    if (c.shop_view === "smartlists" && this._smart() && customElements.get("smartlists-card")) {
      if (!this._slCard || this._slFor !== c.list) {
        try {
          const el = document.createElement("smartlists-card");
          el.setConfig({ type: "custom:smartlists-card", entity: c.list, show_title: false });
          this._slCard = el; this._slFor = c.list; this._slWrap = h("div", { class: "slwrap" }, el);
        } catch (e) { this._slCard = null; this._slWrap = null; }
      }
      if (this._slCard) { this._slCard.hass = this._hass; return this._slWrap; }
    }
    if (this._loading && this._items === undefined) return h("div", { class: "msg" }, t.loading);
    const items = this._items || [], st = this._hass.states[c.list];
    const unlink = this._picked ? h("button", { type: "button", class: "btn", title: t.sh_change, "aria-label": t.sh_change, onclick: () => {
      try { localStorage.removeItem(this._pickKey); } catch (e) { /* */ }
      this._config = { ...this._config, list: "" }; this._picked = false; this._items = undefined; this._render(); } }, "✎") : null;
    const head = h("div", { class: "shophead" }, h("span", {}, "📋 ", (st.attributes && st.attributes.friendly_name) || c.list), unlink, h("span", { class: "sp" }), this._addPick());
    // Kommt das Produkt nächste Woche günstiger (oder überhaupt erst ins Angebot)? Dann am Eintrag sagen
    const nextHint = (it, o, deals) => {
      if ((o && o.from) || !this._next.length || !it.name) return null;
      // verglichen wird nur der Grundpreis (€/l, €/kg) – ein Sechserpack ist nicht „günstiger“ als ein Kasten
      const now = (o ? dealsForCached(this._all, it.name, c.match).filter((d) => d.store === o.store && (o.price == null || Math.abs((d.full ?? d.price) - o.price) < 0.005)) : deals || []).filter((d) => d.unit);
      const best = (list, u) => list.filter((d) => d.unit && (!u || d.unit.unit === u)).sort((x, y) => (x.unit.full ?? x.unit.value) - (y.unit.full ?? y.unit.value))[0];
      const cur = best(now);
      if (!cur) return null;
      const nx = best(dealsForCached(this._next, it.name, c.match), cur.unit.unit);
      const up = (d) => d.unit.full ?? d.unit.value;
      if (!nx || up(nx) >= up(cur) - 0.004) return null;
      return [" · ", h("span", { class: "soon" }, `📅 ${t.sh_next.replace("{date}", this._day(nx.from)).replace("{price}", `${this._money(up(nx))}/${nx.unit.unit}`).replace("{old}", `${this._money(up(cur))}/${cur.unit.unit}`).replace("{store}", nx.store)}`)];
    };
    const row = (it) => {
      const o = this._noteOffer(it.note), n = this._countOf(it.text), exp = o && this._expiredNote(it.note), deals = o ? [] : this._matchesFor(it);
      const col = o ? (this._all.find((x) => x.store === o.store) || {}).color || "#888" : "";
      const bonus = o && o.bonus ? ` · 🎁 ${o.bonus.kind === "pct" ? `${String(o.bonus.value).replace(".", ",")} %` : this._money(o.bonus.value)}` : "";
      const sub = o ? [h("span", { class: "store", style: `background:${col}` }, o.store), o.price != null ? ` ${this._money(o.price)}` : "", o.text ? ` · ${o.text}` : "", bonus,
        o.from ? [" ", h("span", { class: "soon" }, `⏳ ${t.sh_not_yet.replace("{date}", `${this._weekday(o.from)}, ${this._day(o.from)}`)}`)]
          : o.until ? [" · ", exp ? h("span", { class: "exp" }, t.expired) : `${t.until} ${this._day(o.until)}`] : "", nextHint(it, o)]
        : [deals.length ? h("span", { class: "hint" }, `${deals.length} ${deals.length > 1 ? t.offers : t.offer1} ${t.from} ${this._money(Math.min(...deals.map((d) => d.price)))}`) : null, nextHint(it, null, deals)].filter(Boolean);
      const src = (this._srcName || {})[it.uid];
      const name = String(this._withCount(it.text, 1)).split(/\s+/).filter((w) => w && !/^[@#*!+~]/.test(w)).join(" ") || it.text;
      return h("div", { class: "lrow" },
        this._may("toggle") ? h("button", { type: "button", class: "ck", title: t.sh_done, "aria-label": `${t.sh_done}: ${name}`, onclick: () => this._checkOff(it) }) : null,
        h("div", { class: "n" }, name, sub || src ? h("small", {}, sub, sub && src ? " · " : "", src || "") : null),
        this._may("rename") ? h("span", { class: "stepper slot" },
          h("button", { type: "button", "aria-label": `− ${name}`, onclick: () => this._stepIt(it, -1) }, "−"), h("b", {}, String(n)),
          h("button", { type: "button", "aria-label": `+ ${name}`, onclick: () => this._stepIt(it, 1) }, "+")) : h("b", {}, `${n}×`));
    };
    if (!items.length) return h("div", {}, head, h("div", { class: "msg" }, this._error || t.sh_empty));
    // Aus Angeboten: was heute gilt, darunter in einem eigenen Block, was erst später gilt (zählt nicht zur Summe)
    const withO = items.filter((i) => this._noteOffer(i.note)), rest = items.filter((i) => !this._noteOffer(i.note));
    const mine = withO.filter((i) => !this._noteOffer(i.note).from), later = withO.filter((i) => this._noteOffer(i.note).from);
    const total = (list) => list.reduce((a, i) => a + (this._noteOffer(i.note).price || 0) * this._countOf(i.text), 0);
    const first = later.map((i) => this._noteOffer(i.note).from).sort()[0];
    return h("div", {}, head,
      mine.length ? [h("div", { class: "grp2" }, `${t.sh_from_offers} · ${mine.length}`), h("div", { class: "lrows" }, mine.map(row))] : null,
      later.length ? [h("div", { class: "grp2" }, `⏳ ${t.sh_later} · ${later.length}`), h("div", { class: "lrows" }, later.map(row))] : null,
      rest.length ? [h("div", { class: "grp2" }, `${t.sh_rest} · ${rest.length}`), h("div", { class: "lrows" }, rest.map(row))] : null,
      withO.length ? h("div", { class: "shopsum" }, h("span", {}, t.sh_sum, later.length ? h("small", { class: "soon" }, ` + ${this._money(total(later))} ${t.from} ${this._day(first)}`) : null), h("b", {}, this._money(total(mine)))) : null);
  }
  // Gibt es Angebots-Sensoren, auch wenn ihre Liste gerade leer ist oder alles abgelaufen ist?
  _anySensor() {
    if (this._sources().length) return true;
    const st = this._hass.states;
    return Object.keys(st).some((id) => id.startsWith("sensor.") && LIST_ATTRS.some((a) => Array.isArray(st[id].attributes[a])));
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
      // auch die Vorschau der nächsten Woche zeigen („ab 23.11.“) – gemeldet wird erst, wenn sie gilt
      const offers = [...dealsForCached(this._all, term.name, c.match), ...dealsForCached(this._next || [], term.name, c.match)];
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
    const head = c.show_title === false ? null : h("div", { class: "head" }, h("h1", {}, c.title || t.title), h("small", {}, `${this._all.length} ${t.offers} · ${stores.length ? stores.join(", ") : "–"}`));
    const hits = this._watchHits();
    const names = { list: "📝 " + t.tab_list + (this._collect() && this._staged.length ? ` · 🛒 ${this._staged.length}` : ""), shop: "🛒 " + t.tab_shop + (this._items && this._items.length ? ` · ${this._items.length}` : ""), all: "🏷️ " + t.tab_all, watch: "⭐ " + t.tab_watch + (hits ? ` · ${hits}` : "") };
    const shown = this._tabs();
    // nur ein Reiter gewählt: keine Reiter-Leiste
    const tabs = shown.length > 1 ? h("div", { class: "tabs" }, shown.map((v) =>
      h("button", { type: "button", class: this._tab === v ? "on" : "", onclick: () => { this._tab = v; this._render(); } }, names[v]))) : null;
    const body = this._tab === "shop" ? this._renderShop() : !this._all.length && !(this._next || []).length ? h("div", { class: "msg" }, this._anySensor() ? t.no_offers_now : t.no_sources) : this._tab === "list" ? this._renderList(stores) : this._tab === "watch" ? this._renderWatch() : this._renderAll(stores);
    this._card.className = `wrap ${c.show_images ? "" : "noimg"}`;
    // Die eingebettete SmartLists-Karte bleibt im Dokument stehen (sonst baut sie sich bei jedem Zeichnen neu auf):
    // nur Kopf und Reiter davor austauschen
    if (body && body === this._slWrap && body.parentNode === this._card) {
      while (this._card.firstChild !== body) this._card.firstChild.remove();
      while (this._card.lastChild !== body) this._card.lastChild.remove();
      body.before(...[head, tabs].filter(Boolean));
      return;
    }
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
    // „Meine Einkaufsliste“ (shop) steht an der Stelle des früheren „Meine Liste“ (list)
    const c = this._config, all = LIST_TAB ? ["shop", "list", "all", "watch"] : ["shop", "all", "watch"];
    const picked = (Array.isArray(c.tabs) ? c.tabs : []).map((x) => (x === "list" && !LIST_TAB ? "shop" : x)).filter((x, i, a) => all.includes(x) && a.indexOf(x) === i);
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
    // je Angebots-Name nur einmal je Stand der Liste prüfen (wird je Zeile und beim Sortieren der Regale gefragt)
    this._counts(); const memo = this._onl;
    const onList = (o) => { let v = memo.get(o.name); if (v === undefined) { v = names.some((n) => matches(n, o.name, c.match)); memo.set(o.name, v); } return v; };
    const q = norm(this._query);
    // gibt es Angebote, die erst später gelten (Prospekt der nächsten Woche)? Dann oben umschaltbar
    const soonFrom = this._next.length ? this._next.map((o) => o.from).sort()[0] : null;
    if (!soonFrom) this._when = "now";
    // heute gilt nichts mehr (z. B. sonntags zwischen zwei Prospekten), aber die Vorschau ist da: gleich die zeigen
    else if (!this._all.length) this._when = "next";
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
    // Oben: was von diesen Angeboten schon auf der Liste steht (zum Einklappen) – im Regal bleibt es zusätzlich stehen
    const cnt = this._counts();
    const seen = new Set();
    const mineNow = cnt.size && !q && !this._cat ? pool.filter((o) => cnt.get(this._key(o.name)) && !seen.has(`${o.store}|${o.name}`) && seen.add(`${o.store}|${o.name}`)) : [];
    const mineSum = mineNow.reduce((a, o) => a + (o.full ?? o.price) * cnt.get(this._key(o.name)), 0);
    const mineBox = mineNow.length ? h("div", { class: "staged onlist" },
      h("button", { type: "button", class: "foldh", "aria-expanded": String(!this._mineShut), onclick: () => { this._mineShut = !this._mineShut; this._render(); } },
        h("b", {}, `🛒 ${t.on_yours} · ${mineNow.length}`), h("span", { class: "sp" }), h("small", {}, this._money(mineSum)), h("span", { class: "chev" }, this._mineShut ? "›" : "⌄")),
      this._mineShut ? null : h("div", { class: "lrows" }, mineNow.map(row))) : null;
    return h("div", {}, h("div", { class: "filters" }, search, this._locked("group_by") ? null : gbtn, this._locked("all_view") ? null : toggle), whenSel, catSel, mineBox, shown.length ? shelves : h("div", { class: "msg" }, t.no_hits), this._foot());
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
    if (smart) return `⚙OFFER:${JSON.stringify({ s: o.store, p: o.full ?? o.price, ...(o.old ? { o: o.old } : {}), ...(o.until ? { e: o.until } : {}), ...(o.soon && o.from ? { v: o.from } : {}), ...(o.category ? { c: String(o.category).slice(0, 60) } : {}), ...bonus, a: Math.floor(Date.now() / 1000) })}`;
    // Datum mit Jahr, damit sich ein abgelaufenes Angebot später erkennen lässt
    const extra = o.bonus ? ` · 🎁 ${this._t.bonus_label.replace("{amount}", o.bonus.kind === "pct" ? `${o.bonus.value} %` : this._money(o.bonus.value)).replace("{store}", o.store)}` : "";
    const start = o.soon && o.from ? ` · ${this._t.from} ${this._day(o.from)}${String(o.from).slice(0, 4)}` : "";
    return `🏷️ ${o.store} · ${this._money(o.full ?? o.price)}${extra}${start}${o.until ? ` · ${this._t.until} ${this._day(o.until)}${String(o.until).slice(0, 4)}` : ""} · ${o.name}`;
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
  // Schlüssel je Text merken und die Anzahl je Schlüssel einmal je Stand der Liste zählen – sonst rechnet jedes Zeichnen
  // für jedes Angebot alle Einträge durch (268 Angebote × 200 Einträge)
  _key(text) {
    const m = this._keys || (this._keys = new Map());
    let k = m.get(text);
    if (k === undefined) { if (m.size > 5000) m.clear(); k = this._keyRaw(text); m.set(text, k); }
    return k;
  }
  _counts() {
    if (this._cntFor !== this._items || !this._cnt) {
      this._cntFor = this._items; this._cnt = new Map(); this._onl = new Map();
      (this._items || []).forEach((i) => { const k = this._key(i.text); if (k) this._cnt.set(k, (this._cnt.get(k) || 0) + this._countOf(i.text)); });
    }
    return this._cnt;
  }
  _keyRaw(text) { return norm(this._withCount(String(text || "").split(/\s+/).filter((w) => w && !/^[@#*!+~]/.test(w)).join(" "), 1)).replace(/\s+/g, " ").trim(); }
  _same(o) { const key = this._key(o.name); return key ? (this._items || []).filter((i) => this._key(i.text) === key) : []; }
  _onListCount(o) { const k = this._key(o.name); return (k && this._counts().get(k)) || 0; }
  // ＋/− zählen sofort (in der Karte), geschrieben wird danach im Hintergrund; danach nur die Einträge neu holen
  async _step(o, delta, btn) {
    const it = this._same(o)[0];
    if (!it) return this._add(o, btn);
    return this._stepIt(it, delta);
  }
  async _stepIt(it, delta) {
    if (String(it.uid).startsWith("tmp-")) return;  // gerade erst hinzugefügt – kurz warten, bis Home Assistant es kennt
    const n = this._countOf(it.text) + delta, before = it.text;
    if (n <= 0) this._items = this._items.filter((x) => x !== it); else { it.text = this._withCount(it.text, n); it.name = itemName(it.text); }
    this._cntFor = null;
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
    // auch wenn in eine Quell-Liste der kombinierten Liste geschrieben wird: der Eintrag erscheint ja in dieser Liste
    this._items = [...(this._items || []), { uid: `tmp-${Date.now()}`, text: o.name, note, name: itemName(o.name) }];
    this._render();
    try {
      // "add_to": in diese Liste hinzufügen (z. B. die eigene Quell-Liste einer kombinierten Liste) – sonst in "list"
      await this._hass.callService("todo", "add_item", { item: o.name, description: note }, { entity_id: this._addTarget() });
      this._sig = null; await this._loadList(true); this._render();
    } catch (e) { await this._loadList(true); this._render(); this._toastErr(e); }
  }
}

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
      { name: "show_title", selector: { boolean: {} } },
      { name: "list", selector: { entity: { domain: "todo" } } },
      ...(storeNames.length ? [{ name: "stores", selector: { select: { multiple: true, mode: "dropdown", options: storeNames.map((x) => ({ value: x, label: x })) } } }] : []),
      { name: "entities", selector: { entity: { multiple: true, ...(found.length ? { include_entities: [...new Set([...found, ...(this._config.entities || [])])] } : { domain: "sensor" }) } } },
      { name: "preview_entities", selector: { entity: { multiple: true, domain: "sensor" } } },
      { name: "preview_start", selector: { select: { mode: "dropdown", options: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((value) => ({ value, label: new Date(Date.UTC(2024, 0, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(value) + 1, 12)).toLocaleDateString(this._hass.language || "en", { weekday: "long" }) })) } } },
      { name: "match", selector: { select: { mode: "dropdown", options: [["word", t.m_word], ["exact", t.m_exact], ["part", t.m_part]].map(([value, label]) => ({ value, label })) } } },
      { name: "default_tab", selector: { select: { mode: "dropdown", options: [["shop", t.tab_shop], ...(LIST_TAB ? [["list", t.tab_list]] : []), ["all", t.tab_all], ["watch", t.tab_watch]].map(([value, label]) => ({ value, label })) } } },
      { name: "list_view", selector: { select: { mode: "dropdown", options: [["rows", t.v_rows], ["table", t.v_table]].map(([value, label]) => ({ value, label })) } } },
      b("mine_only"),
      { name: "add_to", selector: { entity: { domain: "todo" } } },
      { name: "collect_first", selector: { boolean: {} } },
      { name: "shop_view", selector: { select: { mode: "dropdown", options: [["own", t.sv_own], ["smartlists", t.sv_smart]].map(([value, label]) => ({ value, label })) } } },
      { name: "tabs", selector: { select: { multiple: true, reorder: true, mode: "list", options: [["shop", t.tab_shop], ...(LIST_TAB ? [["list", t.tab_list]] : []), ["all", t.tab_all], ["watch", t.tab_watch]].map(([value, label]) => ({ value, label })) } } },
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
    const labels = { title: t.e_title, show_title: t.e_show_title, list: t.e_list, match: t.e_match, default_tab: t.e_tab, list_view: t.e_lview, all_view: t.e_view, group_by: t.e_group, entities: t.e_entities, preview_entities: t.e_preview, preview_start: t.e_preview_start, stores: t.e_stores, tabs: t.e_tabs, tile_flow: t.e_flow, sec_look: t.s_look, sec_all: t.tab_all, sec_watch: t.s_watch, sec_more: t.s_more, mine_only: t.e_mine, add_to: t.e_add_to, collect_first: t.e_collect, shop_view: t.e_shop_view, category_source: t.e_cat_src, category_map: t.e_cat_map, locked: t.e_locked, categories_open: t.e_cat_open, show_images: t.e_images, show_unit_price: t.e_unit,
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
    const grouped = [...pick("title", "show_title", "list", "stores"),
      sec("sec_look", "mdi:palette-outline", [...pick("tabs", "default_tab", ...(smart ? ["shop_view"] : []), ...(LIST_TAB ? ["list_view"] : []), "match"), grid, ...pick("locked")]),
      sec("sec_all", "mdi:tag-multiple-outline", pick("all_view", "tile_flow", "group_by", "categories_open", ...(smart ? ["category_source"] : []), "max_per_store")),
      sec("sec_watch", "mdi:star-outline", pick("watch", "watch_list", "notify")),
      sec("sec_more", "mdi:tune", pick("entities", "preview_entities", "preview_start", "add_to", ...(LIST_TAB ? ["collect_first"] : []), ...(smart ? ["mine_only"] : []), "currency_symbol"))];
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
    if (!CATEGORY_MAP) { box.replaceChildren(); return; }
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
