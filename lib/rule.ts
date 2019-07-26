import { Rule as CssRule } from "css";
import NodeStyle from "./node-style";
import Property from "./property";
import Selector from "./selector";

export default class Rule {
  public readonly selectors: Selector[];
  public readonly properties: Property[];

  constructor(public readonly data: CssRule) {
    const { selectors = [], declarations = [] } = data;
    this.selectors = selectors.map(x => Selector.parse(x));
    const groups = declarations.map(x => Property.parse(x));
    this.properties = Property.flatSortUniq(groups);
  }

  public getProperties(nodeStyle: NodeStyle): Property[] {
    const selectors = this.selectors.filter(x => x.match(nodeStyle));
    if (!selectors.length) {
      return [];
    }

    const selector = selectors.slice(1).reduce((max, cur) => {
      return max.weight.cmp(cur.weight) >= 0 ? max : cur;
    }, selectors[0]);

    return this.properties.map(x => Property.extract(x, selector));
  }
}
