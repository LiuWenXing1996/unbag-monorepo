import { DeepPartial } from "ts-essentials";
import _ from "lodash";
import deepFreezeStrict from "deep-freeze-strict";
import { arraify, filterNullable } from "./common";

const mergeConfig = <T, D extends DeepPartial<T>>(
  defaults: T,
  overrides: D
) => {
  const customize = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue) || _.isArray(srcValue)) {
      return filterNullable([...arraify(objValue), ...arraify(srcValue)]);
    }
  };
  return _.mergeWith({}, defaults, overrides, customize) as T;
};

export const useConfigHelper = <T>(params: {
  defaultConfig: T;
  disabledFreeze?: boolean;
  merge?: (defaults: T, overrides: DeepPartial<T>) => T;
}) => {
  const { defaultConfig, disabledFreeze, merge } = params;
  const defineConfig = (config: DeepPartial<T>) => config;
  const fillConfig = (config: DeepPartial<T>) => {
    const finalConfig = merge
      ? merge(defaultConfig, config)
      : mergeConfig(defaultConfig, config);
    if (disabledFreeze) {
      return finalConfig;
    }
    return deepFreezeStrict(finalConfig);
  };
  return {
    defineConfig,
    fillConfig,
    defaultConfig,
  };
};
