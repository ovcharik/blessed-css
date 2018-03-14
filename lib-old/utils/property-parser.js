const colors = require('blessed/lib/colors');

const properties = [
  /* CSS PROPERTY NAME        |  NODE PATH                |  TYPE       | DEFAULT  */
  [ 'bold'                    , 'style.bold'              , 'boolean'   , undefined ],
  [ 'underline'               , 'style.underline'         , 'boolean'   , undefined ],
  [ 'blink'                   , 'style.blink'             , 'boolean'   , undefined ],
  [ 'inverse'                 , 'style.inverse'           , 'boolean'   , undefined ],
  [ 'invisible'               , 'style.invisible'         , 'boolean'   , undefined ],
  [ 'transparent'             , 'style.transparent'       , 'boolean'   , undefined ],
  [ 'color'                   , 'style.fg'                , 'color'     , undefined ],

  [ 'background-fill'         , 'ch'                      , 'char'      , ' '       ],
  [ 'background-color'        , 'style.bg'                , 'color'     , undefined ],

  [ 'border-background'       , 'style.border.bg'         , 'color'     , null      ],
  [ 'border-color'            , 'style.border.fg'         , 'color'     , null      ],
  [ 'border-fill'             , 'border.ch'               , 'char'      , null      ],
  [ 'border-top'              , 'border.top'              , 'boolean'   , null      ],
  [ 'border-right'            , 'border.right'            , 'boolean'   , null      ],
  [ 'border-bottom'           , 'border.bottom'           , 'boolean'   , null      ],
  [ 'border-left'             , 'border.left'             , 'boolean'   , null      ],

  [ 'padding-top'             , 'padding.top'             , 'number'    , 0         ],
  [ 'padding-right'           , 'padding.right'           , 'number'    , 0         ],
  [ 'padding-bottom'          , 'padding.bottom'          , 'number'    , 0         ],
  [ 'padding-left'            , 'padding.left'            , 'number'    , 0         ],

  [ 'width'                   , 'position.width'          , 'dimension' , undefined ],
  [ 'height'                  , 'position.height'         , 'dimension' , undefined ],
  [ 'top'                     , 'position.top'            , 'dimension' , undefined ],
  [ 'right'                   , 'position.right'          , 'dimension' , undefined ],
  [ 'bottom'                  , 'position.bottom'         , 'dimension' , undefined ],
  [ 'left'                    , 'position.left'           , 'dimension' , undefined ],

  [ 'align'                   , 'align'                   , 'halign'    , 'left'    ],
  [ 'vertical-align'          , 'valign'                  , 'valign'    , 'top'     ],

  [ 'shadow'                  , 'shadow'                  , 'boolean'   , undefined ],
  [ 'hidden'                  , 'hidden'                  , 'boolean'   , false     ],
  [ 'shrink'                  , 'shrink'                  , 'boolean'   , undefined ],
  [ 'draggable'               , 'draggable'               , 'boolean'   , null      ],

  [ 'mouseable'               , (n) => n.enableMouse()    , 'boolean'   , null      ],
  [ 'keyable'                 , (n) => n.enableKeys()     , 'boolean'   , null      ]
];

const compositions = [
  /* BASE NAME       |  METHOD     |  SUFFIXES                            */
  [ 'background'     , 'match'     , '&fill?', '&color?'                  ],
  [ 'border'         , 'match'     , '&fill?', '&background', '&color?'   ],
  [ 'padding'        , 'alloc'     , '&top', '&right', '&bottom', '&left' ],
  [ 'position'       , 'alloc'     , 'top', 'right', 'bottom', 'left'     ],
];

