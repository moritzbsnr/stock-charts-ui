// Abhängigkeiten: Lightweight Charts (als ES-Modul vom CDN) und der eigene API-Key.
import { createChart, CandlestickSeries } from 'https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.mjs';
import { API_KEY } from '../config.js';

// Lädt die letzten 30 Tageskerzen für ein Symbol von Twelve Data
// und wandelt sie in das Format um, das Lightweight Charts erwartet.
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
    .map((kerze) => ({
      time: kerze.datetime,
      open: parseFloat(kerze.open),
      high: parseFloat(kerze.high),
      low: parseFloat(kerze.low),
      close: parseFloat(kerze.close),
    }))
    .reverse();
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
        :host {
          display: block;
          font-family: sans-serif;
        }
        .chart {
          height: 400px;
        }
        .meldung {
          color: #c62828;
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
    // Chart im Container erzeugen; autoSize passt ihn an die Größe des Containers an.
    this.chart = createChart(this.chartContainer, { autoSize: true });
    this.serie = this.chart.addSeries(CandlestickSeries);

    this.aktualisieren();
  }

  // Wird aufgerufen, wenn das Element aus der Seite entfernt wird: Chart aufräumen.
  disconnectedCallback() {
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
