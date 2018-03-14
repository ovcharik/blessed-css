const Cache = require('./utils/cache');

const STYLE_CACHE = new Cache();
const SELECTOR_CACHE = new Cache();


class NodeStyle {

  static get({ blessedCss, node }) {
    if (!node) { return null; }
    const fallback = () => new NodeStyle({ blessedCss, node });
    return STYLE_CACHE.get(node, fallback);
  }

  static commit({ blessedCss, node, patch }) {
    if (!node) { return null; }
    const style = NodeStyle.get({ blessedCss, node });
    return style && style.commit(patch);
  }

  static render({ blessedCss, node }) {
    if (!node) { return null; }
    const style = NodeStyle.get({ blessedCss, node });
    return style && style.render();
  }



  get parentNode()   { return this.node.parent; }
  get parentStyle()  { return NodeStyle.get({ node: this.parentNode }); }
  get parentState()  { return (this.parentStyle || {}).state || null; }
  get parentPath()   { return (this.parentState || {}).path || null; }

  get nodeType()     { return this.node.type || null; }
  get nodeId()       { return this.node.options.id || null; }
  get nodeClass()    { return this.node.options.class || null; }
  get nodeIndex()    { return this.parentNode ? this.parentNode.children.indexOf(this.node) : -1; }

  get selector()     { return SELECTOR_CACHE.get(this.state, () => this._buildSelector()); }

  get leftNode()     { return this.parentNode && this.parentNode.children[this.nodeIndex - 1] || null; }
  get leftStyle()    { return NodeStyle.get({ node: this.leftNode }); }

  get rightNode()    { return this.parentNode && this.parentNode.children[this.nodeIndex + 1] || null; }
  get rightStyle()   { return NodeStyle.get({ node: this.rightNode }); }



  constructor({ blessedCss, node }) {
    this.blessedCss = blessedCss;
    this.stylesheet = blessedCss.stylesheet;
    this.node = node;

    this.rendering = false;

    this.previous = null;
    this.state = {};
  }


  commit({ type, value }) {
    const changes = {};
    const actions = {
      attrs    : '_actionAttrs',
      focus    : '_actionInput',
      hover    : '_actionInput',
      select   : '_actionInput',
      node     : '_actionNode',
      children : '_actionChildren',
    };

    const callAction = (type) => {
      if (!actions[type]) { return false; }
      changes[type] = this[actions[type]]({ type, value });
      changes.any = changes || changes[type];
      return changes[type];
    }

    callAction('attrs'); // TODO: listen events
    callAction(type);

    // not send changes to children while style rendering
    if (this.rendering) { return; }
    if (!changes.any) { return; }

    // notify all children
    this.node.children.forEach(node => {
        NodeStyle.commit({ node, patch: { type: 'node' }, blessedCss: this.blessedCss });
    });

    this.blessedCss.render(this);
  }

  render() {
    this.rendering = true;

    // render children
    this.node.children.forEach(node => {
      return NodeStyle.render({ node, blessedCss: this.blessedCss });
    });

    if (this.node.type === 'screen') {
      return;
    }

    this.properties = this.stylesheet.getProperties(this);
    this.properties.forEach(({ property, value, path }) => {
      if (!path) { return; }
      if (typeof(path) === 'function') {
        return path(this.node, value);
      }

      const steps = path.split('.');
      const head = steps.slice(0, -1);
      const tail = steps.slice(-1)[0];

      setValueLabel: {
        let current = this.node;
        for (let step of head) {
          if (!current[step]) { current[step] = {}; }
          current = current[step];
          // if (!current) break setValueLabel;
        }
        current[tail] = value;
      }
    });

    this.previous = this.state;
    this.rendering = false;
  }


  // Actions
  _actionAttrs({ type, value }) {
    return this._applyPatch('attrs', {
      node : this.nodeType,
      id   : this.nodeId,
      class: this.nodeClass,
    });
  }

  _actionInput({ type, value }) {
    return this._applyPatch('input', {
      [type]: value,
    });
  }

