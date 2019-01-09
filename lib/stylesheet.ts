import { parse as cssParser } from "css";
import Rule from "./rule";
import Property from "./property";
import NodeStyle from "./node-style";

export default class Stylesheet {
  private rules: Rule[];

  constructor(cssSource: string) {
    const parsed = cssParser(cssSource);
    if (!parsed || !parsed.stylesheet) {
      throw new Error("Can't parse css");
    }
    this.rules = parsed.stylesheet.rules.map((x) => new Rule(x));
  }

  public getProperties(nodeStyle: NodeStyle) {
    const groups = this.rules
      .map((x) => x.getProperties(nodeStyle))
      .filter(Boolean);
    return Property.flatSortUniq(groups);
  }
}
