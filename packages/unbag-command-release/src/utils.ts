import { FinalUserConfig, useMessage } from "unbag";
import { ReleaseConfig } from ".";
import { DeepPartial } from "ts-essentials";
import module from "node:module";
import { $ } from "execa";

export const useGit = () => {
  const currentBranchGet = async () => {
    const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
    return stdout;
  };
  const currentBranchStatusGet = async () => {
    const { stdout } = await $`git status -s`;
    return stdout;
  };
  const gitRootPathGet = async () => {
    const { stdout } = await $`git rev-parse --show-toplevel`;
    return stdout.trim();
  };
  const stageFilesGet = async () => {
    const { stdout } = await $`git diff --cached --no-ext-diff --name-only`;
    return stdout
      .trim()
      .split("\n")
      .filter((e) => e);
  };

  return {
    currentBranchGet,
    currentBranchStatusGet,
    gitRootPathGet,
    stageFilesGet,
  };
};

export const useCreateRequire = () => {
  return module.createRequire;
};

export const useTagPrefix = async (params: {
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
}) => {
  const { finalUserConfig } = params;
  const message = useMessage({ locale: finalUserConfig.base.locale });
  const {
    commandConfig: {
      tag: { genPrefix },
    },
  } = finalUserConfig;
  const prefix = await unSafeFunctionWrapper(genPrefix)({ finalUserConfig });
  if (!prefix) {
    throw new Error(message.release.tag.undefinedGenPrefix());
  }
  return prefix;
};

export const useDefaultReleasePresetPath = () => {
  const require = useCreateRequire()(import.meta.url);
  const presetPath = require.resolve(
    "conventional-changelog-conventionalcommits"
  );
  return presetPath;
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
