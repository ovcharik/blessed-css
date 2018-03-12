# blessed-css

CSS for programs based on [blessed](https://github.com/chjj/blessed) library.


## Install (TODO)

```
npm install https://github.com/ovcharik/blessed-css
```


## Example

[![asciicast](https://asciinema.org/a/BCjEbpYMqpdaTsJbEJkoJfeL9.png)](https://asciinema.org/a/BCjEbpYMqpdaTsJbEJkoJfeL9)

```javascript
const css = `
  * { color: white; }

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
```


## Properties

| CSS property      | Type      | Node property |
|-------------------|-----------|---------------|
| |
| color             | color     | style.fg |
| bold              | boolean   | style.bold |
| underline         | boolean   | style.underline |
| blink             | boolean   | style.blink |
| inverse           | boolean   | style.inverse |
| invisible         | boolean   | style.invisible |
| transparent       | boolean   | style.transparent |
| |
| background        | calc      | background-fill? background-color? |
| background-color  | color     | style.bg |
| background-fill   | char      | ch |
| |
| border            | calc      | border-fill? border-background border-color? |
| border-background | color     | border.bg |
| border-color      | color     | border.fg |
| border-fill       | char      | border.ch |
| border-top        | boolean   | border.top |
| border-right      | boolean   | border.right |
| border-bottom     | boolean   | border.bottom |
| border-left       | boolean   | border.left |
| |
| padding           | calc      | padding |
| padding-top       | number    | padding.top |
| padding-right     | number    | padding.right |
| padding-bottom    | number    | padding.bottom |
| padding-left      | number    | padding.left |
| |
| width             | dimension | position.width |
| height            | dimension | position.height |
| |
| position          | calc      | position |
| top               | dimension | position.top |
| right             | dimension | position.right |
| bottom            | dimension | position.bottom |
| left              | dimension | position.left |
| |
| align             | halign    | align |
| vertical-align    | valign    | valign |
| |
| shadow            | boolean   | shadow |
| hidden            | boolean   | hidden |
| shrink            | boolean   | shrink |
| draggable         | boolean   | draggable |
| mouseable         | boolean   | node.enableMouse() |
| keyable           | boolean   | node.enableKey() |
