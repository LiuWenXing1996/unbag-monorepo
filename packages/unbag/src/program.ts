import _ from "lodash";
import { hideBin } from "yargs/helpers";
import { Parser, ParserCommand, ParserOption } from "./parser";
import {
  freezeConfig,
  mergeConfig,
  useDefaultUserConfigBase,
  UserConfig,
  UserConfigFunc,
} from "@/config";
import { AbsolutePath, usePath } from "./utils/path";
import {
  Command,
  CommandExistedOptions,
  CommandFactory,
  CommandHelper,
  subCommandToParserCommand,
  validateCommands,
} from "./command";
import { mapValues } from "radash";
import { bundleRequire } from "bundle-require";
import { useFs } from "./utils/fs";
import { initI18n } from "./i18n";
import i18next from "i18next";

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

  get locale(): string {
    return i18next.language;
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

  async localeDetect(): Promise<string | undefined> {
    const parser = new Parser({
      options: {
        [this.modeOption.key]: this.modeOption.options,
      },
    });
    const localeDetected = parser.localeDetect();
    return localeDetected;
  }

  getParserOptions() {
    return {
      [this.rootOption.key]: this.rootOption.options,
      [this.localeOption.key]: this.localeOption.options,
      [this.userConfigFilePathOption.key]:
        this.userConfigFilePathOption.options,
      [this.modeOption.key]: this.modeOption.options,
    };
  }
  async loadUserConfigFromFile(params: {
    filePath: AbsolutePath;
  }): Promise<UserConfig | UserConfigFunc | undefined> {
    const { filePath } = params;
    const { mod } = await bundleRequire({
      filepath: filePath.content,
      format: "esm",
    });

    let result = mod.default || mod;
    return result;
  }
  async lookupUserConfigFilePath(params: {
    root: AbsolutePath;
    configFilePath?: string;
  }): Promise<AbsolutePath | undefined> {
    const { root, configFilePath } = params;
    const path = usePath();
    const fs = useFs();
    if (configFilePath) {
      const absoluteFilePath = new AbsolutePath({
        content: path.resolve(root.content, configFilePath),
      });
      const isExit = await fs.pathExists(absoluteFilePath.content);
      if (!isExit) {
        throw new Error(
          i18next.t("config.file.notFound", {
            fileName: absoluteFilePath.content,
          })
        );
      }
      return absoluteFilePath;
    } else {
      const configFileDefaultList = [
        "unbag.config.ts",
        "unbag.config.js",
        "unbag.config.cjs",
        "unbag.config.mjs",
      ];
      for (const filePath of configFileDefaultList) {
        const absoluteFilePath = new AbsolutePath({
          content: path.resolve(root.content, filePath),
        });
        const isExit = await fs.pathExists(absoluteFilePath.content);
        if (!isExit) {
          break;
        }
        return absoluteFilePath;
      }
    }
  }

  async parse() {
    const defaultUserConfigBase = useDefaultUserConfigBase();
    await initI18n(defaultUserConfigBase.locale);
    const path = usePath();
    const localeFromCli = await this.parseLocale();
    const localeDetected = await this.localeDetect();
    const locale =
      localeFromCli || localeDetected || defaultUserConfigBase.locale;

    await i18next.changeLanguage(locale);

    const rootFormCli = await this.parseRoot();
    const root = rootFormCli || defaultUserConfigBase.root;

    const mode = await this.parseMode();

    const userConfigFilePath = await this.parseUserConfigFilePath();
    const absoluteRoot = new AbsolutePath({
      content: path.resolve(root),
    });
    const userConfigFileAbsolutePath = await this.lookupUserConfigFilePath({
      root: absoluteRoot,
      configFilePath: userConfigFilePath,
    });

    const userConfigMaybeFuncFromCli = userConfigFileAbsolutePath
      ? await this.loadUserConfigFromFile({
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

    await i18next.changeLanguage(mergedUserConfigBase.locale);

    const parser = new Parser({
      scriptName: this.name,
      options: this.getParserOptions(),
    });

    const programOptionsExisted: CommandExistedOptions = {
      ...mapValues(this.getParserOptions(), (option, optionName) => {
        return {
          option,
          optionName,
          commandPath: [],
        };
      }),
      version: {
        optionName: "version",
        option: {
          alias: "v",
        },
        commandPath: [],
      },
      help: {
        optionName: "help",
        option: {
          alias: "h",
        },
        commandPath: [],
      },
    };
    const commandList: {
      command: Command;
      commandFactory: CommandFactory;
    }[] = [];
    for (const commandFactory of userConfigFromCli?.commands || []) {
      if (commandFactory) {
        const { command: commandMaybeFunc, config: configMaybeFunc } =
          commandFactory;
        const command = _.isFunction(commandMaybeFunc)
          ? await commandMaybeFunc()
          : commandMaybeFunc;
        commandList.push({ command, commandFactory });
      }
    }
    const parserCommandList: ParserCommand[] = [];
    validateCommands({
      commands: commandList.map((e) => e.command),
      commandPath: [],
    });
    for (const { command, commandFactory } of commandList) {
      const { config: configMaybeFunc } = commandFactory;
      const parserCommand = subCommandToParserCommand({
        command,
        commandPath: [],
        program: this,
        optionsExisted: {
          ...programOptionsExisted,
        },
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
      parserCommandList.push(parserCommand);
    }

    for (const command of parserCommandList) {
      parser.addCommand(command);
    }

    parser.enableHelp();
    parser.enableVersion(this.version);

    await parser.parse(this.args);
  }
}
