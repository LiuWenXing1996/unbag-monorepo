import { Locale } from "@/utils/common";
import {
  mergeConfig,
  resolveUserConfig,
  useDefaultConfig,
  UserConfig,
  UserConfigOptional,
} from "@/utils/config";
import { AbsolutePath, usePath } from "@/utils/path";

export const resolveUserConfigFromCli = async (params: {
  cliOptions: {
    config?: string;
    root?: string;
    locale?: Locale;
  };
  overrides?: UserConfigOptional;
}): Promise<UserConfigOptional | undefined> => {
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
  return mergedConfig;
};
