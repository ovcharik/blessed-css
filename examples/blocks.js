const treeLess = `
  // Default styles
  element {
    mouseable: true;
    width: 100%;
    height: 100%;
    color: white;
  }

  // Generate backgrounds: .bg-black, .bg-white, ...
  @colors: black, white, red, green, blue, yellow, magenta;
  .for-each (@color in @colors) {
    .bg-@{color} { background: @color; }
    .bg-h-@{color}:hover { background: @color; }

    .fg-@{color} { color: @color; }
    .fg-h-@{color}:hover { color: @color; }
  }

  // Line with 3 items
  .line-3 {
    & * {
      width: '100%-6';
      height: '100%-4';
      top: 2;
      left: 3;
    }

    & > * { width: '33%-6'; }
    & > *:nth-child(2) { left: '33%+3'; }
    & > *:nth-child(3) { left: '66%+3'; }

    & * * { padding: 2 5; }
    & * ~ * * { padding-top: 5; }
    & * + *:last-child * { padding-left: -15; }
  }
`;

const treeJson = {
  class: 'bg-black line-3',
  content: [
    {
      class: 'bg-h-magenta bg-white',
      content: [{
        class: 'fg-h-magenta bg-h-yellow bg-red',
        content: 'Red block',
      }],
    }, {
      class: 'bg-h-magenta bg-white',
      content: [{
        class: 'fg-h-magenta bg-h-yellow bg-green',
        content: 'Green block',
      }],
    }, {
      class: 'bg-h-magenta bg-white',
      content: [{
        class: 'fg-h-magenta bg-h-yellow bg-blue',
        content: 'Blue block',
      }],
    },
  ]
};


const less = require('less');
const lessLists = require('less-plugin-lists');

const blessed = require('blessed');
const blessedCss = require('..');


less.render(treeLess, { plugins: [new lessLists()] }).then(({ css }) => {
  const screen = blessed.screen();
  blessedCss.attach(screen, css);

  // recursive tree building
  (function buildTree(parent, { class: cl, content }) {
    const node = blessed.element({ parent, class: cl });
    if (typeof(content) === 'string') { node.setContent(content); }
    else { content.forEach(buildTree.bind(null, node)); }
  })(screen, treeJson);

  screen.key('q', () => process.exit(0));
  screen.render();
}, console.error);
