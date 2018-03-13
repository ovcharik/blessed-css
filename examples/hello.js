const css = `
  * { color: white !important; }

  .bg-black { background: black; }
  .bg-white { background: white; }
  .bg-magenta { background: magenta; }

  .content {
    width: 100%;
    height: 100%;
  }

  .banner {
    width: 40;
    height: 10;
    left: 50%-20;
    top: 50%-5;
  }

  .banner > * {
    mouseable: true;
    width: 100%-6;
    height: 100%-2;
    position: 1 3;
    align: center;
    vertical-align: middle;
  }

  .banner > *:hover {
    vertical-align: top;
  }

  .banner .bg-magenta:hover {
    background: blue;
  }
`;

const blessed = require('blessed');
const blessedCss = require('..');

const screen = blessed.screen();
blessedCss.attach(screen, css);

const content = blessed.element({ parent: screen , class: 'content bg-black' });
const banner  = blessed.element({ parent: content, class: 'banner bg-white'  });
const text    = blessed.element({ parent: banner , class: 'bg-magenta' });

text.setContent('Hello, World!');

screen.key('q', () => process.exit(0));
screen.render();
