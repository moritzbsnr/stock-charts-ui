// Abhängigkeiten: Lightweight Charts (als ES-Modul vom CDN) und der eigene API-Key.
import { createChart, AreaSeries, ColorType, LineStyle } from 'https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.mjs';
import { API_KEY } from '../config.js';

// Lädt die letzten 30 Tageskurse für ein Symbol von Twelve Data
// und wandelt sie in das Format um, das Lightweight Charts erwartet.
// Für die Flächen-Darstellung reicht der Schlusskurs (close) jedes Tages.
async function ladeKurse(symbol) {
  const url = 'https://api.twelvedata.com/time_series'
    + '?symbol=' + encodeURIComponent(symbol)
    + '&interval=1day'
    + '&outputsize=30'
    + '&apikey=' + encodeURIComponent(API_KEY);

  const antwort = await fetch(url);
  const daten = await antwort.json();

  // Twelve Data meldet Fehler mit status "error" und einer Nachricht.
  if (daten.status !== 'ok') {
    throw new Error(daten.message);
  }

  // Die API liefert die neuesten Kerzen zuerst und die Zahlen als Text.
  // Lightweight Charts braucht aufsteigende Daten und echte Zahlen.
  return daten.values
    .map((tag) => ({
      time: tag.datetime,
      value: parseFloat(tag.close),
    }))
    .reverse();
}

// Liest eine CSS-Variable vom Element. So lassen sich die Farben des Charts
// von außen per CSS festlegen, obwohl Lightweight Charts selbst kein CSS kennt.
function cssVariable(element, name, ersatz) {
  return getComputedStyle(element).getPropertyValue(name).trim() || ersatz;
}

class StockChart extends HTMLElement {
  // Der Browser meldet Änderungen nur für Attribute, die hier aufgeführt sind.
  static observedAttributes = ['symbol'];

  constructor() {
    super();

    // Shadow DOM: eigener, gekapselter Bereich für HTML und CSS der Komponente.
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        /* Alle Farben kommen aus CSS-Variablen; die Werte nach dem Komma
           sind die Vorgabe, falls die Seite nichts festlegt. */
        :host {
          display: block;
          padding: 1.25rem 1.25rem 0.75rem;
          border-radius: 12px;
          background: var(--chart-hintergrund, #000);
          border: 1px solid var(--chart-rahmen, #1f1f2b);
          color: var(--chart-text, #e5e5ef);
          font-family: system-ui, sans-serif;
        }
        .titel {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .chart {
          height: 400px;
        }
        .meldung {
          margin: 0 0 0.5rem;
          min-height: 1.2em;
          font-size: 0.9rem;
          color: var(--chart-fehler, #f87171);
        }
      </style>
      <h2 class="titel"></h2>
      <p class="meldung"></p>
      <div class="chart"></div>
    `;

    this.titel = shadow.querySelector('.titel');
    this.meldung = shadow.querySelector('.meldung');
    this.chartContainer = shadow.querySelector('.chart');
  }

  // Wird aufgerufen, sobald das Element in die Seite eingefügt wurde.
  connectedCallback() {
    // Farben aus den CSS-Variablen der Seite lesen (mit dunklen Vorgaben).
    const farbe = (name, ersatz) => cssVariable(this, name, ersatz);
    const hintergrund = farbe('--chart-hintergrund', '#000');
    const linie = farbe('--chart-linie', '#7c3aed');
    const beschriftung = farbe('--chart-beschriftung', '#a1a1b5');
    const fadenkreuz = farbe('--chart-fadenkreuz', '#4b4b63');

    // Chart im Container erzeugen; autoSize passt ihn an die Größe des Containers an.
    this.chart = createChart(this.chartContainer, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: hintergrund },
        textColor: beschriftung,
        fontFamily: 'system-ui, sans-serif',
        attributionLogo: true,
      },
      // Kein Raster, keine Rahmen: nur die Fläche soll wirken.
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: {
        vertLine: { color: fadenkreuz, labelBackgroundColor: linie },
        horzLine: { color: fadenkreuz, labelBackgroundColor: linie },
      },
    });

    // Flächen-Serie: Linie oben, darunter ein Verlauf, der nach unten ausblendet.
    // Die gestrichelte Linie mit Preisschild markiert den letzten Kurs.
    this.serie = this.chart.addSeries(AreaSeries, {
      lineColor: linie,
      lineWidth: 2,
      topColor: farbe('--chart-flaeche-oben', 'rgba(124, 58, 237, 0.55)'),
      bottomColor: farbe('--chart-flaeche-unten', 'rgba(124, 58, 237, 0.02)'),
      priceLineColor: linie,
      priceLineStyle: LineStyle.Dotted,
      crosshairMarkerBackgroundColor: linie,
    });

    // autoSize misst den Container erst etwas später. Damit die Kerzen nicht
    // auf 0 px gestaucht bleiben, bei jeder Größenänderung neu auf die volle Breite verteilen.
    this.beobachter = new ResizeObserver(() => this.chart.timeScale().fitContent());
    this.beobachter.observe(this.chartContainer);

    this.aktualisieren();
  }

  // Wird aufgerufen, wenn das Element aus der Seite entfernt wird: Chart aufräumen.
  disconnectedCallback() {
    this.beobachter.disconnect();
    this.beobachter = null;
    this.chart.remove();
    this.chart = null;
    this.serie = null;
  }

  // Wird aufgerufen, wenn sich ein beobachtetes Attribut (hier: symbol) ändert.
  attributeChangedCallback(name, alterWert, neuerWert) {
    if (name === 'symbol') {
      this.titel.textContent = neuerWert;

      // Beim ersten Laden der Seite gibt es den Chart noch nicht,
      // dann übernimmt connectedCallback das Laden.
      if (this.serie) {
        this.aktualisieren();
      }
    }
  }

  // Lädt die Kurse für das aktuelle Symbol und zeigt sie im Chart an.
  async aktualisieren() {
    const symbol = this.getAttribute('symbol');
    if (!symbol) {
      return;
    }

    this.meldung.textContent = '';

    try {
      const kurse = await ladeKurse(symbol);

      // Falls sich das Symbol während des Ladens geändert hat,
      // ist diese Antwort veraltet und wird verworfen.
      if (symbol !== this.getAttribute('symbol') || !this.serie) {
        return;
      }

      this.serie.setData(kurse);
      this.chart.timeScale().fitContent();
    } catch (fehler) {
      // Auch eine veraltete Fehlermeldung ignorieren.
      if (symbol !== this.getAttribute('symbol') || !this.serie) {
        return;
      }

      // Vorläufige Fehleranzeige; wird später ausgebaut.
      this.serie.setData([]);
      this.meldung.textContent = 'Fehler: ' + fehler.message;
    }
  }
}

// Das neue HTML-Element <stock-chart> beim Browser registrieren.
customElements.define('stock-chart', StockChart);
