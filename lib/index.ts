import { widget } from "blessed";
import BlessedCss from "./blessed-css";

const cache = new WeakMap<widget.Screen, BlessedCss>();

export function attach(screen: widget.Screen, css: string) {
    if (cache.has(screen)) { return; }
    cache.set(screen, new BlessedCss(screen, css));
  }

export function detach(screen: widget.Screen) {
  if (cache.has(screen)) { return; }
  const blessedCss = cache.get(screen);
  if (!blessedCss) { return; }
  blessedCss.detach();
  cache.delete(screen);
}

export default {
  attach,
  detach,
};
