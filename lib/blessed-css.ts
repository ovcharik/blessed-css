import { Widgets } from "blessed";
import Stylesheet from "./stylesheet";
import NodeStyle from "./node-style";

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

  public render(node: NodeStyle) {
  }

}
