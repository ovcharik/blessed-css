import { Widgets } from "blessed";

import Stylesheet from "./stylesheet";
import { memoize } from "./utils/decorators";

export default class BlessedCss {

  private listeners = [];

  private stylesheet: Stylesheet;

  constructor(
    private screen: Widgets.Screen,
    private cssSource: string,
  ) {
    this.stylesheet = new Stylesheet(cssSource.toLowerCase());
    console.log(this);
  }

  public attach() {
  }

  public detach() {
  }

}
