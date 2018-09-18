interface Nested<T> {
  [x: string]: T | Nested<T>;
}

type Getter<T> = (hash: Nested<T>) => T | Nested<T>;
type Setter<T> = (hash: Nested<T>, value: T | Nested<T>) => Nested<T>;

type Modifier<T> = (value: T) => T;

interface Lens<T> {
  get: Getter<T>;
  set: Setter<T>;
  modify: (hash: Nested<T>, func: Modifier<T>) => Nested<T>;
  compose: (nested: Lens<T>, fill?: boolean) => Lens<T>;
}

export function createLens<T>(property: string, defaultValue?: T): Lens<T>;
export function createLens<T>(getter: Getter<T>, setter: Setter<T>): Lens<T>;
export function createLens<T>(
  getterOrProperty: string | Getter<T>,
  setterOrDefault?: ReturnType<Getter<T>> | Setter<T>,
): Lens<T> {
  let getter = getterOrProperty as Getter<T>;
  let setter = setterOrDefault as Setter<T>;

  if (typeof getterOrProperty === "string") {
    getter = (hash) => {
      return hash.hasOwnProperty(getterOrProperty)
        ? hash[getterOrProperty]
        : (setterOrDefault as ReturnType<Getter<T>>);
    };
    setter = (hash, value) => {
      return getter(hash) === value
        ? hash
        : ({ ...hash, [getterOrProperty]: value } as ReturnType<Setter<T>>);
    };
  }

  return {
    get: getter,
    set: setter,

    modify(hash, func) {
      const value = getter(hash) as T;
      return setter(hash, func(value));
    },

    compose(nested, fill?) {
      return createLens<T>(
        (hash) => {
          const nestedHash = (getter(hash) as Nested<T>) || (fill && {});
          return nested.get(nestedHash);
        },
        (hash, value) => {
          const nestedHash = (getter(hash) as Nested<T>) || (fill && {});
          const updatedHash = nested.set(nestedHash, value);
          return setter(hash, updatedHash);
        },
      );
    },
  };
}

export function createLensByPath<T>(
  path: string,
  fill: boolean = true,
): Lens<T> {
  return path
    .split(".")
    .map((part) => createLens<T>(part))
    .reduce<Lens<T> | null>((acc, part) => {
      return acc
        ? acc.compose(
            part,
            fill,
          )
        : part;
    }, null) as Lens<T>;
}
