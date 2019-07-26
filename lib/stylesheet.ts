import { parse as cssParser } from "css";
import NodeStyle from "./node-style";
import Property from "./property";
import Rule from "./rule";

export default class Stylesheet {
  private rules: Rule[];

  constructor(cssSource: string) {
    const parsed = cssParser(cssSource);
    if (!parsed || !parsed.stylesheet) {
      throw new Error("Can't parse css");
    }
    this.rules = parsed.stylesheet.rules.map(x => new Rule(x));
  }

  public getProperties(nodeStyle: NodeStyle) {
    const groups = this.rules
      .map(x => x.getProperties(nodeStyle))
      .filter(Boolean);
    return Property.flatSortUniq(groups);
  }
}
