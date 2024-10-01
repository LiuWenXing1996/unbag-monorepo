import { DeepPartial } from "ts-essentials";

export const filterNullable = <T>(
  list: T[],
  isNullable?: (value: T) => boolean
): NonNullable<T>[] => {
  return list.filter((e) => {
    if (isNullable) {
      return !isNullable(e);
    }
    return !!e;
  }) as NonNullable<T>[];
};
export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}

export const unSafeFunctionWrapper = <
  T extends (...args: any) => any,
  R extends ReturnType<T>,
  P extends Parameters<T>
>(
  func: T
): ((...args: P) => DeepPartial<R> | undefined) => {
  return func as (...args: P) => DeepPartial<R> | undefined;
};

export const unSafeObjectWrapper = <T extends object>(
  obj: T
): DeepPartial<T> => {
  return obj as DeepPartial<T>;
};
