import Node from "../node";
import Weight from "../weight";

import { SelectorBasicData, SelectorBasicType } from "./meta-basic";
import {
  SelectorCombinatorData,
  SelectorComplexData,
  SelectorPartData
} from "./meta-complex";
import { selectorParser } from "./parser";

interface SelectorCheckOptions {
  method: "checkConditions" | "findNodeReverse";
  conditions?: SelectorBasicData[];
  combinator?: string;
}

export {
  SelectorBasicType,
  SelectorBasicData,
  SelectorPartData,
  SelectorCombinatorData,
  SelectorComplexData
};

export default class Selector {
  public static parse(selector: string): Selector {
    const components = selectorParser(selector);
    return new Selector(components);
  }

  public readonly weight: Weight;

  private reverseChecks: SelectorCheckOptions[];

  private constructor(public readonly components: SelectorComplexData[]) {
    this.weight = Weight.createFromSelector(this);

    this.reverseChecks = this.components
      .reduce<SelectorCheckOptions[]>((acc, selector) => {
        if (selector.type === "selector") {
          acc.push({
            method: "checkConditions",
            conditions: selector.value
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

  public match(node: Node): boolean {
    let current = node;
    for (const checkOptions of this.reverseChecks) {
      const method = checkOptions.method;
      const result = this[method](current, checkOptions);
      if (!result) {
        return false;
      }
      if (method === "findNodeReverse") {
        current = result as Node;
      }
    }
    return true;
  }

  private findNodeReverse(node: Node, options: SelectorCheckOptions) {
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
    let current: Node | undefined = node;
    do {
      current = direction === "left" ? current.prev : current.parent;
      if (current && this.checkConditions(current, options)) {
        return current;
      }
    } while (current && repeat);

    // not found
    return void 0;
  }

  private checkConditions(node: Node, options: SelectorCheckOptions) {
    if (!options.conditions) {
      return false;
    }

    if (!node) {
      return false;
    }

    const selector = node.selector;
    if (!selector) {
      return false;
    }

    // Check every basic selector
    const result = options.conditions.every(({ type, value, test }) => {
      if (type === "node" && value === "*") {
        return true;
      }
      const data = selector[type];
      const args = data && data[value];
      if (!args) {
        return false;
      }
      return test ? test(...args) : true;
    });

    return result;
  }
}
