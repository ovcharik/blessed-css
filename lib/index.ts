import { Widgets } from "blessed";

import BlessedCss from "./blessed-css";
import lens from "./utils/lens";

export default class {
  private static cache = new WeakMap<Widgets.Screen, BlessedCss>();

  public static attach(screen: Widgets.Screen, css: string) {
    if (this.cache.has(screen)) { return; }
    this.cache.set(screen, new BlessedCss(screen, css));
  }

  public static detach(screen: Widgets.Screen) {
    if (this.cache.has(screen)) { return; }
    const blessedCss = this.cache.get(screen);
    if (!blessedCss) { return; }
    blessedCss.detach();
    this.cache.delete(screen);
  }
}
