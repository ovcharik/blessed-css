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

  [ 'border-background'       , 'border.bg'               , 'color'     , null      ],
  [ 'border-color'            , 'border.fg'               , 'color'     , null      ],
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
  [ 'keyable'                 , (n) => n.enableKey()      , 'boolean'   , null      ]
];

const compositions = [
  /* BASE NAME       |  METHOD     |  SUFFIXES                               */
  [ 'background'     , 'match'     , '*-fill?', '*-color?'                    ],
  [ 'border'         , 'match'     , '*-fill?', '*-background', '*-color?'    ],
  [ 'padding'        , 'alloc'     , '*-top', '*-right', '*-bottom', '*-left' ],
  [ 'position'       , 'alloc'     , 'top', 'right', 'bottom', 'left'         ],
];

const typeTests = {
  boolean  : (v) => /^(true|false)$/.test(v),
  halign   : (v) => /^(left|center|right)$/.test(v),
  valign   : (v) => /^(top|middle|bottom)$/.test(v),
  char     : (v) => /^.{1}$/.test(v),
  number   : (v) => /^[-+]?\d+$/.test(v),
  dimension: (v) => /^[-+]?\d+(%(?=[-+]|$))?([-+]?\d+)?$/.test(v),
  color    : (v) => colors.convert(v) !== 0x1ff,
};

const typeCasts = {
  boolean  : (v) => Boolean(v),
  number   : (v) => Number(v),
  halign   : (v) => v,
  valign   : (v) => v,
  char     : (v) => v,
  dimension: (v) => typeTests.number(v) ? Number(v) : v,
  color    : (v) => v,
}


// helpers
const tableReducer = (i) => (m, r) => ({ ...m, [r[0]]: r[i] });
const prop2path = properties.reduce(tableReducer(1), {});
const prop2type = properties.reduce(tableReducer(2), {});
const prop2def  = properties.reduce(tableReducer(3), {});

const testValue = (prop, val) => {
  return prop2type[prop] && typeTests[prop2type[prop]](val);
}

const castValue = (prop, val) => {
  return prop2type[prop] && typeCasts[prop2type[prop]](val);
}

const compileComposition = (base, method, ...suffixes) => {
  const props = suffixes
    .map(suf => suf.replace(/\*/g, base))
    .map(suf => suf.match(/^(.*?)(\?)?$/).slice(1))
    .map(v => ({ prop: v[0], opt: Boolean(v[1]) }));

  if (method === 'match') return (vals) => {
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
    return result;
  }

  if (method === 'alloc') return (vals) => {
    const mapper = (vi, pi) => ([ props[pi].prop, vals[vi] ]);
    switch (vals.length) {
      case 1 : { return [ 0, 0, 0, 0 ].map(mapper); }
      case 2 : { return [ 0, 1, 0, 1 ].map(mapper); }
      case 3 : { return [ 0, 1, 2, 1 ].map(mapper); }
      case 4 : { return [ 0, 1, 2, 3 ].map(mapper); }
      default: { return null };
    }
  }

  return (() => null);
}

const comp2pairs = compositions.reduce((m, r) => {
  return { ...m, [r[0]]: compileComposition(...r) };
}, {});


module.exports = (property, value, options = {}) => {
  const [val, important] = value
    .trim()
    .replace(/['"]/g, '')
    .match(/^(.*?)\s*(\!important)?$/)
    .slice(1);

  const pairs = (comp2pairs.hasOwnProperty(property))
    ? comp2pairs[property](val.split(/\s+/))
    : [[ property, val ]];

  return pairs.map(([property, value]) => {
    return {
      property  : property,
      value     : castValue(property, value),
      type      : prop2type[property],
      important : Boolean(important),
      path      : prop2path[property],
      default   : prop2def[property],
      isKnown   : prop2type.hasOwnProperty(property),
      isValid   : testValue(property, value),
      ...options,
    };
  });
}
