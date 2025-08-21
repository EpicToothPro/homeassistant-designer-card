// Designer Card - minimal no-build custom card with GUI editor
// Card type: custom:designer-card
// Works in modern Home Assistant (imports 'lit' from HA's frontend).

const DEFAULTS = {
  title: "Designer Card",
  icon: "mdi:shape-outline",
  style: {
    background: "var(--card-background-color)",
    color: "var(--primary-text-color)",
    padding: 16,
    radius: 16
  },
  density: "normal",
  tap_action: { action: "more-info" }
};

function deepMerge(target, source) {
  const output = {...target};
  if (typeof target !== "object" || typeof source !== "object") return {...target, ...source};
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

function fireEvent(node, type, detail, options={}) {
  const event = new Event(type, {
    bubbles: options.bubbles !== undefined ? options.bubbles : true,
    cancelable: Boolean(options.cancelable),
    composed: options.composed !== undefined ? options.composed : true,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
}

const Lit = window.litElement || window.litHtml || window.lit;
let LitElement, html, css;
try {
  // Home Assistant provides 'lit' as an ES module import alias
  ({ LitElement, html, css } = await import('lit'));
} catch(e) {
  // Fallback for older builds: pull from window if present
  if (Lit && Lit.LitElement) {
    LitElement = Lit.LitElement;
    html = Lit.html;
    css = Lit.css;
  } else {
    throw new Error("Designer Card: 'lit' not available. Please update Home Assistant.");
  }
}

class DesignerCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: { attribute: false },
    };
  }

  static getConfigElement() {
    return document.createElement('designer-card-editor');
  }

  static getStubConfig() {
    return DEFAULTS;
  }

  setConfig(config) {
    this._config = deepMerge(DEFAULTS, config || {});
  }

  getCardSize() {
    return 3;
  }

  _handleClick(ev) {
    const action = this._config.tap_action?.action || "more-info";
    if (!this.hass) return;
    const entityId = this._config.entity;
    if (!entityId) return;
    switch (action) {
      case "toggle":
        this.hass.callService("homeassistant", "toggle", { entity_id: entityId });
        break;
      case "more-info":
      default:
        fireEvent(this, "hass-more-info", { entityId });
    }
  }

  _styleVars() {
    const s = this._config.style || {};
    return {
      "--designer-bg": s.background ?? "var(--card-background-color)",
      "--designer-color": s.color ?? "var(--primary-text-color)",
      "--designer-padding": (s.padding ?? 16) + "px",
      "--designer-radius": (s.radius ?? 16) + "px",
    };
  }

  render() {
    const cfg = this._config || DEFAULTS;
    const entity = cfg.entity ? this.hass?.states?.[cfg.entity] : undefined;
    const state = entity?.state;
    const name = cfg.title || entity?.attributes?.friendly_name || "Designer Card";
    const icon = cfg.icon || "mdi:shape-outline";
    const density = cfg.density || "normal";

    return html`
      <ha-card
        style=${Object.entries(this._styleVars()).map(([k,v]) => `${k}:${v}`).join(";")}
        @click=${this._handleClick}
        class="density--${density}"
      >
        <div class="wrapper">
          <div class="header">
            <ha-icon .icon=${icon}></ha-icon>
            <div class="title">${name}</div>
            ${state !== undefined ? html`<div class="state">${state}</div>` : ''}
          </div>
          ${cfg.header_text ? html`<div class="subheader">${cfg.header_text}</div>` : ''}
          <slot></slot>
          ${cfg.footer_text ? html`<div class="footer">${cfg.footer_text}</div>` : ''}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        background: var(--designer-bg);
        color: var(--designer-color);
        border-radius: var(--designer-radius);
      }
      .wrapper { padding: var(--designer-padding); display: grid; gap: 8px; }
      .header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
      .title { font-weight: 600; font-size: 1.1rem; line-height: 1.4; }
      .state { opacity: 0.8; font-variant-numeric: tabular-nums; }
      .subheader { opacity: 0.8; font-size: 0.95rem; }
      .footer { opacity: 0.7; font-size: 0.9rem; }
      .density--compact .wrapper { gap: 4px; }
      .density--large .wrapper { gap: 12px; }
      ha-icon { --mdc-icon-size: 22px; }
    `;
  }
}

class DesignerCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: { attribute: false },
    };
  }

  setConfig(config) {
    this._config = deepMerge(DEFAULTS, config || {});
  }

  _valueChanged(path, value) {
    const cfg = JSON.parse(JSON.stringify(this._config || {}));
    // simple dot-path setter
    const keys = path.split(".");
    let obj = cfg;
    while (keys.length > 1) {
      const k = keys.shift();
      obj[k] = obj[k] || {};
      obj = obj[k];
    }
    obj[keys[0]] = value;
    this._config = cfg;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg } }));
  }

  _input(ev, path) {
    this._valueChanged(path, ev.target.value);
  }

  _number(ev, path) {
    const v = parseInt(ev.target.value, 10);
    this._valueChanged(path, isNaN(v) ? 0 : v);
  }

  render() {
    const cfg = this._config || DEFAULTS;
    return html`
      <div class="form">
        <div class="row">
          <label>Title</label>
          <input type="text" .value=${cfg.title || ""} @input=${(e)=>this._input(e,"title")} />
        </div>
        <div class="row">
          <label>Entity</label>
          <ha-entity-picker
            .hass=${this.hass}
            .value=${cfg.entity || ""}
            @value-changed=${(e)=>this._valueChanged("entity", e.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>
        </div>
        <div class="row">
          <label>Icon</label>
          <ha-icon-picker
            .hass=${this.hass}
            .value=${cfg.icon || "mdi:shape-outline"}
            @value-changed=${(e)=>this._valueChanged("icon", e.detail.value)}
          ></ha-icon-picker>
        </div>

        <fieldset>
          <legend>Style</legend>
          <div class="row">
            <label>Background</label>
            <input type="text" placeholder="e.g. linear-gradient(90deg, #ff9800, #ffc107)"
                   .value=${cfg.style?.background || ""}
                   @input=${(e)=>this._input(e,"style.background")} />
          </div>
          <div class="row">
            <label>Text Color</label>
            <input type="text" placeholder="e.g. #111"
                   .value=${cfg.style?.color || ""}
                   @input=${(e)=>this._input(e,"style.color")} />
          </div>
          <div class="row">
            <label>Padding</label>
            <input type="number" min="0" step="1"
                   .value=${cfg.style?.padding ?? 16}
                   @input=${(e)=>this._number(e,"style.padding")} />
          </div>
          <div class="row">
            <label>Border Radius</label>
            <input type="number" min="0" step="1"
                   .value=${cfg.style?.radius ?? 16}
                   @input=${(e)=>this._number(e,"style.radius")} />
          </div>
        </fieldset>

        <div class="row">
          <label>Density</label>
          <select .value=${cfg.density || "normal"} @change=${(e)=>this._input(e,"density")}>
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>

        <fieldset>
          <legend>Extras</legend>
          <div class="row">
            <label>Header Text</label>
            <input type="text" .value=${cfg.header_text || ""} @input=${(e)=>this._input(e,"header_text")} />
          </div>
          <div class="row">
            <label>Footer Text</label>
            <input type="text" .value=${cfg.footer_text || ""} @input=${(e)=>this._input(e,"footer_text")} />
          </div>
          <div class="row">
            <label>Tap Action</label>
            <select .value=${cfg.tap_action?.action || "more-info"} @change=${(e)=>this._input(e,"tap_action.action")}>
              <option value="more-info">more-info</option>
              <option value="toggle">toggle</option>
              <option value="none">none</option>
            </select>
          </div>
        </fieldset>
      </div>
    `;
  }

  static get styles() {
    return css`
      .form { display: grid; gap: 12px; padding: 8px 0; }
      fieldset { border: 1px solid var(--divider-color); border-radius: 12px; padding: 8px 12px; }
      legend { opacity: .8; padding: 0 6px; }
      .row { display: grid; grid-template-columns: 160px 1fr; gap: 12px; align-items: center; }
      input, select { width: 100%; box-sizing: border-box; }
    `;
  }
}

customElements.define('designer-card', DesignerCard);
customElements.define('designer-card-editor', DesignerCardEditor);

// Lovelace card registration (so it appears in the card picker with icon/name)
window.customCards = window.customCards || [];
window.customCards.push({
  type: "designer-card",
  name: "Designer Card",
  description: "A visual design UI that saves YAML (pre-designed templates included).",
  preview: true
});
