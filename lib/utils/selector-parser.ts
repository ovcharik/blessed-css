import { parseComplex } from "./selector-meta-complex";

const extractBracketsContent = (selector: string) => {
  const symbols = selector.trim().split("");
  const size = symbols.length;

  let count: number = 0;
  let match: string = "";
  let output: string = "";

  const replacements: string[] = [];

  for (let index = 0; index < size; index++) {
    const symbol = symbols[index];
    const isEndOfInput = index === size - 1;

    // counting brackets
    if (symbol === "(") {
      count += 1;
    }

    // if top bracket closing
    if (count === 1 && symbol === ")") {
      const n = replacements.push(match);
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

  return {
    output,
    replacements: replacements.reduce<{ [key: string]: string }>(
      (acc, x, i) => ({ ...acc, [`$${i}`]: x }),
      {},
    ),
  };
};

export const selectorParser = (selector: string) => {
  const { output, replacements } = extractBracketsContent(selector);
  return parseComplex(output, replacements);
};
