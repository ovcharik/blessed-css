import { Position as CssPosition } from "css";
import { widget } from "blessed";

export type PropertyValue =
  | null
  | undefined
  | string
  | boolean
  | number
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom";

export type PropertyType =
  | "undefined"
  | "boolean"
  | "char"
  | "color"
  | "dimension"
  | "halign"
  | "number"
  | "valign";

export type PropertyApply = (
  node: widget.Element,
  value?: PropertyValue,
) => void;

export interface PropertyData {
  position: CssPosition;

  name: string;
  value: PropertyValue;
  type: PropertyType;
  apply: PropertyApply;

  isImportant: boolean;
  isKnown: boolean;
  isValid: boolean;
  isDefault: boolean;
}

const applyByPath = (path: string): PropertyApply => {
  const steps = path.split(".");
  const head = steps.slice(0, -1);
  const tail = steps.slice(-1)[0];

  return (node: widget.Element, value?: PropertyValue) => {
    let current: any = node;
    for (const step of head) {
      if (!current[step]) {
        current[step] = {};
      }
      current = current[step];
    }
    current[tail] = value;
  };
};

type PropertiesTableRow = [string, PropertyApply, PropertyType, PropertyValue];

const propertiesTable: PropertiesTableRow[] = [
  ["bold", applyByPath("style.bold"), "boolean", undefined],
  ["underline", applyByPath("style.underline"), "boolean", undefined],
  ["blink", applyByPath("style.blink"), "boolean", undefined],
  ["inverse", applyByPath("style.inverse"), "boolean", undefined],
  ["invisible", applyByPath("style.invisible"), "boolean", undefined],
  ["transparent", applyByPath("style.transparent"), "boolean", undefined],
  ["color", applyByPath("style.fg"), "color", undefined],

  ["background-fill", applyByPath("ch"), "char", " "],
  ["background-color", applyByPath("style.bg"), "color", undefined],

  ["border-background", applyByPath("style.border.bg"), "color", null],
  ["border-color", applyByPath("style.border.fg"), "color", null],
  ["border-fill", applyByPath("border.ch"), "char", null],
  ["border-top", applyByPath("border.top"), "boolean", null],
  ["border-right", applyByPath("border.right"), "boolean", null],
  ["border-bottom", applyByPath("border.bottom"), "boolean", null],
  ["border-left", applyByPath("border.left"), "boolean", null],

  ["padding-top", applyByPath("padding.top"), "number", 0],
  ["padding-right", applyByPath("padding.right"), "number", 0],
  ["padding-bottom", applyByPath("padding.bottom"), "number", 0],
  ["padding-left", applyByPath("padding.left"), "number", 0],

  ["width", applyByPath("position.width"), "dimension", undefined],
  ["height", applyByPath("position.height"), "dimension", undefined],
  ["top", applyByPath("position.top"), "dimension", undefined],
  ["right", applyByPath("position.right"), "dimension", undefined],
  ["bottom", applyByPath("position.bottom"), "dimension", undefined],
  ["left", applyByPath("position.left"), "dimension", undefined],

  ["align", applyByPath("align"), "halign", "left"],
  ["vertical-align", applyByPath("valign"), "valign", "top"],

  ["shadow", applyByPath("shadow"), "boolean", undefined],
  ["hidden", applyByPath("hidden"), "boolean", false],
  ["shrink", applyByPath("shrink"), "boolean", undefined],
  ["draggable", applyByPath("draggable"), "boolean", null],

  ["mouseable", (node) => node.enableMouse(), "boolean", null],
  ["keyable", (node) => node.enableKeys(), "boolean", null],
];

// helpers
const tableReducer = <T extends PropertyValue | PropertyType | PropertyApply>(
  i: number,
) => {
  return (
    acc: { [key: string]: T },
    row: PropertiesTableRow,
  ): { [key: string]: T } => {
    acc[row[0]] = row[i] as T;
    return acc;
  };
};

const reduce = <T extends PropertyValue | PropertyType | PropertyApply>(
  i: number,
) => {
  const reducer = tableReducer<T>(i);
  return propertiesTable.reduce<{ [key: string]: T }>(reducer, {});
};

const propToApplyMap = reduce<PropertyApply>(1);
const propToTypeMap = reduce<PropertyType>(2);
const propToDefaultMap = reduce<PropertyValue>(3);

export const getPropertyApply = (property: string) => propToApplyMap[property];
export const getPropertyType = (property: string) => propToTypeMap[property];
export const getPropertyDefault = (property: string) =>
  propToDefaultMap[property];

export const propertyDefaults: PropertyData[] = propertiesTable.map(
  ([p, a, t, d]) => {
    return {
      position: { column: 0, line: 0 },

      name: p,
      value: d,
      type: t,
      apply: a,

      isImportant: false,
      isKnown: true,
      isValid: true,
      isDefault: true,
    };
  },
);
