const css = require('css');
const Rule = require('./rule');
const Property = require('./property');

class Stylesheet {

  constructor(cssText) {
    const parsed = css.parse(cssText);
    this.rules = parsed.stylesheet.rules.map(r => new Rule(r));
  }

  getProperties(nodeStyle) {
    const groups = this.rules
      .map(r => r.getProperties(nodeStyle))
      .filter(Boolean);
    return Property.flatSortFilter(groups);
  }

}

module.exports = Stylesheet;