const types = {
  undefined: { test() { return false; }, cast() {} },

  boolean: {
    test: (v) => /^(true|false)$/.test(v),
    cast: (v) => Boolean(v),
  },
  halign: {
    test: (v) => /^(left|center|right)$/.test(v),
    cast: (v) => v,
  },
  valign: {
    test: (v) => /^(top|middle|bottom)$/.test(v),
    cast: (v) => v,
  },
  char: {
    test: (v) => /^.{1}$/.test(v),
    cast: (v) => v,
  },
  number: {
    test: (v) => /^[-+]?\d+$/.test(v),
    cast: (v) => Number(v),
  },
  dimension: {
    test: (v) => /^[-+]?\d+(%(?=[-+]|$))?([-+]?\d+)?$/.test(v),
    cast: (v) => types.number.test(v) ? Number(v) : v,
  },
  color: {
    test: (v) => colors.convert(v) !== 0x1ff,
    cast: (v) => v,
  },
};


// helpers
const tableReducer = (i) => (m, r) => ({ ...m, [r[0]]: r[i] });
const prop2type = properties.reduce(tableReducer(2), {});
const prop2path = properties.reduce(tableReducer(1), {});
const prop2def  = properties.reduce(tableReducer(3), {});

const toType    = (prop) => prop2type[prop];
const toPath    = (prop) => prop2path[prop];
const toDefault = (prop) => prop2def[prop];

const testValue = (prop, val) => { return types[toType(prop)].test(val); }
const castValue = (prop, val) => { return types[toType(prop)].cast(val); }

const compileComposition = (base, method, ...suffixes) => {
  let props = suffixes
    .map(suf => suf.replace(/\&/g, base + '-'))
    .map(prop => prop.match(/^(.*?)(\?)?$/).slice(1))
    .map(v => ({ prop: v[0], opt: Boolean(v[1]) }));

  // for each value look for a property of a suitable
  // type in the specified order
  if (method === 'match') {
    return (vals) => {
      const result = [];
      let index = 0;
      for (let val of vals) {
        if (index >= props.length) { return null; }
        for (let { prop, opt } of props.slice(index)) {
          const match = testValue(prop, val);
          if (!match && !opt) { return null; }
          index = index + 1;
          if (!match) { continue; }
          result.push([ prop, val ]);
          break;
        }
      }
      // found a property for each value
      return result;
    }
  }

  // allocate arguments for sides by count of agruments
  if (method === 'alloc') {
    props = props.map(p => p.prop);
    const allocation = {
      1: [ 0, 0, 0, 0 ], // one for all
      2: [ 0, 1, 0, 1 ], // 1st: top, bottom; 2nd: right, left
      3: [ 0, 1, 2, 1 ], // 1st: top; 2nd: right, left; 3rd: bottom
      4: [ 0, 1, 2, 3 ]  // top, right, bottom, left
    };
    return (vals) => {
      let count = vals.length;
      if (count <= 0) { return null; }
      if (count > 4) { count = 4; }
      return allocation[count].map((vi, pi) =>
        [ props[pi], vals[vi] ]
      );
    }
  }

  // other methods return empty
  return (() => null);
}

const comp2pairs = compositions.reduce((m, r) => {
  return { ...m, [r[0]]: compileComposition(...r) };
}, {});



const getPairs = (prop, val) => {
  return (comp2pairs.hasOwnProperty(prop))
    ? comp2pairs[prop](val.split(/\s+/))
    : [[ prop, val ]];
}


const parse = (property, value, options = {}) => {
  const [val, imp] = value
    .trim()
    .replace(/['"]/g, '')
    .match(/^(.*?)\s*(\!important)?$/)
    .slice(1);

  return getPairs(property, val)
    .filter(Boolean)
    .map(([prop, val]) => {
      return {
        property  : prop,
        value     : castValue(prop, val),
        type      : toType(prop),
        path      : toPath(prop),
        important : Boolean(imp),
        isKnown   : Boolean(toType(prop)),
        isValid   : testValue(prop, val),
        ...options,
      };
    });
}


module.exports = {
  parse,

  defaults: properties.map(([prop, path, type, def]) => ({
    property  : prop,
    value     : def,
    type      : type,
    path      : path,
    important : false,
    isKnown   : true,
    isValid   : true,
    isDefault : true,
  })),

  data: {
    properties,
    compositions,
    types,

    prop2type,
    prop2path,
    prop2def
  },

  methods: {
    toType,
    toPath,
    toDefault,
    testValue,
    castValue,
    getPairs
  }
}

console.log(module.exports);
