import Weight from "./weight";
import {
  selectorParser,
  SelectorData,
  PartlySelectorData,
} from "./utils/selector-parser";

interface SelectorCheckOptions {
  method: "checkConditions" | "findNodeReverse";
  conditions?: PartlySelectorData[];
  combinator?: string;
}

export default class Selector {
  public static parse(selector: string): Selector {
    const components = selectorParser(selector);
    return new Selector(components);
  }

  public readonly weight: Weight;

  private reverseChecks: SelectorCheckOptions[];

  constructor(public readonly components: SelectorData[]) {
    this.weight = Weight.createFromSelector(this);

    this.reverseChecks = this.components
      .reduce<SelectorCheckOptions[]>((acc, selector) => {
        if (selector.type === "selector") {
          acc.push({
            method: "checkConditions",
            conditions: selector.value,
          });
        } else {
          const last = acc.slice(-1)[0];
          last.method = "findNodeReverse";
          last.combinator = selector.value;
        }
        return acc;
      }, [])
      .reverse();
  }

  public match(nodeStyle: any): boolean {
    let current = nodeStyle;
    for (const checkOptions of this.reverseChecks) {
      const result = this[checkOptions.method](current, checkOptions);
      if (!result) {
        return false;
      }
      if (checkOptions.method === "findNodeReverse") {
        current = result;
      }
    }
    return true;
  }

  private findNodeReverse(nodeStyle: any, options: SelectorCheckOptions) {
    // config
    let direction: string;
    let repeat: boolean;

    // node navigation by combinator of selectors
    switch (options.combinator) {
      case "adjacent": {
        direction = "left";
        repeat = true;
        break;
      }
      case "next": {
        direction = "left";
        repeat = false;
        break;
      }
      case "child": {
        direction = "top";
        repeat = false;
        break;
      }
      case "nested": {
        direction = "top";
        repeat = true;
        break;
      }
      default: {
        direction = "top";
        repeat = true;
        break;
      }
    }

    // search first suitable node
    let current = nodeStyle;
    do {
      current = direction === "left" ? current.leftStyle : current.parentStyle;
      if (current && this.checkConditions(current, options)) {
        return current;
      }
    } while (current && repeat);

    // not found
    return null;
  }

  private checkConditions(nodeStyle: any, options: SelectorCheckOptions) {
    if (!options.conditions) {
      return false;
    }

    if (!nodeStyle) {
      return false;
    }

    const selector = nodeStyle.selector;
    if (!selector) {
      return false;
    }

    // Check every partly selector
    const result = options.conditions.every(({ type, value, checker }) => {
      if (type === "node" && value === "*") {
        return true;
      }
      const args = selector[type] && selector[type][value];
      if (!args) {
        return false;
      }
      return checker ? checker(nodeStyle, ...args) : true;
    });

    return result;
  }
}
