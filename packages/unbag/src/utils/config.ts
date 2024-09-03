import { ParallelConfig, ParallelDefaultConfig } from "../commands/parallel";
import { TransformConfig, TransformConfigDefault } from "../commands/transform";
import { useFs } from "./fs";
import { AbsolutePath, usePath } from "../utils/path";
import { bundleRequire } from "bundle-require";
import { ReleaseConfig, releaseDefaultConfig } from "../commands/release";
import { arraify, filterNullable, isObject, Locale, safeObj } from "./common";
import { useMessage } from "./message";
import { DeepPartial } from "./types";
import { LogConfig, LogConfigDefault } from "./log";
import deepFreezeStrict from "deep-freeze-strict";
import { DeepReadonly } from "ts-essentials";
import _ from "lodash";
import { CommitConfig, CommitConfigDefault } from "@/commands/commit/config";
export type UserConfig = {
  root: string;
  locale: Locale;
  configFileResolvedPath?: string;
  tempDir: string;
  log: LogConfig;
  transform: TransformConfig;
  parallel: ParallelConfig;
  release: ReleaseConfig;
  commit: CommitConfig;
};
export type FinalUserConfig = DeepReadonly<UserConfig>;
export type UserConfigOptional = DeepPartial<
  Omit<UserConfig, "configFileResolvedPath">
>;
export const useDefaultConfig = () => {
  const defaultConfig: UserConfig = {
    root: process.cwd(),
    locale: Locale.zh_cn,
    tempDir: "./node_modules/.unbag",
    log: LogConfigDefault,
    transform: TransformConfigDefault,
    parallel: ParallelDefaultConfig,
    release: releaseDefaultConfig,
    commit: CommitConfigDefault,
  };
  return defaultConfig;
};
export const defineUserConfig = (
  config: UserConfigOptional
): UserConfigOptional => config;
export const resolveUserConfig = async (options: {
  root: AbsolutePath;
  filePath?: string;
  locale: Locale;
}): Promise<
  | (UserConfigOptional & {
      configFileResolvedPath: string;
    })
  | undefined
> => {
  const { filePath, root, locale } = options;
  const fs = useFs();
  const path = usePath();
  const message = useMessage({
    locale,
  });
  if (filePath) {
    const absoluteFilePath = path.resolve(root.content, filePath);
    const isExit = await fs.pathExists(absoluteFilePath);
    if (!isExit) {
      throw new Error(message.config.file.notFound(absoluteFilePath));
    }
    return await loadUserConfigFromFile(
      new AbsolutePath({
        content: absoluteFilePath,
      })
    );
  } else {
    const configFileDefaultList = [
      "unbag.config.ts",
      "unbag.config.js",
      "unbag.config.cjs",
      "unbag.config.mjs",
    ];
    for (const filePath of configFileDefaultList) {
      const absoluteFilePath = path.resolve(root.content, filePath);
      const isExit = await fs.pathExists(absoluteFilePath);
      if (!isExit) {
        break;
      }
      return await loadUserConfigFromFile(
        new AbsolutePath({
          content: absoluteFilePath,
        })
      );
    }
  }
};
export async function loadUserConfigFromFile(
  absoluteFilePath: AbsolutePath
): Promise<
  | (UserConfigOptional & {
      configFileResolvedPath: string;
    })
  | undefined
> {
  const { mod } = await bundleRequire({
    filepath: absoluteFilePath.content,
    format: "esm",
  });
  const config = mod.default || mod;
  config.configFileResolvedPath = absoluteFilePath;
  return config;
}
export const mergeDefaultConfig = (userConfig?: UserConfigOptional) => {
  const defaultConfig = useDefaultConfig();
  return mergeConfig(defaultConfig, userConfig || {});
};
export const mergeConfig = <T, D extends DeepPartial<T>>(
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
export const deepFreezeConfig = (userConfig: UserConfig): FinalUserConfig => {
  return deepFreezeStrict(userConfig);
};
