export type MaybePromise<T> = T | Promise<T>;
export type DeepPartial<T> = T extends (...args: any) => any
  ? T
  : { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepReadonly<T> = T extends (...args: any) => any
  ? T
  : T extends { __TAG__: true }
  ? T
  : { readonly [P in keyof T]: DeepReadonly<T[P]> } & { __TAG__: true };

// export type DeepReadonly<T> = T extends (infer R)[]
//   ? DeepReadonlyArray<R>
//   : T extends Function
//   ? T
//   : T extends object
//   ? DeepReadonlyObject<T>
//   : T;

// interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

// type DeepReadonlyObject<T> = {
//   readonly [P in keyof T]: DeepReadonly<T[P]>;
// };
