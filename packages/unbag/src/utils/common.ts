import { DeepPartial } from "ts-essentials";
import { AbsolutePath, usePath } from "./path";
import { FinalUserConfig } from "@/config";
export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

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

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useRoot = (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const path = usePath();
  return new AbsolutePath({
    content: path.resolve(finalUserConfig.base.root),
  });
};

export const unSafeFunctionWrapper = <
  T extends (...args: any) => any,
  R extends ReturnType<T>,
  P extends Parameters<T>
>(
  func: T
): ((...args: P) => DeepPartial<R> | undefined) => {
  return func as (...args: P) => DeepPartial<R> | undefined;
};

export const unSafeFunctionShallowWrapper = <
  T extends (...args: any) => any,
  R extends ReturnType<T>,
  P extends Parameters<T>
>(
  func: T
): ((...args: P) => Partial<R> | undefined) => {
  return func as (...args: P) => Partial<R> | undefined;
};

export const unSafeObjectWrapper = <T extends object>(
  obj: T
): DeepPartial<T> => {
  return obj as DeepPartial<T>;
};

export const unSafeObjectShallowWrapper = <T extends object>(
  obj: T
): Partial<T> => {
  return obj as Partial<T>;
};
