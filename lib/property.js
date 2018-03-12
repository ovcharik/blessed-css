const blessedColors = require('blessed/lib/colors');
const Weight = require('./weight');


class PropertyError extends Error {
  constructor({ position, property, value }, message) {
    super(message);
    this.position = position;
    this.property = property;
    this.value = value;
    console.error(message, position, property, value);
  }
}


const helpers = {

  // checking type of value
  valueTypeTests: {
    boolean(value) {
      return [ 'true', 'false' ].includes(value);
    },
    number(value) {
      return !Number.isNaN(Number(value));
    },
    dimension(value) {
      return (
        this.number(value) ||
        /^[-\+]?\d+\%([-\+]\d+)?$/.test(value) // e.g.: 50%, 50%-1, 50%+1
      );
    },
    color(value) {
      return (
        blessedColors.colorNames.hasOwnProperty(value) ||
        /^\#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
      );
    },
    halign(value) {
      return [ 'left', 'center', 'right' ].includes(value);
    },
    valign(value) {
      return [ 'top', 'middle', 'bottom' ].includes(value);
    },
    char(value) {
      return typeof value === 'string' && value.length === 1;
    },
  },

  getValueType(value) {
    return Object
      .keys(this.valueTypeTests)
      .find(t => this.valueTypeTests[t](value));
  },


  // checking property and value type
  propertyValueTypeMap: {
    'bold'              : 'boolean',
    'underline'         : 'boolean',
    'blink'             : 'boolean',
    'inverse'           : 'boolean',
    'invisible'         : 'boolean',
    'transparent'       : 'boolean',

    'color'             : 'color',

    'background-color'  : 'color',
    'background-fill'   : 'char',

    'border-background' : 'color',
    'border-color'      : 'color',
    'border-fill'       : 'char',
    'border-top'        : 'boolean',
    'border-right'      : 'boolean',
    'border-bottom'     : 'boolean',
    'border-left'       : 'boolean',

    'padding-top'       : 'number',
    'padding-right'     : 'number',
    'padding-bottom'    : 'number',
    'padding-left'      : 'number',

    'width'             : 'dimension',
    'height'            : 'dimension',

    'top'               : 'dimension',
    'right'             : 'dimension',
    'bottom'            : 'dimension',
    'left'              : 'dimension',

    'align'             : 'halign',
    'vertical-align'    : 'valign',

    'shadow'            : 'boolean',
    'hidden'            : 'boolean',
    'shrink'            : 'boolean',
    'draggable'         : 'boolean',
    'mouseable'         : 'boolean',
    'keyable'           : 'boolean',

    // complex value
    'background': [
      ['color'],
      ['char'],
      ['char', 'color'],
    ],
    'border': [
      ['color'],
      ['color', 'color'],
      ['char'],
      ['char', 'color'],
      ['char', 'color', 'color'],
    ],
    'padding': [
      ['number'],
      ['number', 'number'],
      ['number', 'number', 'number'],
      ['number', 'number', 'number', 'number'],
    ],
    'position': [
      ['dimension'],
      ['dimension', 'dimension'],
      ['dimension', 'dimension', 'dimension'],
      ['dimension', 'dimension', 'dimension', 'dimension'],
    ],
  },

  checkPropertyName(property) {
    return this.propertyValueTypeMap.hasOwnProperty(property);
  },

  checkPropertyValueType(property, values = []) {
    const typeMap = this.propertyValueTypeMap[property];
    // simple value type
    if (typeof typeMap === 'string') {
      return values.length === 1 && this.valueTypeTests[typeMap](values[0]);
    }
    // return if not compose value type
    if (!(typeMap instanceof Array)) {
      return false;
    }
    // compose value type
    return typeMap.some((variant) => {
      return (
        variant.length === values.length &&
        variant.every((type, i) => this.valueTypeTests[type](values[i]))
      );
    });
  },


  // rules for converting complex properties to simple
  complexToFlatMap: {
    'background': [
      { type: 'char' , property: 'background-fill'  },
      { type: 'color', property: 'background-color' },
    ],
    'border': [
      { type: 'char' , property: 'border-fill'       },
      { type: 'color', property: 'border-background' },
      { type: 'color', property: 'border-color'      },
    ],
    'padding': [
      { type: 'number', property: 'padding-top'    },
      { type: 'number', property: 'padding-right'  },
      { type: 'number', property: 'padding-bottom' },
      { type: 'number', property: 'padding-left'   },
    ],
    'position': [
      { type: 'dimension', property: 'top'    },
      { type: 'dimension', property: 'right'  },
      { type: 'dimension', property: 'bottom' },
      { type: 'dimension', property: 'left'   },
    ],
  },

  flattenComplex(property, value = [], options = {}) {
    return (
        this.complexToFlatMap.hasOwnProperty(property)
        ? this.complexToFlatMap[property]
        : [{ property, type: this.propertyValueTypeMap[property] }]
      )
      .reduce(({src: [value, ...tail], dst}, {type, property}) => (
        (!this.valueTypeTests[type](value))
        // missing type, do nothing
        ? { src: [value, ...tail], dst }
        // shift source value and add property to result
        : { src: tail, dst: [...dst, { ...options, property, value, type }] }
      ), { src: value, dst: [] })
      .dst;
  },


  // rules for typification values
  typificationMap: {
    'boolean' : Boolean,
    'number'  : Number,

    dimension(value) {
      return helpers.valueTypeTests.number(value)
        ? Number(value)
        : value;
    }
  },

  typificateValue({ value, type }) {
    return this.typificationMap.hasOwnProperty(type)
      ? this.typificationMap[type](value)
      : value;
  },


  // property path for blessed element
  propertyToPathMap: {
    'bold'              : 'style.bold',
    'underline'         : 'style.underline',
    'blink'             : 'style.blink',
    'inverse'           : 'style.inverse',
    'invisible'         : 'style.invisible',
    'transparent'       : 'style.transparent',

    'color'             : 'style.fg',

    'background-color'  : 'style.bg',
    'background-fill'   : 'ch',

    'border-background' : 'border.bg',
    'border-color'      : 'border.fg',
    'border-fill'       : 'border.ch',
    'border-top'        : 'border.top',
    'border-right'      : 'border.right',
    'border-bottom'     : 'border.bottom',
    'border-left'       : 'border.left',

    'padding-top'       : 'padding.top',
    'padding-right'     : 'padding.right',
    'padding-bottom'    : 'padding.bottom',
    'padding-left'      : 'padding.left',

    'width'             : 'position.width',
    'height'            : 'position.height',

    'top'               : 'position.top',
    'right'             : 'position.right',
    'bottom'            : 'position.bottom',
    'left'              : 'position.left',

    'align'             : 'align',
    'vertical-align'    : 'valign',

    'shadow'            : 'shadow',
    'hidden'            : 'hidden',
    'shrink'            : 'shrink',
    'draggable'         : 'draggable',

    'mouseable'         : (node) => node.enableMouse(),
    'keyable'           : (node) => node.enableKeys(),
  },

  propertyToPath(property) {
    return this.propertyToPathMap[property] || null;
  },
};


