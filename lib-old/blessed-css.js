const NodeStyle = require('./node-style');
const Stylesheet = require('./stylesheet');

class BlessedCss {

  static get events() {
    return [
      // structure
      { event: 'adopt'    , patch: { type: 'children' } },
      { event: 'remove'   , patch: { type: 'children' } },
      { event: 'reparent' , patch: { type: 'node'     } },

      // input
      { event: 'mouseover', patch: { type: 'hover', value: true  } },
      { event: 'mouseout' , patch: { type: 'hover', value: false } },
      { event: 'focus'    , patch: { type: 'focus', value: true  } },
      { event: 'blur'     , patch: { type: 'focus', value: false } },

      // list
      { event: 'select item', patch: { type: 'node' } },
    ];
  }


  constructor(screen, css) {
    this.listeners = [];

    this.screen = screen;
    this.stylesheet = new Stylesheet(css.toLowerCase());

    this._renderStart = this._renderStart.bind(this);
    this._renderCancel = this._renderCancel.bind(this);

    this.attach();
  }


  attach() {
    this.detach();

    const on = (event, listener) => {
      this.screen.on(event, listener);
      this.listeners.push({ event, listener });
    }

    const params = (node, options = {}) => {
      return { blessedCss: this, node, ...options };
    }

    // update properties before screen render
    on('prerender', () => NodeStyle.render(params(this.screen)));

    // tracking changes for every node
    BlessedCss.events.forEach(({ event, patch }) => {
      on(event, () => NodeStyle.commit(params(this.screen, { patch })));
      on(`element ${event}`, node => NodeStyle.commit(params(node, { patch })));
    });
  }

  detach() {
    this._renderCancel();

    this.listeners.forEach(({ event, listener }) => {
      this.screen.off(event, listener);
    });
    this.listeners = [];
  }


  render(node) {
    if (this._renderTimeout) { return; }
    this._renderTimeout = setTimeout(this._renderStart, 1000 / 60);
  }

  _renderStart() {
    try { this.screen.render(); }
    catch (error) { /* TODO */ }
    finally { this._renderTimeout = null; }
  }

  _renderCancel() {
    if (!this._renderTimeout) { return; }
    clearTimeout(this._renderTimeout);
    this._renderTimeout = null;
  }
}

module.exports = BlessedCss;
