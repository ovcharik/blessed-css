const css = `
  #body {
    background: black;
    width: 100%;
    height: 100%;
  }


  #menu {
    background: white;
    width: 25;
    height: 100%;
  }

  #menu > box {
    background: white;
    color: black;
    padding: 0 1;
    left: 0;
    right: 0
  }

  #menu > box:nth-in-list(n+8 ):nth-in-list(-n+9 ),
  #menu > box:nth-in-list(n+17):nth-in-list(-n+20),
  #menu > box:nth-in-list(n+27):nth-in-list(-n+28) {
    background: gray;
  }

  #menu > box:hover,
  #menu > box:selected {
    background: black !important;
    color: white !important;
  }


  #content {
    background: gray;
    width: 100%-26;
    height: 100%;
    left: 26;
  }
`;

const PropertyParser = require('../lib-old/utils/property-parser');

const blessed = require('blessed');
const blessedCss = require('../dist').default;

const screen = blessed.screen();
blessedCss.attach(screen, css);

const body = blessed.element({
  parent: screen,
  id: 'body'
});

const menu = blessed.list({
  parent: body,
  id: 'menu',
  items: PropertyParser.data.properties.map(p => p[0]),
  mouse: true,
  keys: true,
  label: 'MENU',
});

const content = blessed.box({ parent: body, id: 'content' });

console.log(content);
console.log(blessedCss);

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
screen.render();
