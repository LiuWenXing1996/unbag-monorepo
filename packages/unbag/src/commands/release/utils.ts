import { FinalUserConfig } from "@/core/user-config";
import { unSafeFunctionWrapper } from "@/utils/common";
import { useMessage } from "@/utils/message";
import { createRequire } from "node:module";
import { ReleaseConfig } from ".";
// export const resolvePresetPath = (
//   preset: string = "conventional-changelog-conventionalcommits"
// ) => {
//   const presetPath = require.resolve(preset);
//   return presetPath;
// };

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
  const require = createRequire(import.meta.url);
  const presetPath = require.resolve(
    "conventional-changelog-conventionalcommits"
  );
  return presetPath;
};
