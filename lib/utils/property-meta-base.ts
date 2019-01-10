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

export type PropertyAccessors = (
  get?: boolean,
) => (node: widget.Element, value?: PropertyValue) => PropertyValue;

export interface PropertyData {
  position: CssPosition;

  name: string;
  value: PropertyValue;
  type: PropertyType;

  set: ReturnType<PropertyAccessors>;
  get: ReturnType<PropertyAccessors>;

  isImportant: boolean;
  isKnown: boolean;
  isValid: boolean;
  isDefault: boolean;
}

const accessByPath = (path: string): PropertyAccessors => {
  const steps = path.split(".");
  const head = steps.slice(0, -1);
  const tail = steps.slice(-1)[0];

  return (get = false) => (node: widget.Element, value?: PropertyValue) => {
    let current: any = node;
    for (const step of head) {
      if (!current[step]) {
        current[step] = {};
      }
      current = current[step];
    }
    return get ? current[tail] : (current[tail] = value);
  };
};

const accessByFn = (fn: string, prop: string): PropertyAccessors => {
  return (get = false) => (node: widget.Element, value?: PropertyValue) => {
    if (!get) {
      (node as any)[fn]();
    }
    return (node as any)[prop];
  };
};

type PropertiesTableRow = [
  string,
  PropertyAccessors,
  PropertyType,
  PropertyValue
];

const propertiesTable: PropertiesTableRow[] = [
  ["bold", accessByPath("style.bold"), "boolean", undefined],
  ["underline", accessByPath("style.underline"), "boolean", undefined],
  ["blink", accessByPath("style.blink"), "boolean", undefined],
  ["inverse", accessByPath("style.inverse"), "boolean", undefined],
  ["invisible", accessByPath("style.invisible"), "boolean", undefined],
  ["transparent", accessByPath("style.transparent"), "boolean", undefined],
  ["color", accessByPath("style.fg"), "color", undefined],

  ["background-fill", accessByPath("ch"), "char", " "],
  ["background-color", accessByPath("style.bg"), "color", undefined],

  ["border-background", accessByPath("style.border.bg"), "color", null],
  ["border-color", accessByPath("style.border.fg"), "color", null],
  ["border-fill", accessByPath("border.ch"), "char", null],
  ["border-top", accessByPath("border.top"), "boolean", null],
  ["border-right", accessByPath("border.right"), "boolean", null],
  ["border-bottom", accessByPath("border.bottom"), "boolean", null],
  ["border-left", accessByPath("border.left"), "boolean", null],

  ["padding-top", accessByPath("padding.top"), "number", 0],
  ["padding-right", accessByPath("padding.right"), "number", 0],
  ["padding-bottom", accessByPath("padding.bottom"), "number", 0],
  ["padding-left", accessByPath("padding.left"), "number", 0],

  ["width", accessByPath("position.width"), "dimension", undefined],
  ["height", accessByPath("position.height"), "dimension", undefined],
  ["top", accessByPath("position.top"), "dimension", undefined],
  ["right", accessByPath("position.right"), "dimension", undefined],
  ["bottom", accessByPath("position.bottom"), "dimension", undefined],
  ["left", accessByPath("position.left"), "dimension", undefined],

  ["align", accessByPath("align"), "halign", "left"],
  ["vertical-align", accessByPath("valign"), "valign", "top"],

  ["shadow", accessByPath("shadow"), "boolean", undefined],
  ["hidden", accessByPath("hidden"), "boolean", false],
  ["shrink", accessByPath("shrink"), "boolean", undefined],
  ["draggable", accessByPath("draggable"), "boolean", null],

  ["mouseable", accessByFn("enableMouse", "clickable"), "boolean", null],
  ["keyable", accessByFn("enableKeys", "keyable"), "boolean", null],
];

// helpers
const tableReducer = <
  T extends PropertyValue | PropertyType | PropertyAccessors
>(
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

const reduce = <T extends PropertyValue | PropertyType | PropertyAccessors>(
  i: number,
) => {
  const reducer = tableReducer<T>(i);
  return propertiesTable.reduce<{ [key: string]: T }>(reducer, {});
};

const propToAccessorsMap = reduce<PropertyAccessors>(1);
const propToTypeMap = reduce<PropertyType>(2);
const propToDefaultMap = reduce<PropertyValue>(3);

export const getPropertyAccessors = (property: string) =>
  propToAccessorsMap[property];
export const getPropertyType = (property: string) => propToTypeMap[property];
export const getPropertyDefault = (property: string) =>
  propToDefaultMap[property];

export const propertyDefaults: PropertyData[] = propertiesTable.map(
  ([name, accessors, type, value]) => {
    return {
      position: { column: 0, line: 0 },

      name,
      value,
      type,

      get: accessors(true),
      set: accessors(false),

      isImportant: false,
      isKnown: true,
      isValid: true,
      isDefault: true,
    };
  },
);
