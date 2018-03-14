const Selector = require('./selector');
const Property = require('./property');

class Rule {

  constructor(options = {}) {
    Object.defineProperty(this, 'options', { value: options });

    this.selectors = options
      .selectors
      .map(s => Selector.parse(s));

    const groups = options
      .declarations
      .map(p => Property.parse(p));

    this.properties = Property.flatSortFilter(groups);
  }

  getProperties(nodeStyle) {
    const selectors = this.selectors.filter(s => s.match(nodeStyle));
    if (!selectors.length) { return null; }

    const selector = selectors.slice(1).reduce((max, cur) => {
      return max.weight.cmp(cur.weight) >= 0 ? max : cur;
    }, selectors[0]);

    return this.properties.map(p => Property.extract(p, selector));
  }

}

module.exports = Rule;
