interface Nested<T, EndType = never> {
  [x: string]: T | Nested<T, EndType> | EndType | undefined;
}

type Getter<T, EndType = never> = (
  hash: Nested<T, EndType>
) => T | Nested<T, EndType> | EndType | undefined;

type Setter<T, EndType = never> = (
  hash: Nested<T, EndType>,
  value: T | Nested<T, EndType> | EndType
) => Nested<T, EndType>;

type Modifier<T, EndType = never> = (value: T) => T | EndType;

interface Lens<T, EndType = never> {
  get: Getter<T, EndType>;
  set: Setter<T, EndType>;
  modify: (
    hash: Nested<T, EndType>,
    func: Modifier<T, EndType>
  ) => Nested<T, EndType> | EndType;
  compose: (nested: Lens<T, EndType>, fill?: boolean) => Lens<T, EndType>;
}

export function createLens<T, EndType = never>(
  property: string,
  defaultValue?: T
): Lens<T, EndType>;
export function createLens<T, EndType = never>(
  getter: Getter<T, EndType>,
  setter: Setter<T, EndType>
): Lens<T, EndType>;
export function createLens<T, EndType = never>(
  getterOrProperty: string | Getter<T, EndType>,
  setterOrDefault?: ReturnType<Getter<T, EndType>> | Setter<T, EndType>
): Lens<T, EndType> {
  let getter = getterOrProperty as Getter<T, EndType>;
  let setter = setterOrDefault as Setter<T, EndType>;

  if (typeof getterOrProperty === "string") {
    getter = hash => {
      return hash.hasOwnProperty(getterOrProperty)
        ? hash[getterOrProperty]
        : (setterOrDefault as ReturnType<Getter<T, EndType>>);
    };
    setter = (hash, value) => {
      return getter(hash) === value
        ? hash
        : { ...hash, [getterOrProperty]: value };
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
      return createLens<T, EndType>(
        hash => {
          const nestedHash =
            (getter(hash) as Nested<T, EndType>) || (fill && {});
          return nested.get(nestedHash);
        },
        (hash, value) => {
          const nestedHash =
            (getter(hash) as Nested<T, EndType>) || (fill && {});
          const updatedHash = nested.set(nestedHash, value);
          return setter(hash, updatedHash);
        }
      );
    }
  };
}

export function createLensByPath<T, EndType = never>(
  path: string,
  fill: boolean = true
): Lens<T, EndType> {
  return path
    .split(".")
    .map(part => createLens<T, EndType>(part))
    .reduce<Lens<T, EndType> | undefined>((acc, part) => {
      return acc
        ? acc.compose(
            part,
            fill
          )
        : part;
    }, void 0) as Lens<T, EndType>;
}
