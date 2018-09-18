import { colors } from "blessed";
import { PropertyValue, getPropertyType } from "./property-meta-base";

const types: {
  [key: string]: {
    cast: (v: string) => PropertyValue;
    test: (v: string) => boolean;
  };
} = {
  boolean: {
    cast: (v: string) => Boolean(v),
    test: (v: string) => /^(true|false)$/.test(v),
  },
  char: {
    cast: (v: string) => v,
    test: (v: string) => /^.{1}$/.test(v),
  },
  color: {
    cast: (v: string) => v,
    test: (v: string) => (colors as any).convert(v) !== 0x1ff,
  },
  dimension: {
    cast: (v: string) => (types.number.test(v) ? Number(v) : v),
    test: (v: string) => /^[-+]?\d+(%(?=[-+]|$))?([-+]?\d+)?$/.test(v),
  },
  halign: {
    cast: (v: string) => v,
    test: (v: string) => /^(left|center|right)$/.test(v),
  },
  number: {
    cast: (v: string) => Number(v),
    test: (v: string) => /^[-+]?\d+$/.test(v),
  },
  undefined: {
    cast: (v: string) => void 0,
    test: (v: string) => false,
  },
  valign: {
    cast: (v: string) => v,
    test: (v: string) => /^(top|middle|bottom)$/.test(v),
  },
};

export const testValueType = (property: string, value: string) => {
  return types[getPropertyType(property)].test(value);
};

export const castValueType = (property: string, value: string) => {
  return types[getPropertyType(property)].cast(value);
};
