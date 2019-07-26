export type PseudoName =
  | "nth-child"
  | "nth-of-type"
  | "nth-in-list"
  | "nth-last-child"
  | "nth-last-of-type"
  | "nth-last-in-list";

export type PseudoArgumentType = "position";
export type PseudoArgumentArgs = any[];
export type PseudoArgumentTest = (...args: PseudoArgumentArgs) => boolean;

const nameToType: { [name in PseudoName]?: PseudoArgumentType } = {
  "nth-child": "position",
  "nth-of-type": "position",
  "nth-in-list": "position",
  "nth-last-child": "position",
  "nth-last-of-type": "position",
  "nth-last-in-list": "position"
};

const typeToParser: {
  [type in PseudoArgumentType]: (type?: string) => PseudoArgumentTest;
} = {
  position(argument: string = "") {
    // https://regex101.com/r/oLXkqV/1
    const match = argument
      .replace(/\s/g, "")
      .match(/^([-+]?(?=\d|n)\d*)(n?)([-+]\d+)?$|(even|odd)$/);

    if (!match) {
      throw new Error(
        `ArgumentParser: Can not parse position argument: ${argument}`
      );
    }

    const hasVariable: boolean = Boolean(match[4] || match[2]);

    let a: number;
    let b: number;

    if (match[4]) {
      a = match[4] === "even" ? 2 : 1;
      b = 0;
    } else {
      a = Number(match[1].replace(/^([-+]?)$/, "$11"));
      b = Number(match[3] || 0);
    }

    return (x: number): boolean => {
      return hasVariable
        ? (x - b) / a >= 0 && ((x - b) / a) % 1 === 0
        : a + b === x;
    };
  }
};

export const getPseudoArgumentTest = (
  name: PseudoName,
  argument?: string
): PseudoArgumentTest | undefined => {
  const type = nameToType[name];
  if (!type) {
    return void 0;
  }
  return typeToParser[type](argument);
};
