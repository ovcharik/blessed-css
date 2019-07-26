import { widget } from "blessed";
import { Position as CssPosition } from "css";

// meta table helper types
type Cols = 0 | 1 | 2 | 3;
type Rows = (typeof propertiesTable)[number];
type UnionFromColumn<N extends Cols> = Rows[N];

// types of properties
export type PropertyName = UnionFromColumn<0>;
export type PropertyAccessor = (
  get?: boolean
) => (node: widget.Element, value?: PropertyValue) => PropertyValue;
export type PropertyType = UnionFromColumn<2>;
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

export interface PropertyData {
  position: CssPosition;

  name: PropertyName;
  value: PropertyValue;
  type: PropertyType;

  set: ReturnType<PropertyAccessor>;
  get: ReturnType<PropertyAccessor>;

  isImportant: boolean;
  isKnown: boolean;
  isValid: boolean;
  isDefault: boolean;
}

const accessByPath = (path: string): PropertyAccessor => {
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

const accessByFn = (fn: string, prop: string): PropertyAccessor => {
  return (get = false) => (node: widget.Element, value?: PropertyValue) => {
    if (!get) {
      (node as any)[fn]();
    }
    return (node as any)[prop];
  };
};

const row = <Name extends string, Type extends string>(
  property: Name,
  accessor: PropertyAccessor,
  type: Type,
  value: PropertyValue
): [Name, PropertyAccessor, Type, PropertyValue] => {
  return [property, accessor, type, value];
};

const propertiesTable = [
  row("bold", accessByPath("style.bold"), "boolean", undefined),
  row("underline", accessByPath("style.underline"), "boolean", undefined),
  row("blink", accessByPath("style.blink"), "boolean", undefined),
  row("inverse", accessByPath("style.inverse"), "boolean", undefined),
  row("invisible", accessByPath("style.invisible"), "boolean", undefined),
  row("transparent", accessByPath("style.transparent"), "boolean", undefined),
  row("color", accessByPath("style.fg"), "color", undefined),

  row("background-fill", accessByPath("ch"), "char", " "),
  row("background-color", accessByPath("style.bg"), "color", undefined),

  row("border-background", accessByPath("style.border.bg"), "color", null),
  row("border-color", accessByPath("style.border.fg"), "color", null),
  row("border-fill", accessByPath("border.ch"), "char", null),
  row("border-top", accessByPath("border.top"), "boolean", null),
  row("border-right", accessByPath("border.right"), "boolean", null),
  row("border-bottom", accessByPath("border.bottom"), "boolean", null),
  row("border-left", accessByPath("border.left"), "boolean", null),

  row("padding-top", accessByPath("padding.top"), "number", 0),
  row("padding-right", accessByPath("padding.right"), "number", 0),
  row("padding-bottom", accessByPath("padding.bottom"), "number", 0),
  row("padding-left", accessByPath("padding.left"), "number", 0),

  row("width", accessByPath("position.width"), "dimension", undefined),
  row("height", accessByPath("position.height"), "dimension", undefined),
  row("top", accessByPath("position.top"), "position", undefined),
  row("right", accessByPath("position.right"), "position", undefined),
  row("bottom", accessByPath("position.bottom"), "position", undefined),
  row("left", accessByPath("position.left"), "position", undefined),

  row("align", accessByPath("align"), "halign", "left"),
  row("vertical-align", accessByPath("valign"), "valign", "top"),

  row("shadow", accessByPath("shadow"), "boolean", undefined),
  row("hidden", accessByPath("hidden"), "boolean", false),
  row("shrink", accessByPath("shrink"), "boolean", undefined),
  row("draggable", accessByPath("draggable"), "boolean", null),

  row("mouseable", accessByFn("enableMouse", "clickable"), "boolean", null),
  row("keyable", accessByFn("enableKeys", "keyable"), "boolean", null)
];

const toMap = <Val extends Cols>(val: Val) => {
  type Result = Record<PropertyName, UnionFromColumn<Val>>;
  return propertiesTable.reduce<Result>(
    (acc, propertiesRow) => {
      acc[propertiesRow[0]] = propertiesRow[val];
      return acc;
    },
    {} as Result
  );
};

const propToAccessorsMap: Record<PropertyName, PropertyAccessor> = toMap(1);
const propToTypeMap: Record<PropertyName, PropertyType> = toMap(2);
const propToDefaultMap: Record<PropertyName, PropertyValue> = toMap(3);

// helpers
export const getPropertyAccessors = (
  property: PropertyName
): PropertyAccessor => {
  return propToAccessorsMap[property] || (() => () => void 0);
};

export const getPropertyType = (property: PropertyName) => {
  return propToTypeMap[property];
};

export const getPropertyDefault = (property: PropertyName) => {
  return propToDefaultMap[property];
};

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
      isDefault: true
    };
  }
);
