import { DeepPartial } from "ts-essentials";
import { AbsolutePath, usePath } from "./path";
import { FinalUserConfig } from "@/core/user-config";
export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}
export enum Locale {
  "zh_cn" = "zh_cn",
}
export const filterNullable = <T>(
  list: T[],
  isNullable?: (value: T) => boolean
): NonNullable<T>[] => {
  return list.filter((e) => {
    if (isNullable) {
      return isNullable(e);
    }
    return !!e;
  }) as NonNullable<T>[];
};
export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}
export type Result<S, E = S> =
  | {
      success: true;
      content: S;
      message?: string;
    }
  | {
      success: false;
      content?: E;
      message: string;
    };
export type SafeObj<T> = {
  [k in keyof T as `$${string & k}`]-?: () => T[k] extends object
    ? SafeObj<T[k]>
    : NonNullable<T[k]>;
};
export const safeObj = <T extends object>(
  obj: T,
  name: string,
  config: {
    errorMsgFormat?: (objName: string, key: string) => string;
  } = {}
) => {
  const errorMsgFormat =
    config.errorMsgFormat ||
    ((objName: string, key: string) => {
      return `${objName} [${key}] undefined or null`;
    });
  const objName = name;
  const p = new Proxy({} as SafeObj<T>, {
    get(_target, property, _receiver) {
      return () => {
        if (typeof property !== "string") {
          throw new Error(`safely ${objName} property type must string`);
        }
        const key = property.slice(1);
        const value = obj[key];
        if (value === undefined || value === null) {
          throw new Error(errorMsgFormat(objName, key));
        }
        if (typeof value === "object") {
          return safeObj(value, `${objName}.${key}`, config);
        }
        return value;
      };
    },
  });
  return p;
};
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

export const unSafeObjectWrapper = <T extends object>(
  obj: T
): DeepPartial<T> => {
  return obj as DeepPartial<T>;
};
