import { arraify, filterNullable, Locale } from "@/utils/common";
import {
  FinalUserConfig,
  mergeConfig,
  resolveUserConfig,
  useDefaultConfig,
  UserConfig,
  UserConfigOptional,
} from "@/utils/config";
import { AbsolutePath, usePath } from "@/utils/path";
import deepFreezeStrict from "deep-freeze-strict";
import _ from "lodash";

export const resolveUserConfigFromCli = async (params: {
  cliOptions: {
    config?: string;
    root?: string;
    locale?: Locale;
  };
  overrides?: UserConfigOptional;
}): Promise<UserConfigOptional> => {
  const { overrides, cliOptions } = params;
  const { config, root, locale } = cliOptions;
  const path = usePath();
  const defaultConfig = useDefaultConfig();
  const absoluteRoot = new AbsolutePath({
    content: path.resolve(root || defaultConfig.root),
  });
  const userConfig = await resolveUserConfig({
    root: absoluteRoot,
    filePath: config,
    locale: locale || defaultConfig.locale,
  });
  let mergedConfig = mergeConfig(userConfig, {
    root: absoluteRoot.content,
  });
  mergedConfig = mergeConfig(mergedConfig, {
    ...overrides,
  });
  return mergedConfig || {};
};

export const mergeUserConfig = (params: {
  defaultValue: UserConfig;
  list: (UserConfigOptional | undefined)[];
}): UserConfig => {
  const { defaultValue, list } = params;
  const customize = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue) || _.isArray(srcValue)) {
      return filterNullable([...arraify(objValue), ...arraify(srcValue)]);
    }
  };
  const result = _.mergeWith({}, defaultValue, ...list, customize);
  return result;
};

export const freezeUserConfig = (userConfig: UserConfig): FinalUserConfig => {
  return deepFreezeStrict(userConfig);
};