class Property {

  static parse(declaration = {}) {
    const { position, property } = declaration;

    // parse property value
    const value = declaration
      .value
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(v => v.replace(/(^[\'\"\`]|[\'\"\`]$)/g, ''));

    // check important
    const important = (value[value.length - 1] === '!important');
    if (important) { value.pop(); }

    // validate property name
    if (!helpers.checkPropertyName(property)) {
      throw new PropertyError({ position, property, value }, 'Unknown property');
    }

    // validate property value
    if (!helpers.checkPropertyValueType(property, value)) {
      throw new PropertyError({ position, property, value }, 'Wrong property value');
    }

    // extend value data for some properties
    if (['padding', 'position'].includes(property)) {
      switch (value.length) {
        case 1: value.splice(1, 0, value[0]); // v0: [t, r, b, l]
        case 2: value.splice(2, 0, value[0]); // v0: [t, b]; v1: [r, l]
        case 3: value.splice(3, 0, value[1]); // v0: [t]; v1: [r, l]; v2: [b]
      }
    }

    // result
    return helpers
      .flattenComplex(property, value, { important, position, declaration })
      .map(options => ({ ...options, path: helpers.propertyToPath(options.property) }))
      .map(options => new Property(options));
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
    this.value = helpers.typificateValue(options);
    this.path = options.path;

    this.important = options.important;

    this.weight = Weight.createFromProperty(this);
  }

  clone() {
    return new Property(this.options);
  }

}

module.exports = Property;

/***************************************************************
+===================+===========+===============================
| CSS PROPERTY NAME | TYPE      | BLESSED ELEMENT PROPERTY PATH
+===================+===========+===============================
| bold              | boolean   | style.bold
| underline         | boolean   | style.underline
| blink             | boolean   | style.blink
| inverse           | boolean   | style.inverse
| invisible         | boolean   | style.invisible
| transparent       | boolean   | style.transparent
+-------------------+-----------+-------------------------------
| color             | color     | style.fg
+-------------------+-----------+-------------------------------
| background        | calc      | background-fill? background-color?
| background-color  | color     | style.bg
| background-fill   | char      | ch
+-------------------+-----------+-------------------------------
| border            | calc      | border-fill? border-background border-color?
| border-background | color     | border.bg
| border-color      | color     | border.fg
| border-fill       | char      | border.ch
| border-top        | boolean   | border.top
| border-right      | boolean   | border.right
| border-bottom     | boolean   | border.bottom
| border-left       | boolean   | border.left
+-------------------+-----------+-------------------------------
| padding           | calc      | padding
| padding-top       | number    | padding.top
| padding-right     | number    | padding.right
| padding-bottom    | number    | padding.bottom
| padding-left      | number    | padding.left
+-------------------+-----------+-------------------------------
| width             | dimension | position.width
| height            | dimension | position.height
+-------------------+-----------+-------------------------------
| position          | calc      | position
| top               | dimension | position.top
| right             | dimension | position.right
| bottom            | dimension | position.bottom
| left              | dimension | position.left
+-------------------+-----------+-------------------------------
| align             | halign    | align
| vertical-align    | valign    | valign
+-------------------+-----------+-------------------------------
| shadow            | boolean   | shadow
| hidden            | boolean   | hidden
| shrink            | boolean   | shrink
| draggable         | boolean   | draggable
| mouseable         | boolean   | mouseable
| keyable           | boolean   | keyable
+-------------------+-----------+-------------------------------
***************************************************************/
