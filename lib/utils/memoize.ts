const memoizeStorage = new WeakMap();

/**
 * Memoize decorator for methods and get properties of class.
 *
 * @export
 * @param {(ctx: any, ...args: any[]) => any} [resolver] The function to resolve cache key
 * @param {boolean} [useWeakMap=false] Use WeakMap for cache storage
 * @returns {MethodDecorator}
 */
export function memoize(
  resolver?: (ctx: any, ...args: any[]) => any,
  useWeakMap: boolean = false,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const property = descriptor.hasOwnProperty("get")
      ? "get"
      : descriptor.hasOwnProperty("value")
        ? "value"
        : null;
    if (!property) {
      return descriptor;
    }

    const executor = descriptor[property];
    if (typeof executor !== "function") {
      return descriptor;
    }

    if (!memoizeStorage.has(target)) {
      memoizeStorage.set(target, new Object(null));
    }
    const targetStorage = memoizeStorage.get(target);

    if (resolver && !targetStorage.hasOwnProperty(propertyKey)) {
      targetStorage[propertyKey] = useWeakMap
        ? new WeakMap()
        : new Object(null);
    }
    const propertyStorage = resolver
      ? targetStorage[propertyKey]
      : targetStorage;

    // override descriptor
    // tslint:disable-next-line:only-arrow-functions
    descriptor[property] = function(...args: any[]) {
      const context = this;
      const cacheKey = resolver ? resolver(context, ...args) : propertyKey;

      if (useWeakMap) {
        if (!propertyStorage.has(cacheKey)) {
          const result = executor.apply(context, args);
          propertyStorage.set(cacheKey, result);
        }
        return propertyStorage.get(cacheKey);
      }

      if (!propertyStorage.hasOwnProperty(cacheKey)) {
        const result = executor.apply(context, args);
        propertyStorage[cacheKey] = result;
      }
      return propertyStorage[cacheKey];
    };

    return descriptor;
  };
}
