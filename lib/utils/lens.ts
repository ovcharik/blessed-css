interface Item<Value> {
  [key: string]: Value | Item<Value>;
}

type Getter<Value> = (item: Item<Value>) => Value | Item<Value>;
type Setter<Value> = (item: Item<Value>, value: Value) => Value | Item<Value>;

type Modifier<Value> = (value: Value) => Value;

interface Lens<Value> {
  get: Getter<Value>;
  set: Setter<Value>;
  modify: (item: Item<Value>, func: Modifier<Value>) => Item<Value>;
  compose: (otherLens: Lens<Value>) => Lens<Value>;
}

function createLens<Value>(property: string): Lens<Value>;
function createLens<Value>(
  getter: Getter<Value>,
  setter: Setter<Value>,
): Lens<Value>;
function createLens<Value>(
  getterOrProp: Getter<Value> | string,
  setterOrEmpty?: Setter<Value>,
): Lens<Value> {
  let getter = getterOrProp as Getter<Value>;
  let setter = setterOrEmpty as Setter<Value>;

  if (typeof getterOrProp === "string") {
    getter = (item: Item<Value>): Value | Item<Value> => {
      return item[getterOrProp];
    };
    setter = (item: Item<Value>, value: Value): Value | Item<Value> => {
      return { ...item, [getterOrProp]: value };
    };
  }

  return {
    get: getter as (item: Item<Value>) => Value,
    set: setter as (item: Item<Value>, value: Value) => Item<Value>,

    modify(item: Item<Value>, func: Modifier<Value>): Item<Value> {
      const innerItem = getter(item) as Value;
      return setter(item, func(innerItem)) as Item<Value>;
    },

    compose(otherLens: Lens<Value>): Lens<Value> {
      return createLens<Value>(
        (item: Item<Value>): Value => {
          const innerItem = getter(item) as Item<Value>;
          return otherLens.get(innerItem) as Value;
        },
        (item: Item<Value>, value: Value): Item<Value> => {
          const innerItem = getter(item) as Item<Value>;
          const innerValue = otherLens.set(innerItem, value) as Value;
          return setter(item, innerValue) as Item<Value>;
        },
      );
    },
  };
}

export default function lens<T>(path: string): Lens<T> {
  return path
    .split(".")
    .map((x) => createLens<T>(x))
    .reduce<Lens<T> | null>(
      (acc, x) => (acc ? acc.compose(x) : x),
      null,
    ) as Lens<T>;
}
