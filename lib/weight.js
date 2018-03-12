class Weight {

  static get defaultValue() {
    return [0, 0, 0, 0, 0];
  }

  static createFromSelector(selector) {
    const map = {
      'id'    : 2,
      'class' : 3,
      'pseudo': 3,
      'node'  : 4,
    };
    const value = selector
      .components
      .filter(({ type }) => type === 'selector') // combinators has't weight
      .reduce((mem, { value }) => [...mem, ...value], []) // flatten selectors
      .reduce((mem, { type }) => {
        mem[map[type]] += 1;
        return mem;
      }, [0, 0, 0, 0, 0]);
    return new Weight(value);
  }

  static createFromProperty(property) {
    const value = [ (property.important ? 1 : 0), 0, 0, 0, 0 ];
    const position = (property.options.position || {}).start;
    return new Weight(value, position);
  }


  constructor(value = Weight.defaultValue, position) {
    if (!(value instanceof Array)) {
      throw new Error('Weight constructor value argument must be Array.');
    }

    // normalize value;
    value = Object.assign([], Weight.defaultValue, value).slice(0, 5);

    // value must be array of numbers
    if (value.some(n => typeof n !== 'number')) {
      throw new Error('Weight constructor value argument must be Array of Numbers.');
    }

    // readonly properties
    Object.defineProperty(this, 'value', { enumerable: true, value: value });
    Object.defineProperty(this, 'position', { enumerable: true, value: position });
  }

  sum(right) {
    if (!(right instanceof Weight)) {
      throw new Error('Can not sum Weight with another object');
    }
    const value = right.value
      .reduce((m, v, i) => { m[i] = this.value[i] + v; return m; }, []);
    return new Weight(value, this.position);
  }

  cmp(right) {
    if (!(right instanceof Weight)) {
      throw new Error('Can not compare Weight with another object');
    }

    const result = right.value
      .reduce((m, v, i) => { m[i] = this.value[i] - v; return m; }, [])
      .find(v => v !== 0);
    if (result) { return result; }

    const a = this.position  || { line: 0, column: 0 };
    const b = right.position || { line: 0, column: 0 };
    return (a.line - b.line) || (a.column - b.column) || 0;
  }

}

module.exports = Weight;
