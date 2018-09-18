import { testValueType } from "./property-meta-types";

type CompositionMethod = "match" | "alloc";
type CompositionSuffix = [string, boolean?];
type CompositionPair = [string, string];
type CompositionPairs = CompositionPair[];
type CompositionsTableRow = [
  string,
  CompositionMethod,
  ...CompositionSuffix[]
];

const compositionsTable: CompositionsTableRow[] = [
  ["background", "match", ["&fill", true], ["&color", true]],
  ["border", "match", ["&fill", true], ["&background"], ["&color", true]],
  ["padding", "alloc", ["&top"], ["&right"], ["&bottom"], ["&left"]],
  ["position", "alloc", ["top"], ["right"], ["bottom"], ["left"]],
];

const compileComposition = (
  base: string,
  method: CompositionMethod,
  // tslint:disable-next-line:trailing-comma
  ...suffixes: CompositionSuffix[]
): ((values: string[]) => CompositionPairs) => {
  const props = suffixes
    .map(
      ([suf, opt]): [string, boolean] => [
        suf.replace(/\&/g, base + "-"),
        Boolean(opt),
      ],
    )
    .map(([prop, opt]) => ({ prop, opt }));

  // for each value look for a property of a suitable
  // type in the specified order
  if (method === "match") {
    return (values: string[]) => {
      const result: CompositionPairs = [];
      let index = 0;
      for (const val of values) {
        if (index >= props.length) {
          return [];
        }
        for (const { prop, opt } of props.slice(index)) {
          const match = testValueType(prop, val);
          if (!match && !opt) {
            return [];
          }
          index = index + 1;
          if (!match) {
            continue;
          }
          result.push([prop, val]);
          break;
        }
      }
      // found a property for each value
      return result;
    };
  }

  // allocate arguments for sides by count of agruments
  if (method === "alloc") {
    const allocation: { [key: number]: number[] } = {
      1: [0, 0, 0, 0], // one for all
      2: [0, 1, 0, 1], // 1st: top, bottom; 2nd: right, left
      3: [0, 1, 2, 1], // 1st: top; 2nd: right, left; 3rd: bottom
      4: [0, 1, 2, 3], // top, right, bottom, left
    };
    return (values: string[]) => {
      let count = values.length;
      if (count <= 0) {
        return [];
      }
      if (count > 4) {
        count = 4;
      }
      const result = allocation[count].map(
        (vi, pi) => [props[pi].prop, values[vi]] as CompositionPair,
      );
      return result;
    };
  }

  // other methods return empty
  return (values: string[]) => [];
};

const compositionToPairsMap = compositionsTable.reduce<{
  [key: string]: (values: string[]) => CompositionPairs;
}>((acc, row: CompositionsTableRow) => {
  acc[row[0]] = compileComposition(...row);
  return acc;
}, {});

export const getPropertyPairs = (
  property: string,
  value: string,
): CompositionPairs => {
  return compositionToPairsMap.hasOwnProperty(property)
    ? compositionToPairsMap[property](value.split(/\s+/))
    : [[property, value]];
};