  _actionNode({ type, value }) {
    if (!this.parentNode) { return; }
    const parentNode = this.parentNode;
    const children = parentNode.children;
    const nodeType = this.node.type;
    const childrenType = children.filter(c => c.type === nodeType);
    const parentList = parentNode.items || [];
    const indexList = parentList.indexOf(this.node);

    return this._applyPatch('node', {
      index: children.indexOf(this.node),
      total: children.length,

      indexType: childrenType.indexOf(this.node),
      totalType: childrenType.length,

      indexList: indexList,
      totalList: parentList.length,
      isSelected: parentNode.selected === indexList,
    });
  }

  _actionChildren({ type, value }) {
    return this._applyPatch('children', {
      total: this.node.children.length,
    });
  }


  // Data
  _buildSelector() {
    const result = [];
    const { attrs, input, node, children } = this.state;

    // base attrs
    if (attrs) {
      result.push(
        { type: 'node', value: attrs.node },
        { type: 'id'  , value: attrs.id   },
        ...(attrs.class || '')
          .trim().split(/[\s\t]+/g)                // clear spaces
          .filter((c, i, a) => i === a.indexOf(c)) // unique
          .map(c => ({ type: 'class', value: c })) // format
      );
    }

    // input effect
    if (input) {
      result.push(
        { type: 'pseudo', value: input.hover && 'hover' },
        { type: 'pseudo', value: input.focus && 'focus' }
      );
    }

    // node position
    if (node) {
      const {
        index:ai, total:at,
        indexType:ti, totalType:tt,
        indexList:li, totalList:lt,
      } = node;
      result.push(
        { type: 'pseudo', value: (ai ===  0) && 'first-child'   },
        { type: 'pseudo', value: (ai === at) && 'last-child'    },
        { type: 'pseudo', value: (at ===  0) && 'only-child'    },

        { type: 'pseudo', value: (ti ===  0) && 'first-of-type' },
        { type: 'pseudo', value: (ti === tt) && 'last-of-type'  },
        { type: 'pseudo', value: (tt ===  0) && 'only-of-type'  },

        { type: 'pseudo', value: (li ===  0) && 'first-in-list' },
        { type: 'pseudo', value: (li === lt) && 'last-in-list'  },
        { type: 'pseudo', value: (lt ===  0) && 'only-in-list'  },

        { type: 'pseudo', value: 'nth-child'       , args: [ai +  1] },
        { type: 'pseudo', value: 'nth-last-child'  , args: [at - ai] },
        { type: 'pseudo', value: 'nth-of-type'     , args: [ti +  1] },
        { type: 'pseudo', value: 'nth-last-of-type', args: [tt - ti] },
        { type: 'pseudo', value: 'nth-in-list'     , args: [li +  1] },
        { type: 'pseudo', value: 'nth-last-in-list', args: [lt - li] },

        { type: 'pseudo', value: node.isSelected && 'selected' }
      );
    } else {
      // screen node has not parent
      result.push({ type: 'pseudo', value: 'root' });
    }

    // children
    if (children) {
      result.push(
        { type: 'pseudo', value: !children.total && 'empty' }
      );
    }

    // prepare result
    return result
      .filter(v => Boolean(v.value))
      // group by type => value => args
      .reduce((types, { type, value, args=true }) => {
        if (!types.hasOwnProperty(type)) { types[type] = {}; }
        types[type][value.toLowerCase()] = args;
        return types;
      }, {});
  }


  // Helpers
  _applyPatch(key, patch = {}) {
    const result = this._mergePatch(this.state[key], patch);
    if (this.state[key] === result) { return false; }
    this.state = { ...this.state, [key]: result };
    return true;
  }

  _mergePatch(origin = {}, patch = {}) {
    origin = origin || {};
    const changed = Object.keys(patch).some(k => origin[k] !== patch[k]);
    return changed ? { ...origin, ...patch } : origin;
  }
}

module.exports = NodeStyle;
