import { parseBasic, SelectorBasicData } from "./meta-basic";

export type SelectorPartValue = SelectorBasicData[];
export interface SelectorPartData {
  type: "selector";
  value: SelectorPartValue;
}

export type SelectorCombinatorValue = "adjacent" | "next" | "child" | "nested";
export interface SelectorCombinatorData {
  type: "combinator";
  value: SelectorCombinatorValue;
}

export type SelectorComplexData = SelectorPartData | SelectorCombinatorData;

const symbolToCombinator = (
  symbol: string
): SelectorCombinatorValue | undefined => {
  switch (symbol) {
    case "+":
      return "adjacent";
    case "~":
      return "next";
    case ">":
      return "child";
    case " ":
      return "nested";
    default:
      return void 0;
  }
};

export const parseComplex = (
  selector: string,
  replacements: { [key: string]: string }
): SelectorComplexData[] => {
  const selectors = selector
    // split on combinators and simple selectors
    // e.g.: 'a > b c' => ['a', '>', 'b', ' ', 'c']
    .split(/(?:\s*(~|>|\+|\s)\s*)/i)
    .map(x => {
      const combinator = symbolToCombinator(x);
      return combinator
        ? ({ type: "combinator", value: combinator } as SelectorCombinatorData)
        : ({
            type: "selector",
            value: parseBasic(x, replacements)
          } as SelectorPartData);
    });
  return selectors;
};
