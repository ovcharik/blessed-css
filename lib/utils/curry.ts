type Curry1<P1, R> = (p1: P1) => R;

interface Curry2<P1, P2, R> {
  (p1: P1): Curry1<P2, R>;
  (p1: P1, p2: P2): R;
}

interface Curry3<P1, P2, P3, R> {
  (p1: P1): Curry2<P2, P3, R>;
  (p1: P1, p2: P2): Curry1<P3, R>;
  (p1: P1, p2: P2, p3: P3): R;
}

interface Curry4<P1, P2, P3, P4, R> {
  (p1: P1): Curry3<P2, P3, P4, R>;
  (p1: P1, p2: P2): Curry2<P3, P4, R>;
  (p1: P1, p2: P2, p3: P3): Curry1<P4, R>;
  (p1: P1, p2: P2, p3: P3, p4: P4): R;
}

type Curry<T, R> = T extends [any, any, any, any]
  ? Curry4<T[0], T[1], T[2], T[3], R>
  : T extends [any, any, any]
  ? Curry3<T[0], T[1], T[2], R>
  : T extends [any, any]
  ? Curry2<T[0], T[1], R>
  : T extends [any]
  ? Curry1<T[0], R>
  : unknown;

function curry<T extends any[], R>(fn: (...args: T) => R): Curry<T, R>;
function curry<T extends any[], R>(
  fn: (...args: T) => R,
  ...head: T
): Curry<T, R> {
  const wrap = (...acc: any[]) =>
    acc.length >= fn.length
      ? fn(...(acc as T))
      : (...tail: any[]) => wrap(...acc, ...tail);
  return wrap(...head) as Curry<T, R>;
}

export default curry;
