import { arraify, filterNullable, Locale } from "@/utils/common";
import { LogConfig, LogConfigDefault } from "@/utils/log";
import deepFreezeStrict from "deep-freeze-strict";
import _ from "lodash";
import { DeepPartial, DeepReadonly } from "ts-essentials";
import { CliCommandFactory } from "./cli";

export interface UserConfigBase {
  root: string;
  locale: Locale;
  tempDir: string;
  log: LogConfig;
  catch: (error: any) => void;
}

export type UserConfig = {
  base?: DeepPartial<UserConfigBase>;
  commands?: CliCommandFactory<unknown>[];
};

export type FinalUserConfig<C = unknown> = DeepReadonly<{
  base: UserConfigBase;
  commandConfig: C;
}>;

export const defineUserConfig = (config: UserConfig): UserConfig => config;

export const useDefaultUserConfigBase = (): UserConfigBase => {
  const defaultConfig: UserConfigBase = {
    root: process.cwd(),
    locale: Locale.zh_cn,
    tempDir: "./node_modules/.unbag",
    log: LogConfigDefault,
    catch: () => {},
  };
  return defaultConfig;
};

export const freezeConfig = <T>(config: T): DeepReadonly<T> => {
  return deepFreezeStrict(config) as DeepReadonly<T>;
};

export const mergeConfig = <
  T,
  D extends DeepPartial<T> | undefined | null | void | Awaited<DeepPartial<T>>
>(params: {
  defaultValue: T;
  overrides: D[];
  customize?: (objValue: any, srcValue: any) => any;
}) => {
  const { defaultValue, overrides, customize } = params;
  const customizeDefault = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue) || _.isArray(srcValue)) {
      return filterNullable([...arraify(objValue), ...arraify(srcValue)]);
    }
  };
  const customizeFinal = customize || customizeDefault;
  return _.mergeWith({}, defaultValue, ...overrides, customizeFinal) as T;
};
