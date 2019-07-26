import { parse as cssParser } from "css";

import Node from "./node";
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

  public getProperties(node: Node) {
    const groups = this.rules.map(x => x.getProperties(node)).filter(Boolean);
    return Property.flatSortUniq(groups);
  }
}
