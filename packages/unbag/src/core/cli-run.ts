import { Locale } from "@/utils/common";
import { AbsolutePath, usePath } from "@/utils/path";
import { mergeConfig, useDefaultUserConfigBase } from "./user-config";
import {
  addCliCommand,
  addCliOption,
  createProgram,
  loadUserConfigFromFile,
  LocaleCliOption,
  localeDetect,
  lookupUserConfigFilePath,
  parseLocaleFromCli,
  parseRootFromCli,
  parseUserConfigFilePathFromCli,
  RootCliOption,
  UserConfigFilePathCliOption,
} from "./cli";

export const cliRun = async () => {
  const defaultUserConfigBase = useDefaultUserConfigBase();
  const path = usePath();

  const localeFromCli = await parseLocaleFromCli();
  const localeDetected = localeDetect();
  const locale = (localeFromCli ||
    localeDetected ||
    defaultUserConfigBase.locale) as Locale;

  const rootFormCli = await parseRootFromCli();
  const root = rootFormCli || defaultUserConfigBase.root;

  const userConfigFilePath = await parseUserConfigFilePathFromCli();
  const absoluteRoot = new AbsolutePath({
    content: path.resolve(root),
  });
  const userConfigFileAbsolutePath = await lookupUserConfigFilePath({
    root: absoluteRoot,
    configFilePath: userConfigFilePath,
    locale,
  });
  const userConfigFromCli = userConfigFileAbsolutePath
    ? await loadUserConfigFromFile({
        filePath: userConfigFileAbsolutePath,
      })
    : undefined;

  const mergedUserConfigBase = mergeConfig({
    defaultValue: defaultUserConfigBase,
    overrides: [userConfigFromCli?.base],
  });
  const program = createProgram();

  addCliOption({ program, option: LocaleCliOption });
  addCliOption({ program, option: RootCliOption });
  addCliOption({ program, option: UserConfigFilePathCliOption });

  for (const cliCommandFactory of userConfigFromCli?.commands || []) {
    await addCliCommand({
      program: program,
      cliCommandFactory,
      userConfigBase: mergedUserConfigBase,
    });
  }

  await program.help().version().parse();
};
