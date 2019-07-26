import { Position as CssPosition } from "css";

import { getPropertyAccessors, PropertyData } from "./meta-base";
import { getPropertyType } from "./meta-base";
import { getPropertyPairs } from "./meta-compositions";
import { castValueType, testValueType } from "./meta-types";

export { propertyDefaults } from "./meta-base";

export const propertyParser = (
  property: string,
  value: string,
  position: CssPosition
): PropertyData[] => {
  const [, val, important] = value
    .trim()
    .replace(/['"]/g, "")
    .match(/^(.*?)\s*(\!important)?$/) as RegExpMatchArray;

  return getPropertyPairs(property, val)
    .filter(Boolean)
    .map(([p, v]) => {
      const accessors = getPropertyAccessors(p);

      return {
        position,

        name: p,
        value: castValueType(p, v),
        type: getPropertyType(p),

        get: accessors(true),
        set: accessors(false),

        isImportant: Boolean(important),
        isKnown: Boolean(getPropertyType(p)),
        isValid: testValueType(p, v),
        isDefault: false
      };
    });
};