import { Locale } from "@/utils/common";
import { AbsolutePath, usePath } from "@/utils/path";
import { mergeConfig, useDefaultUserConfigBase } from "./user-config";
import { TransformCommand } from "@/commands/transform";
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
  useCliCommand,
  UserConfigFilePathCliOption,
} from "./cli";
import { ReleaseCommand } from "@/commands/release";
import { CommitCommand } from "@/commands/commit";
import { ParallelCliCommand } from "@/commands/parallel";
import { ViteCliCommand } from "@/commands/vite";

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

  await addCliCommand({
    program,
    userConfigBase: mergedUserConfigBase,
    cliCommandFactory: useCliCommand(
      TransformCommand,
      userConfigFromCli?.transform
    ),
  });
  await addCliCommand({
    program,
    userConfigBase: mergedUserConfigBase,
    cliCommandFactory: useCliCommand(ViteCliCommand, userConfigFromCli?.vite),
  });
  await addCliCommand({
    program,
    userConfigBase: mergedUserConfigBase,
    cliCommandFactory: useCliCommand(
      ReleaseCommand,
      userConfigFromCli?.release
    ),
  });
  await addCliCommand({
    program,
    userConfigBase: mergedUserConfigBase,
    cliCommandFactory: useCliCommand(CommitCommand, userConfigFromCli?.commit),
  });
  await addCliCommand({
    program,
    userConfigBase: mergedUserConfigBase,
    cliCommandFactory: useCliCommand(
      ParallelCliCommand,
      userConfigFromCli?.parallel
    ),
  });

  program.command(
    "custom",
    "执行自定命令",
    async (yargs) => {
      for (const cliCommandFactory of userConfigFromCli?.custom || []) {
        await addCliCommand({
          program: yargs,
          cliCommandFactory,
          userConfigBase: mergedUserConfigBase,
        });
      }
      return yargs;
    },
    () => void 0
  );

  await program.help().version().parse();
};
