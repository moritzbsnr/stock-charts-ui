# Stock-Charts-UI

Seminarprojekt Web-Komponenten: Eine Web Component zeigt den Kursverlauf einer
Aktie der letzten 30 Tage als Flächen-Chart im dunklen Design.

## Aktueller Stand

- `<stock-chart>` lädt die Tageskurse über die [Twelve-Data-API](https://twelvedata.com)
  und zeichnet sie mit [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/).
- `<stock-search>` ist ein Eingabefeld, über das man das Symbol wechselt.
- Die beiden Komponenten kennen sich nicht. `<stock-search>` meldet das gewählte
  Symbol per Event, und `index.html` setzt es als Attribut am Chart.

```html
<stock-search value="AAPL"></stock-search>
<stock-chart symbol="AAPL"></stock-chart>

<script type="module">
  const chart = document.querySelector('stock-chart');
  document.querySelector('stock-search').addEventListener('symbol-gewaehlt', (event) => {
    chart.setAttribute('symbol', event.detail.symbol);
  });
</script>
```

### `<stock-chart>`

| Attribut | Bedeutung |
|---|---|
| `symbol` | Aktie, z. B. `AAPL` oder `MSFT`. Ändert sich das Attribut, lädt der Chart neu. |

### `<stock-search>`

| Attribut / Event | Bedeutung |
|---|---|
| `value` | Startwert im Eingabefeld (optional). |
| `symbol-gewaehlt` | Event beim Absenden (Enter oder Button). Das Symbol steht groß geschrieben in `event.detail.symbol`. |

### Theme über CSS-Variablen

Beide Komponenten lesen ihre Farben aus CSS-Variablen. CSS-Variablen werden ins
Shadow DOM vererbt, deshalb kann die Seite das Aussehen von außen ändern, ohne
die Komponenten anzufassen. Das aktuelle dunkle Theme mit Violett steht in
`index.html`. Ohne Angaben verwenden die Komponenten dieselben Farben als Vorgabe.

| Variable | Wirkung |
|---|---|
| `--chart-hintergrund` | Hintergrund von Chart und Eingabefeld |
| `--chart-rahmen` | Rahmenfarbe |
| `--chart-text` | Textfarbe |
| `--chart-beschriftung` | Achsenbeschriftung und Platzhalter |
| `--chart-linie` | Kurslinie, Button und Preisschild |
| `--chart-flaeche-oben` / `--chart-flaeche-unten` | Farbverlauf unter der Linie |
| `--chart-fadenkreuz` | Fadenkreuz beim Überfahren mit der Maus |
| `--chart-fehler` | Fehlermeldungen |

Die Chart-Farben werden beim Einfügen des Elements gelesen. Eine spätere Änderung
der Variablen wirkt sich auf den Chart erst nach dem Neuladen der Seite aus.

## Technik

- Reines JavaScript als ES-Module, kein Framework und kein Build-Tool
- Shadow DOM für gekapseltes HTML und CSS
- Lightweight Charts wird per CDN geladen
- Kein eigener Server: die Seite ruft die API direkt aus dem Browser auf

## Projektstruktur

```text
index.html                  Seite, bindet die Komponenten ein und verbindet sie
components/stock-chart.js   Web Component <stock-chart>
components/stock-search.js  Web Component <stock-search>
config.example.js          Vorlage für den API-Key
AI.md                      Dokumentation zum Einsatz von KI
```

## Einrichtung

1. Einen kostenlosen API-Key bei [Twelve Data](https://twelvedata.com) anlegen.
2. `config.example.js` nach `config.js` kopieren und den Key eintragen.
   `config.js` steht in `.gitignore` und wird nicht ins Repo hochgeladen.

> **Hinweis:** Der Key ist nur vor Git geschützt. Da die Seite die API direkt
> aufruft, ist er im Browser in den DevTools sichtbar.

## Starten

ES-Module funktionieren nicht über `file://`, deshalb braucht die Seite einen
lokalen Server, z. B. die VS-Code-Erweiterung **Live Server**

## Einschränkungen (kostenloser Plan)

- 8 API-Anfragen pro Minute, 800 pro Tag
- Bei Überschreitung antwortet die API mit Fehler 429

## Geplant

- Bessere Fehleranzeige (z.B. Limit erreicht)
- Optional ein helles Theme
