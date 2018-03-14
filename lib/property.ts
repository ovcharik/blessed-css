import { Declaration as CssDeclaration, Position as CssPosition } from "css";

import Weight from "./weight";

import { propertyDefaults, propertyParser } from "./utils/property-parser";
import {
  PropertyValue,
  PropertyType,
  PropertyApply,
  PropertyData,
  PropertyName,
} from "./utils/property-meta-base";

import { memoize } from "./utils/decorators";
import Selector from "./selector";

export default class Property implements PropertyData {
  @memoize()
  public static get defaults() {
    return propertyDefaults.map((x) => new Property(x));
  }

  @memoize((x) => x, true)
  public static parse(declaration: CssDeclaration): Property[] {
    const { property, value, position } = declaration;
    if (!property) {
      return [];
    }
    if (!value) {
      return [];
    }
    const start = (position && position.start) || {};
    const parsed = propertyParser(property, value, start);
    return parsed.map((x) => new Property(x));
  }

  public static extract(property: Property, selector: Selector) {
    const extracted = property.clone();
    extracted.weight = extracted.weight.sum(selector.weight);
    return extracted;
  }

  public static flatSortUniq(groups: Property[][], withDefaults = false) {
    return (
      groups
        // flatten
        .reduce((acc, x) => acc.concat(x), [])
        .concat(withDefaults ? this.defaults : [])
        // sort by weight
        .sort((a, b) => b.weight.cmp(a.weight))
        // uniq by property name
        .filter((x, i, a) => i === a.findIndex((f) => x.name === f.name))
    );
  }

  public readonly position: CssPosition;

  public readonly name: PropertyName;
  public readonly value: PropertyValue;
  public readonly type: PropertyType;
  public readonly apply: PropertyApply;

  public readonly isImportant: boolean;
  public readonly isKnown: boolean;
  public readonly isValid: boolean;
  public readonly isDefault: boolean;

  public weight: Weight;

  constructor(public readonly data: PropertyData) {
    this.position = data.position;

    this.name = data.name;
    this.type = data.type;
    this.value = data.value;
    this.apply = data.apply;

    this.isImportant = data.isImportant;
    this.isKnown = data.isKnown;
    this.isValid = data.isValid;
    this.isDefault = data.isDefault;

    this.weight = Weight.createFromProperty(this);
  }

  public clone() {
    return new Property(this.data);
  }
}
