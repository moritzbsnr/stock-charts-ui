# Stock-Charts-UI

Seminarprojekt Web-Komponenten: Eine Web Component zeigt den Kursverlauf einer
Aktie der letzten 30 Tage als Candlestick-Chart.

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
- Styling über CSS-Variablen, optional Dark Mode
