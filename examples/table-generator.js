// prettier-ignore
const propertyTable = [
  [ 'bold'                    , 'style.bold'              , 'boolean'   , undefined ],
  [ 'underline'               , 'style.underline'         , 'boolean'   , undefined ],
  [ 'blink'                   , 'style.blink'             , 'boolean'   , undefined ],
  [ 'inverse'                 , 'style.inverse'           , 'boolean'   , undefined ],
  [ 'invisible'               , 'style.invisible'         , 'boolean'   , undefined ],
  [ 'transparent'             , 'style.transparent'       , 'boolean'   , undefined ],
  [ 'color'                   , 'style.fg'                , 'color'     , undefined ],
  [ 'background-color'        , 'style.bg'                , 'color'     , undefined ],
  [ 'background-fill'         , 'ch'                      , 'char'      , ' '       ],
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
  [ 'mouseable'               , null                      , 'boolean'   , null      ],
  [ 'keyable'                 , null                      , 'boolean'   , null      ]
];

const _ = (global._ = require("lodash"));
const blessed = require("blessed");
const blessedColors = require("blessed/lib/colors");
console.log(blessedColors);

const screen = blessed.screen();
const el = blessed.element();

const { rows, cols } = _.chain(propertyTable)
  .transform(
    (table, [prop, path, type]) => {
      const { cols } = table;

      const defaultValue = _.has(el, path) ? _.get(el, path) : null;

      const row = [prop, path, type, defaultValue].map(JSON.stringify).map(v => v || "undefined");

      table.rows.push(row);
      table.cols = _.chain(row)
        .map(s => s.length)
        .zip(table.cols)
        .map(_.max)
        .value();
    },
    { rows: [], cols: [25, 25, 0, 0] },
  )
  .value();

const table = [
  "[",
  rows
    .map(row => row.map((c, i) => _.padEnd(c, cols[i])))
    .map(row => `  [ ${row.join(" , ")} ]`)
    .join(",\n"),
  "]",
]
  .join("\n")
  .replace(/"/g, `'`);

global.rows = rows;
global.cols = cols;
global.table = table;
console.log(table);
