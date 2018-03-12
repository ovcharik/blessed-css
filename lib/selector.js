const Weight = require('./weight');


class SelectorError extends Error {
  constructor(source, message) {
    super(message);
    this.source = source;
    console.error(message, source);
  }
}


const helpers = {
  simple: {
    typeMap: {
      '#': 'id',
      '.': 'class',
      ':': 'pseudo',
      ' ': 'node',
    },

    getType(type) {
      return type && this.typeMap[type] || 'node';
    },

    parse(selector = '', matches = []) {
      // split every selector on 4 part, e.g.:
      // 'node.foo:not($1)' => [
      //   '', undefined, 'node', undefined,
      //   '', '.'      , 'foo' , undefined,
      //   '', ':'      , 'not' , '1'      ,
      // ]
      const parts = selector
        .split(/(\.|\#|\:)?(\*|[-\w]+)(?:\(\$(\d+)\))?/i);

      // check split result length
      if (parts.length % 4 !== 1) {
        throw new SelectorError(selector, 'Can not parse selector');
      }

      // make chunks (by 4 items) and ignore last chunk
      const chunks = parts
        .reduce((mem, v, i, a) => {
          const c = Math.floor(i / 4);
          if (!mem[c]) { mem[c] = []; }
          mem[c].push(v);
          return mem;
        }, [])
        .slice(0, -1);

      // split must be matched fully
      if (chunks.some(([empty]) => Boolean(empty))) {
        throw new SelectorError(selector, 'Can not parse selector');
      }

      // make selectors
      const selectors = chunks
        .map(([empty, typeSymbol, value, argumentKey]) => {
          const type = this.getType(typeSymbol);
          const argument = argumentKey && matches[argumentKey] || null;
          const check = argument ? helpers.argument.parse(type, value, argument) : null;
          return { type, value, argument, check };
        });

      // star must be node selector
      if (selectors.find(({ type, value }) => value === '*' && type !== 'node')) {
        throw new SelectorError(selector, '"*" is not node selector');
      }

      return selectors;
    },
  },

  composite: {
    typeMap: {
      '+': 'adjacent',
      '~': 'next',
      '>': 'child',
      ' ': 'nested',
    },

    getType(type) {
      return type && this.typeMap[type] || 'nested';
    },

    parse(selector = '', matches = []) {
      return selector
        // split on combinators and simple selectors
        // e.g. 'a > b c' => ['a', '>', 'b', ' ', 'c']
        .split(/(?:\s*(~|>|\+|\s)\s*)/i)
        .map(str =>
          this.typeMap.hasOwnProperty(str)
          ? { type: 'combinator', value: this.getType(str) }
          : { type: 'selector'  , value: helpers.simple.parse(str, matches) }
        );
    },
  },

  argument: {
    valueMap: {
      'nth-child'       : { method: 'position' },
      'nth-of-type'     : { method: 'position' },
      'nth-last-child'  : { method: 'position' },
      'nth-last-of-type': { method: 'position' },
    },

    parse(type, value, arg) {
      const options = helpers.argument.valueMap[value];
      // always match by default
      if (!options) { return () => true; }
      if (!helpers.argument[options.method]) { return () => true; }
      return helpers.argument[options.method](arg, options);
    },

    position(arg='', { inverse=false }) {
      //                        [  $1   ]  [      $2      ][ $3 ][$4][      $5       ] [   $6   ]
      const match = arg.match(/^([-+]\d+)$|([-+]??(?=\d|n))(\d*?)(n?)([-+]?(?=\d)\d*)$|(even|odd)$/);
      if (!match) {
        throw new SelectorError(arg, 'Can not parse argument');
      }
      let n, a, b;
      if (match[6]) {
        n = true;
        a = (match[6] === 'even') ? 2 : 1;
        b = 0;
      } else {
        n = Boolean(match[4]);
        a = Number(match[1] || match[3] || n && 1 || 0) * (match[2] === '-' ? -1 : 1);
        b = Number(match[5] || 0);
      }
      return (node, x) => n ? ((x - b) >= 0 && ((x - b) / a) % 1 === 0) : (a + b === x);
    },
  },
};


class Selector {

  static parse(selector) {
    const components = selector
      .trim()
      .split('')
      .reduce(({ count, match, matches, output }, symbol, index, array) => {
        const isEndOfInput = (index === array.length - 1);

        // count brackets
        (symbol === '(') && (count += 1);
        // if top bracket closing
        if (count === 1 && symbol === ')') {
          const n = matches.push(match);
          output += `$${n - 1}`;
          match = '';
        }
        // if bracket not opened or current symbol
        // is top opening/closing bracket then write
        // into output else write into current match
        (count === 0 || count === 1 && ['(', ')'].includes(symbol))
          ? (output += symbol)
          : (match += symbol);
        // count brackets
        (symbol === ')') && (count -= 1);

        // closed brackets more than opened or not all closed
        if (count < 0 || isEndOfInput && count != 0) {
          throw new SelectorError(selector, 'Parse error: brackets not match');
        }

        return !isEndOfInput
          ? { count, match, matches, output } // iteration
          : helpers.composite.parse(output, matches); // result
      }, { count: 0, match: '', matches: [], output: '' });

    // create selector instance
    return new Selector(components);
  }


  constructor(components = []) {
    this.components = components;
    this.weight = Weight.createFromSelector(this);

    this.reverseChecks = this.components.reduce((result, { type, value }) => {
      if (type === 'selector') {
        result.push({ conditions: value, method: 'checkConditions' });
      } else {
        const last = result.slice(-1)[0];
        last.combinator = value;
        last.method = 'findNodeReverse';
      }
      return result;
    }, []).reverse();
  }

  match(nodeStyle) {
    let current = nodeStyle;
    for (let { method, combinator, conditions } of this.reverseChecks) {
      const result = this[method](current, { combinator, conditions });
      if (!result) { return false; }
      if (method === 'findNodeReverse') { current = result; }
    }
    return true;
  }

  findNodeReverse(nodeStyle, { combinator, conditions = [] }) {
    // config
    let direction, repeat;
    switch (combinator) {
      case 'adjacent': { direction = 'left'; repeat = true ; break; }
      case 'next'    : { direction = 'left'; repeat = false; break; }
      case 'child'   : { direction = 'top' ; repeat = false; break; }
      case 'nested'  : { direction = 'top' ; repeat = true ; break; }
      default        : { direction = 'top' ; repeat = true ; break; }
    }

    let current = nodeStyle;
    do {
      current = (direction === 'left')
        ? current.leftStyle
        : current.parentStyle;
      if (current && this.checkConditions(current, { conditions })) {
        return current;
      }
    } while (current && repeat);
    return null;
  }

  checkConditions(nodeStyle, { conditions = [] }) {
    if (!nodeStyle) { return false; }

    const selector = nodeStyle.selector;
    if (!selector) { return false; }

    const result = conditions.every(({ type, value, check }) => {
      if (type === 'node' && value === '*') { return true; }
      const args = selector[type] && selector[type][value];
      if (!args) { return false; }
      return check ? check(nodeStyle, ...args) : true;
    });

    return result;
  }

}

module.exports = Selector;
