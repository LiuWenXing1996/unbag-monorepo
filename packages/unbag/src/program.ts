import _ from "lodash";
import { hideBin } from "yargs/helpers";
import { Parser, ParserCommand, ParserOption } from "./parser";
import {
  freezeConfig,
  mergeConfig,
  useDefaultUserConfigBase,
} from "./core/user-config";
import {
  parseLocaleFromCli,
  localeDetect,
  parseRootFromCli,
  parseUserConfigFilePathFromCli,
  lookupUserConfigFilePath,
  loadUserConfigFromFile,
} from "./core/cli";
import { filterNullable, Locale } from "./utils/common";
import { AbsolutePath, usePath } from "./utils/path";
import { CommandHelper, subCommandToParserCommand } from "./command";

export class Program {
  constructor(params: {
    processArgs: string[];
    disableAutoHideBin?: boolean;
    version: string;
    name: string;
  }) {
    this.disableAutoHideBin = params.disableAutoHideBin;
    this.processArgs = params.processArgs;
    this.version = params.version;
    this.name = params.name;
  }

  name: string;

  disableAutoHideBin?: boolean;

  processArgs: string[];

  version: string;

  localeOption = {
    key: "locale",
    options: {
      description: "本地化语言",
      alias: "l",
      type: "string",
    },
  } as const satisfies ParserOption;

  modeOption = {
    key: "mode",
    options: {
      description: "指定模式",
      alias: "m",
      type: "string",
    },
  } as const satisfies ParserOption;

  rootOption = {
    key: "root",
    options: {
      description: "根路径",
      alias: "r",
      type: "string",
    },
  } as const satisfies ParserOption;

  userConfigFilePathOption = {
    key: "config",
    options: {
      description: "用户配置文件路径",
      alias: "c",
      type: "string",
    },
  } as const satisfies ParserOption;

  get args(): string[] {
    let args: string[] = [];
    if (this.disableAutoHideBin) {
      args = this.processArgs;
    } else {
      args = hideBin(this.processArgs);
    }
    return _.cloneDeep(args);
  }

  async parseLocale(): Promise<string | undefined> {
    const parser = new Parser({
      options: {
        [this.localeOption.key]: this.localeOption.options,
      },
    });
    return (await parser.parse(this.args)).locale;
  }

  async parseUserConfigFilePath(): Promise<string | undefined> {
    const parser = new Parser({
      options: {
        [this.userConfigFilePathOption.key]:
          this.userConfigFilePathOption.options,
      },
    });
    return (await parser.parse(this.args)).config;
  }

  async parseRoot(): Promise<string | undefined> {
    const parser = new Parser({
      options: {
        [this.rootOption.key]: this.rootOption.options,
      },
    });
    return (await parser.parse(this.args)).root;
  }

  async parseMode(): Promise<string | undefined> {
    const parser = new Parser({
      options: {
        [this.modeOption.key]: this.modeOption.options,
      },
    });
    return (await parser.parse(this.args)).mode;
  }

  async parse() {
    const defaultUserConfigBase = useDefaultUserConfigBase();
    const path = usePath();
    const localeFromCli = await this.parseLocale();
    const localeDetected = localeDetect();
    const locale = (localeFromCli ||
      localeDetected ||
      defaultUserConfigBase.locale) as Locale;

    const rootFormCli = await this.parseRoot();
    const root = rootFormCli || defaultUserConfigBase.root;

    const mode = await this.parseMode();

    const userConfigFilePath = await this.parseUserConfigFilePath();
    const absoluteRoot = new AbsolutePath({
      content: path.resolve(root),
    });
    const userConfigFileAbsolutePath = await lookupUserConfigFilePath({
      root: absoluteRoot,
      configFilePath: userConfigFilePath,
      locale,
    });

    const userConfigMaybeFuncFromCli = userConfigFileAbsolutePath
      ? await loadUserConfigFromFile({
          filePath: userConfigFileAbsolutePath,
        })
      : undefined;

    const userConfigFromCli = _.isFunction(userConfigMaybeFuncFromCli)
      ? await userConfigMaybeFuncFromCli({ mode })
      : userConfigMaybeFuncFromCli;

    const mergedUserConfigBase = mergeConfig({
      defaultValue: defaultUserConfigBase,
      overrides: [userConfigFromCli?.base],
    });

    const parser = new Parser({
      scriptName: this.name,
      options: {
        [this.rootOption.key]: this.rootOption.options,
        [this.localeOption.key]: this.localeOption.options,
        [this.userConfigFilePathOption.key]:
          this.userConfigFilePathOption.options,
        [this.modeOption.key]: this.modeOption.options,
      },
    });

    const commands = await Promise.all([
      ...filterNullable(userConfigFromCli?.commands || []).map(
        async (commandFactory) => {
          const { command: commandMaybeFunc, config: configMaybeFunc } =
            commandFactory;
          const command = _.isFunction(commandMaybeFunc)
            ? await commandMaybeFunc()
            : commandMaybeFunc;
          return subCommandToParserCommand({
            command,
            wrapRun: ({ value, commandPath, parserCommand }) => {
              const wrapperRun: ParserCommand["run"] = async (...rest) => {
                const { userConfigBaseParse, configParse } = command;
                const [args] = rest;
                const defaultConfig = _.isFunction(command.defaultConfig)
                  ? await command.defaultConfig()
                  : command.defaultConfig;
                const userConfigBaseFromArgs = await userConfigBaseParse?.({
                  args,
                });
                const userConfigCommandFromArgs = await configParse?.({
                  args,
                });
                const userConfigBaseMerged = mergeConfig({
                  defaultValue: mergedUserConfigBase,
                  overrides: [userConfigBaseFromArgs],
                });
                const config = _.isFunction(configMaybeFunc)
                  ? await configMaybeFunc()
                  : configMaybeFunc;
                const userConfigCommandMerged = mergeConfig({
                  defaultValue: defaultConfig,
                  overrides: [config, userConfigCommandFromArgs],
                });
                const finalUserConfig = freezeConfig({
                  base: userConfigBaseMerged,
                  commandConfig: userConfigCommandMerged,
                });
                await value({
                  args,
                  finalUserConfig,
                  helper: new CommandHelper({
                    program: this,
                    finalUserConfig,
                    commandPath,
                    command,
                    parserCommand,
                  }),
                });
              };
              return wrapperRun;
            },
          });
        }
      ),
    ]);

    for (const command of commands) {
      parser.addCommand(command);
    }

    parser.enableHelp();
    parser.enableVersion(this.version);

    await parser.parse(this.args);
  }
}
