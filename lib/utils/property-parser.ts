import { Position as CssPosition } from "css";

import { PropertyData, getPropertyAccessors } from "./property-meta-base";
import { getPropertyType } from "./property-meta-base";
import { getPropertyPairs } from "./property-meta-compositions";
import { castValueType, testValueType } from "./property-meta-types";

export { propertyDefaults } from "./property-meta-base";

export const propertyParser = (
  property: string,
  value: string,
  position: CssPosition,
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
        isDefault: false,
      };
    });
};
