import { Position as CssPosition } from "css";
import Property from "./property";
import Selector, { SelectorBasicData, SelectorPartData } from "./selector";

export type WeightValue = [number, number, number, number, number];

export default class Weight {
  private static get zeroValue(): WeightValue {
    return [0, 0, 0, 0, 0];
  }

  public static createFromSelector(selector: Selector) {
    const map = {
      id: 2,
      class: 3,
      pseudo: 3,
      node: 4,
    };

    const complexSelectors = selector.components.filter(
      ({ type }) => type === "selector",
    ) as SelectorPartData[];

    const weight = complexSelectors
      .reduce<SelectorBasicData[]>((acc, { value }) => [...acc, ...value], [])
      .reduce<WeightValue>((acc, { type }) => {
        acc[map[type]] += 1;
        return acc;
      }, Weight.zeroValue);

    return new Weight(weight, {});
  }

  public static createFromProperty(property: Property) {
    const value: WeightValue = [property.isImportant ? 1 : 0, 0, 0, 0, 0];
    return new Weight(value, property.position);
  }

  private constructor(
    public readonly value: WeightValue = Weight.zeroValue,
    public readonly position: CssPosition,
  ) {}

  public sum(right: Weight): Weight {
    const value = right.value.reduce((acc, x, i) => {
      acc[i] = this.value[i] + x;
      return acc;
    }, Weight.zeroValue);
    return new Weight(value, this.position);
  }

  public cmp(right: Weight) {
    const result = right.value
      .reduce((acc, x, i) => {
        acc[i] = this.value[i] - x;
        return acc;
      }, Weight.zeroValue)
      .find((v) => v !== 0);

    if (result) {
      return result;
    }

    const a = Object.assign({ line: 0, column: 0 }, this.position);
    const b = Object.assign({ line: 0, column: 0 }, right.position);
    return a.line - b.line || a.column - b.column || 0;
  }
}
