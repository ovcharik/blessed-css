const NodeStyle = require('./node-style');
const Stylesheet = require('./stylesheet');

class BlessedCss {

  static get events() {
    return [
      // structure
      { event: 'adopt'    , patch: { event: 'adopt'    , type: 'children' } },
      { event: 'remove'   , patch: { event: 'remove'   , type: 'children' } },
      { event: 'reparent' , patch: { event: 'reparent' , type: 'node'     } },
      // input
      { event: 'mouseover', patch: { event: 'mouseover', type: 'hover', value: true  } },
      { event: 'mouseout' , patch: { event: 'mouseout' , type: 'hover', value: false } },
      { event: 'focus'    , patch: { event: 'focus'    , type: 'focus', value: true  } },
      { event: 'blur'     , patch: { event: 'blur'     , type: 'focus', value: false } },
    ];
  }


  constructor(screen, css) {
    this.listeners = [];

    this.screen = screen;
    this.stylesheet = new Stylesheet(css.toLowerCase());

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

  // TODO
  render(node) {
    this._renderCancel();
    this._renderTimeout = setTimeout(this._renderStart, 1000 / 60, this.screen);
  }

  _renderStart(screen) {
    screen.render();
  }

  _renderCancel() {
    if (!this._renderTimeout) { return; }
    clearTimeout(this._renderTimeout);
    this._renderTimeout = null;
  }
}

module.exports = BlessedCss;
