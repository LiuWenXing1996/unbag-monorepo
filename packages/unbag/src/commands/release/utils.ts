import { unSafeFunctionWrapper } from "@/utils/common";
import { FinalUserConfig } from "@/utils/config";
import { useMessage } from "@/utils/message";
import { createRequire } from "node:module";
// export const resolvePresetPath = (
//   preset: string = "conventional-changelog-conventionalcommits"
// ) => {
//   const presetPath = require.resolve(preset);
//   return presetPath;
// };

export const useTagPrefix = async (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  const message = useMessage({ locale: finalUserConfig.locale });
  const {
    release: {
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

