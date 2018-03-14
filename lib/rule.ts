import { Rule as CssRule } from "css";

import Selector from "./selector";
import Property from "./property";

export default class Rule {
  public readonly selectors: Selector[];
  public readonly properties: Property[];

  constructor(public readonly data: CssRule) {
    const defaultRule = { selectors: [], declarations: [] };
    const { selectors, declarations } = Object.assign(defaultRule, data);

    this.selectors = selectors.map((x) => Selector.parse(x));

    const groups = declarations.map((x) => Property.parse(x));
    this.properties = Property.flatSortUniq(groups);
  }

  public getProperties(nodeStyle: any): Property[] {
    const selectors = this.selectors.filter((x) => x.match(nodeStyle));
    if (!selectors.length) {
      return [];
    }

    const selector = selectors.slice(1).reduce((max, cur) => {
      return max.weight.cmp(cur.weight) >= 0 ? max : cur;
    }, selectors[0]);

    return this.properties.map((x) => Property.extract(x, selector));
  }
}

module.exports = Rule;
