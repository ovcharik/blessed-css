const Cache = require('./utils/cache');
const BlessedCss = require('./blessed-css');

const cache = new Cache();

module.exports = {
  attach: (screen, css) => {
    if (cache.has(screen)) {
      throw new Error('Blessed CSS already attached on this screen.');
    }
    cache.set(screen, new BlessedCss(screen, css));
  },

  detach: (screen) => {
    if (!cache.has(screen)) {
      throw new Error('Blessed CSS not attached on this screen.')
    }
    const blessedCss = cache.get(screen);
    blessedCss.detach();
    cache.del(screen);
  },
};
