export type SelectorChecker = (node: any, ...args: any[]) => boolean;

export interface PartlySelectorData {
  type: "id" | "class" | "pseudo" | "node";
  value: string;
  argument?: string;
  checker?: SelectorChecker;
}

export interface ComplexSelectorData {
  type: "selector";
  value: PartlySelectorData[];
}

export interface CombinatorSelectorData {
  type: "combinator";
  value: string;
}

export type SelectorData =
  | PartlySelectorData
  | CombinatorSelectorData
  | ComplexSelectorData;

// tslint:disable-next-line:max-classes-per-file
class BaseSelectorParser {
  protected static typeDefault: string = "";
  protected static typeMap: {
    [symbol: string]: string;
  } = {};

  public static getType(type: string): string {
    return this.typeMap.hasOwnProperty(type)
      ? this.typeMap[type]
      : this.typeDefault;
  }

  public static parse(selector: string, matches: string[]): SelectorData[] {
    throw new Error("Not implemented");
  }
}

// tslint:disable-next-line:max-classes-per-file
class PartlySelectorParser extends BaseSelectorParser {
  protected static typeDefault = "node";
  protected static typeMap = {
    "#": "id",
    ".": "class",
    ":": "pseudo",
    " ": "node",
  };

  public static parse(selector: string, matches: string[]): SelectorData[] {
    // split every selector on 4 part, e.g.:
    // 'node.foo:not($1)' => [
    //   '', undefined, 'node', undefined,
    //   '', '.'      , 'foo' , undefined,
    //   '', ':'      , 'not' , '1'      ,
    // ]
    const parts = selector
      .split(/(\.|\#|\:)?(\*|[-\w]+)(?:\(\$(\d+)\))?/i)
      .slice(0, -1);

    // check split result length
    if (parts.length % 4 !== 0) {
      throw new Error(
        `SimpleSelectorParser: Can not parse selector: "${selector}"`,
      );
    }

    // make chunks for each 4 items
    type selectorChunk = [string, string, string, string];
    const chunks = parts.reduce<selectorChunk[]>((acc, x, i, a) => {
      return i % 4 === 0 ? [...acc, a.slice(i, i + 4) as selectorChunk] : acc;
    }, []);

    // split must be matched fully
    if (chunks.some(([empty]) => Boolean(empty))) {
      throw new Error(
        `SimpleSelectorParser: Can not parse selector: "${selector}"`,
      );
    }

    // make selectors
    const selectors = chunks.map(([, typeSymbol, value, argumentKey]) => {
      const type = this.getType(typeSymbol);
      const argumentIndex = Number(argumentKey);
      const argument = (argumentKey && matches[argumentIndex]) || void 0;
      const checker = argument
        ? ArgumentParser.parse(type, value, argument)
        : void 0;
      return { type, value, argument, checker } as PartlySelectorData;
    });

    // star should be the node selector
    if (selectors.find(({ type, value }) => value === "*" && type !== "node")) {
      throw new Error(
        `SimpleSelectorParser: "*" is not node selector: "${selector}"`,
      );
    }

    return selectors;
  }
}

// tslint:disable-next-line:max-classes-per-file
class ComplexSelectorParser extends BaseSelectorParser {
  protected static typeDefault = "nested";
  protected static typeMap = {
    "+": "adjacent",
    "~": "next",
    ">": "child",
    " ": "nested",
  };

  public static parse(selector: string, matches: string[]): SelectorData[] {
    const selectors = selector
      // split on combinators and simple selectors
      // e.g. 'a > b c' => ['a', '>', 'b', ' ', 'c']
      .split(/(?:\s*(~|>|\+|\s)\s*)/i)
      .map((x) => {
        return this.typeMap.hasOwnProperty(x)
          ? ({
              type: "combinator",
              value: this.getType(x),
            } as CombinatorSelectorData)
          : ({
              type: "selector",
              value: PartlySelectorParser.parse(x, matches),
            } as ComplexSelectorData);
      });
    return selectors;
  }
}

// tslint:disable-next-line:max-classes-per-file
class ArgumentParser {
  protected static methodMap: {
    [name: string]: {
      method: "position";
    };
  } = {
    "nth-child": { method: "position" },
    "nth-of-type": { method: "position" },
    "nth-in-list": { method: "position" },

    "nth-last-child": { method: "position" },
    "nth-last-of-type": { method: "position" },
    "nth-last-in-list": { method: "position" },
  };

  private static position(argument = "") {
    // parse expresion
    const match = argument
      .replace(/\s/g, "")
      // https://regex101.com/r/oLXkqV/1
      //      [       a        ][ n ][   b    ] [         ]
      .match(/^([-+]?(?=\d|n)\d*)(n?)([-+]\d+)?$|(even|odd)$/);

    if (!match) {
      throw new Error(`ArgumentParser: Can not parse position argument`);
    }

    let n: boolean;
    let a: number;
    let b: number;

    // even or add
    if (match[4]) {
      n = true;
      a = match[4] === "even" ? 2 : 1;
      b = 0;
    } else {
      n = Boolean(match[2]);
      a = Number(match[1].replace(/^([-+]?)$/, "$11"));
      b = Number(match[3] || 0);
    }

    return (node: any, index: number): boolean => {
      return n
        ? (index - b) / a >= 0 && ((index - b) / a) % 1 === 0
        : a + b === index;
    };
  }

  public static parse(
    type: string,
    value: string,
    argument: string,
  ) {
    const options = this.methodMap[value];
    // always match by default
    if (!options) {
      return () => true;
    }
    if (!this.hasOwnProperty(options.method)) {
      return () => true;
    }
    return this[options.method](argument);
  }
}

export const selectorParser = (selector: string) => {
  const symbols = selector.trim().split("");
  const size = symbols.length;

  let count: number = 0;
  let match: string = "";
  let output: string = "";

  const matches: string[] = [];

  for (let index = 0; index < size; index++) {
    const symbol = symbols[index];
    const isEndOfInput = index === size - 1;

    // counting brackets
    if (symbol === "(") {
      count += 1;
    }

    // if top bracket closing
    if (count === 1 && symbol === ")") {
      const n = matches.push(match);
      output += `$${n - 1}`;
      match = "";
    }

    // if bracket not opened or current symbol
    // is top opening/closing bracket then write
    // into output else write into current match
    if (count === 0 || (count === 1 && ["(", ")"].includes(symbol))) {
      output = output + symbol;
    } else {
      match = match + symbol;
    }

    // counting brackets
    if (symbol === ")") {
      count -= 1;
    }

    // closed brackets more than opened or not all closed
    if (count < 0 || (isEndOfInput && count !== 0)) {
      throw new Error(`Parse selector error: brackets not match: ${selector}`);
    }
  }

  return ComplexSelectorParser.parse(output, matches);
};
