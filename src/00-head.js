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
const VERSION = "1.3.21";
const TAG = "smartdiscounts-card";
// Reiter „Meine Liste“ (Abgleich mit der Liste, Sammeln, günstigster Einkauf) – vorerst ausgeschaltet
const LIST_TAB = false;
// Markt-Kategorien mit eigenen verknüpfen (category_map, Abschnitt im Editor) – vorerst ausgeschaltet
const CATEGORY_MAP = false;
if (customElements.get(TAG)) return;  // schon geladen (z. B. doppelt als Ressource eingetragen)

// Texte: je Sprache eine Datei in lang/<sprache>.json – scripts/build.py setzt sie hier ein.
/*__TEXTS__*/
