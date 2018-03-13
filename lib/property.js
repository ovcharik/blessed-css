const Weight = require('./weight');

const parse = require('./utils/property-parser');


class PropertyError extends Error {
  constructor({ position, property, value }, message) {
    super(message);
    this.position = position;
    this.property = property;
    this.value = value;
    console.error(message, position, property, value);
  }
}

class Property {

  static parse(declaration = {}) {
    const { position, property, value } = declaration;
    const parsed = parse(property, value, { position });
    return parsed.map(options => new Property(options));
  }

  static extract(property, selector) {
    const extracted = property.clone();
    extracted.weight = extracted.weight.sum(selector.weight);
    return extracted;
  }

  static flatSortFilter(groups = []) {
    return groups
      .reduce((m, v) => [...m, ...v], [])
      .sort((a, b) => b.weight.cmp(a.weight))
      .filter((p, i, a) => i == a.findIndex(f => p.property === f.property));
  }


  constructor(options = {}) {
    Object.defineProperty(this, 'options', { value: options });

    this.property = options.property;

    this.type = options.type;
    this.value = options.value;
    this.path = options.path;

    this.important = options.important;

    this.weight = Weight.createFromProperty(this);
  }

  clone() {
    return new Property(this.options);
  }

}

module.exports = Property;
