// Web Component <stock-search>: Eingabefeld, über das man ein Aktiensymbol wählt.
//
// Die Komponente kennt <stock-chart> nicht. Sie meldet nur per Event, welches
// Symbol gewählt wurde; die Seite entscheidet, was damit passiert.
//
// Event: "symbol-gewaehlt" mit event.detail.symbol, z. B. "MSFT".

class StockSearch extends HTMLElement {
  // Der Browser meldet Änderungen nur für Attribute, die hier aufgeführt sind.
  static observedAttributes = ['value'];

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
        form {
          display: flex;
          gap: 0.5rem;
        }
        input {
          flex: 1;
          max-width: 12rem;
          padding: 0.4rem 0.6rem;
          font: inherit;
          text-transform: uppercase;
        }
        button {
          padding: 0.4rem 0.9rem;
          font: inherit;
          cursor: pointer;
        }
      </style>
      <form>
        <input name="symbol" aria-label="Aktiensymbol" placeholder="z. B. MSFT" autocomplete="off" required>
        <button type="submit">Anzeigen</button>
      </form>
    `;

    this.formular = shadow.querySelector('form');
    this.eingabe = shadow.querySelector('input');

    // Enter im Feld und Klick auf den Button lösen beide "submit" aus.
    this.formular.addEventListener('submit', (event) => {
      // Verhindert, dass der Browser die Seite neu lädt.
      event.preventDefault();
      this.waehlen();
    });
  }

  // Wird aufgerufen, wenn sich ein beobachtetes Attribut (hier: value) ändert.
  // So kann die Seite einen Startwert vorgeben: <stock-search value="AAPL">
  attributeChangedCallback(name, alterWert, neuerWert) {
    if (name === 'value') {
      this.eingabe.value = neuerWert ?? '';
    }
  }

  // Liest das Symbol aus dem Feld und meldet es per Event.
  waehlen() {
    // Symbole werden groß geschrieben; Leerzeichen am Rand entfernen.
    const symbol = this.eingabe.value.trim().toUpperCase();
    if (!symbol) {
      return;
    }

    this.eingabe.value = symbol;

    // bubbles: das Event steigt im DOM nach oben, man kann es also auch
    // weiter oben abfangen. composed: es verlässt das Shadow DOM.
    this.dispatchEvent(new CustomEvent('symbol-gewaehlt', {
      detail: { symbol },
      bubbles: true,
      composed: true,
    }));
  }
}

// Das neue HTML-Element <stock-search> beim Browser registrieren.
customElements.define('stock-search', StockSearch);
