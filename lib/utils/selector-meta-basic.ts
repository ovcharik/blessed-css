import {
  PseudoName,
  PseudoArgumentTest,
  getPseudoArgumentTest,
} from "./selector-meta-pseudo";

export type SelectorBasicType = "id" | "class" | "pseudo" | "node";

export interface SelectorBasicData {
  type: SelectorBasicType;
  value: string;
  test?: PseudoArgumentTest;
}

const symbolToType = (symbol: string): SelectorBasicType => {
  switch (symbol) {
    case "#":
      return "id";
    case ".":
      return "class";
    case ":":
      return "pseudo";
    default:
      return "node";
  }
};

export const parseBasic = (
  selector: string,
  replacements: { [key: string]: string },
): SelectorBasicData[] => {
  // split every selector on 4 part, e.g.:
  // 'node.foo:not($1)' => [
  //   '', undefined, 'node', undefined,
  //   '', '.'      , 'foo' , undefined,
  //   '', ':'      , 'not' , '$1'     ,
  // ]
  const parts = selector
    .split(/(\.|\#|\:)?(\*|[-\w]+)(?:\((\$\d+)\))?/i)
    .slice(0, -1);

  // check split result length
  if (parts.length % 4 !== 0) {
    throw new Error(
      `SimpleSelectorParser: Can not parse selector: "${selector}"`,
    );
  }

  // make chunks for each 4 items
  type basicChunk = [string, string, string, string];
  const chunks = parts.reduce<basicChunk[]>((acc, x, i, a) => {
    return i % 4 === 0 ? [...acc, a.slice(i, i + 4) as basicChunk] : acc;
  }, []);

  // split must be matched fully
  if (chunks.some(([empty]) => Boolean(empty))) {
    throw new Error(
      `SimpleSelectorParser: Can not parse selector: "${selector}"`,
    );
  }

  // make selectors
  const selectors = chunks.map<SelectorBasicData>(([, symbol, value, key]) => {
    const type = symbolToType(symbol);
    const test =
      type === "pseudo"
        ? getPseudoArgumentTest(value as PseudoName, replacements[key])
        : void 0;
    return { type, value, test };
  });

  // star should be the node selector
  if (selectors.find(({ type, value }) => value === "*" && type !== "node")) {
    throw new Error(
      `SimpleSelectorParser: "*" is not node selector: "${selector}"`,
    );
  }

  return selectors;
};
