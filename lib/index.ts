import { widget } from "blessed";
import BlessedCss from "./blessed-css";

export default class {
  private static cache = new WeakMap<widget.Screen, BlessedCss>();

  public static attach(screen: widget.Screen, css: string) {
    if (this.cache.has(screen)) { return; }
    this.cache.set(screen, new BlessedCss(screen, css));
  }

  public static detach(screen: widget.Screen) {
    if (this.cache.has(screen)) { return; }
    const blessedCss = this.cache.get(screen);
    if (!blessedCss) { return; }
    blessedCss.detach();
    this.cache.delete(screen);
  }
}
