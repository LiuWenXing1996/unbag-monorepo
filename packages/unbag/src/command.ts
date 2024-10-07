import { Options, type InferredOptionTypes } from "yargs";
import { ParserCommand, ParserOptions } from "./parser";
import { DeepPartial, MaybePromise } from "./utils/types";
import { FinalUserConfig, UserConfigBase } from "@/config";
import { Program } from "./program";
import _ from "lodash";
import { AbsolutePath } from "./utils/path";
import path from "node:path";
import { filterNullable, unSafeObjectShallowWrapper } from "./utils/common";
import { mapValues, unique } from "radash";

export type CommandOption = Omit<Options, "alias"> & {
  alias?: string;
};
export type CommandOptions = {
  [optionName: string]: CommandOption;
};

export type CommandExistedOption = {
  optionName: string;
  option: CommandOption;
  command?: SubCommand;
  commandPath: string[];
};

export type CommandExistedOptions = {
  [optionName: string]: CommandExistedOption;
};

// export type CommandExistedOptions = Record<string, CommandExistedOption>;

export type CommandExistedOptionAliases = {
  [aliasName: string]: CommandExistedOption;
};

// TODO：直接可以定义 run action？
export interface Command<
  Config extends object = object,
  Options extends CommandOptions = CommandOptions,
  ConfigClone extends object = {
    [k in keyof Config]: Config[k];
  }
> {
  name: string;
  description?: string;
  defaultConfig: Config | (() => MaybePromise<Config>);
  options?: Options;
  configParse?: (params: {
    args: InferredOptionTypes<Options>;
  }) => MaybePromise<DeepPartial<ConfigClone> | undefined | void>;
  userConfigBaseParse?: (params: {
    args: InferredOptionTypes<Options>;
  }) => MaybePromise<DeepPartial<UserConfigBase> | undefined | void>;
  run: (params: {
    args: InferredOptionTypes<Options>;
    finalUserConfig: FinalUserConfig<Config>;
    helper: CommandHelper;
  }) => MaybePromise<void>;
  subCommands?: (params: {
    defineSubCommand: <SubCommandOptions extends CommandOptions>(
      subCommand: SubCommand<Config, SubCommandOptions>
    ) => SubCommand<Config, SubCommandOptions>;
  }) => SubCommand<Config, CommandOptions>[];
}

export type SubCommand<
  Config extends object = object,
  Options extends CommandOptions = CommandOptions
> = Omit<Command<Config, Options>, "defaultConfig">;

export type CommandFunc<
  Config extends object = {},
  Options extends CommandOptions = {}
> = () => MaybePromise<Command<Config, Options>>;

export const defineCommand = <
  Config extends object,
  Options extends CommandOptions
>(
  command: Command<Config, Options> | CommandFunc<Config, Options>
): Command<Config, Options> | CommandFunc<Config, Options> => {
  return command;
};

export type UseCommandConfigFunc<Config extends object> = () => MaybePromise<
  DeepPartial<Config>
>;

export const useCommand = <
  Config extends object,
  Options extends CommandOptions
>(
  command: Command<Config, Options> | CommandFunc<Config, Options>,
  config?: DeepPartial<Config> | UseCommandConfigFunc<Config>
): CommandFactory<Config> => {
  return new CommandFactory<Config>({
    command,
    config,
  });
};

export type GetCommandConfig<C extends Command> = C extends Command<infer T>
  ? T
  : {};

export class CommandFactory<
  Config extends object = {},
  Options extends CommandOptions = {}
> {
  #config?: DeepPartial<Config> | UseCommandConfigFunc<Config>;
  get config() {
    return this.#config;
  }
  #command: Command<Config, Options> | CommandFunc<Config, Options>;
  get command() {
    return this.#command;
  }
  constructor(params: {
    command: Command<Config, Options> | CommandFunc<Config, Options>;
    config?: DeepPartial<Config> | UseCommandConfigFunc<Config>;
  }) {
    const { command, config } = params;
    this.#config = config;
    this.#command = command;
  }
}

export const commandExistedOptionsToCommandExistedOptionAliases = (
  options: CommandExistedOptions
): CommandExistedOptionAliases => {
  return _.mapKeys(
    _.pickBy(options, (value, key) => {
      return value.option.alias;
    }),
    (value) => {
      return value.option.alias;
    }
  );
};

export const validateOptions = (params: {
  command: SubCommand;
  programName: string;
  commandPath: string[];
  optionsExisted: CommandExistedOptions;
}) => {
  const { command, commandPath, optionsExisted, programName } = params;
  const commandFullPath = [...commandPath, command.name];
  const aliasOptionsExited =
    commandExistedOptionsToCommandExistedOptionAliases(optionsExisted);
  const commandOptions = command.options || {};

  for (const [optionName, commandOption] of Object.entries(commandOptions)) {
    if (optionName.length <= 1) {
      throw new Error(
        `${commandFullPath.join(" ")} 的选项 ${optionName} 名称长度必须大于 1`
      );
    }
    const optionExited = unSafeObjectShallowWrapper(optionsExisted)[optionName];
    if (optionExited) {
      const optionExitedCommandFullPath = filterNullable([
        ...optionExited.commandPath,
        optionExited.command?.name,
      ]);

      if (optionExitedCommandFullPath.length > 0) {
        throw new Error(
          `${commandFullPath.join(" ")} 和 ${optionExitedCommandFullPath.join(
            " "
          )} 中存在相同选项 ${optionName}`
        );
      } else {
        throw new Error(
          `${commandFullPath.join(
            " "
          )} 不能使用选项 ${optionName} ,因为它是 ${programName} 已使用的选项`
        );
      }
    }
    const alias = commandOption.alias;

    if (alias) {
      if (alias.length > 1) {
        throw new Error(
          `${commandFullPath.join(
            " "
          )} 的选项 ${optionName} 的 alias 的长度必须等于 1`
        );
      }
      const aliasOptionExited =
        unSafeObjectShallowWrapper(aliasOptionsExited)[alias];
      if (aliasOptionExited) {
        const aliasOptionExitedCommandFullPath = filterNullable([
          ...aliasOptionExited.commandPath,
          aliasOptionExited.command?.name,
        ]);
        if (aliasOptionExitedCommandFullPath.length > 0) {
          throw new Error(
            `${commandFullPath.join(
              " "
            )} 的选项 ${optionName} 和 ${aliasOptionExitedCommandFullPath.join(
              " "
            )} 的选项 ${aliasOptionExited.optionName} 中存在相同 alias ${alias}`
          );
        } else {
          throw new Error(
            `${commandFullPath.join(
              " "
            )} 的选项 ${optionName} 不能使用alias ${alias} ,因为它已被 ${programName} 中的选项 ${
              aliasOptionExited.optionName
            } 使用`
          );
        }
      }
    }
  }
};

export const subCommandToParserCommand = (params: {
  command: SubCommand;
  program: Program;
  wrapRun: (params: {
    parserCommand: ParserCommand;
    value: SubCommand["run"];
    commandPath: string[];
  }) => ParserCommand["run"];
  commandPath: string[];
  optionsExisted: CommandExistedOptions;
}): ParserCommand => {
  const { command, wrapRun, commandPath, program, optionsExisted } = params;
  validateOptions({
    programName: program.name,
    command: command,
    commandPath,
    optionsExisted: {
      ...optionsExisted,
    },
  });

  const parserCommand: ParserCommand = {
    name: command.name,
    description: command.description,
    options: command.options,
    run: command.run,
  };
  const defineSubCommand = (c: any) => c;
  const subCommands = command.subCommands?.({ defineSubCommand });

  parserCommand.run = wrapRun({
    parserCommand,
    value: parserCommand.run,
    commandPath: [...(commandPath || [])],
  });
  if (subCommands) {
    const parentOptionsExisted: CommandExistedOptions = {
      ...optionsExisted,
      ...mapValues(command.options || {}, (option, optionName: string) => {
        return {
          option,
          optionName,
          command,
          commandPath: [],
        };
      }),
    };
    validateCommands({
      commands: subCommands,
      commandPath: [...(commandPath || []), parserCommand.name],
    });
    const parserSubCommands: ParserCommand[] = [];
    for (const sunCommand of subCommands) {
      const parserSunCommand = subCommandToParserCommand({
        command: sunCommand,
        wrapRun,
        program,
        commandPath: [...(commandPath || []), parserCommand.name],
        optionsExisted: {
          ...parentOptionsExisted,
        },
      });
      parserSubCommands.push(parserSunCommand);
    }
    parserCommand.subCommands = parserSubCommands;
  }
  return parserCommand;
};

export const validateCommands = (params: {
  commands: SubCommand[];
  commandPath: string[];
}) => {
  const { commands, commandPath } = params;
  const duplicateNames: string[] = [];
  const names = commands.map((e) => e.name);
  const nameSet = new Set<string>();
  for (const name of names) {
    if (nameSet.has(name)) {
      duplicateNames.push(name);
    } else {
      nameSet.add(name);
    }
  }
  if (duplicateNames.length > 0) {
    if (commandPath.length > 0) {
      throw new Error(
        `${commandPath.join(" ")} 中的子命令 ${duplicateNames.join(",")} 重复`
      );
    } else {
      throw new Error(`命令 ${duplicateNames.join(",")} 重复`);
    }
  }
};

export class CommandHelper {
  #program: Program;
  #finalUserConfig: FinalUserConfig;
  #command: SubCommand;
  #commandPath: string[];
  #parserCommand: ParserCommand;
  constructor(params: {
    program: Program;
    finalUserConfig: FinalUserConfig;
    commandPath: string[];
    command: SubCommand;
    parserCommand: ParserCommand;
  }) {
    this.#program = params.program;
    this.#finalUserConfig = params.finalUserConfig;
    this.#command = params.command;
    this.#parserCommand = params.parserCommand;
    this.#commandPath = params.commandPath;
  }
  get programName() {
    return this.#program.name;
  }
  get name() {
    return this.#parserCommand.name;
  }
  get commandPath() {
    return this.#commandPath;
  }
  get args() {
    return _.cloneDeep(this.#program.args);
  }
  get root() {
    const finalUserConfig = this.#finalUserConfig;
    const root = new AbsolutePath({
      content: path.resolve(finalUserConfig.base.root),
    });
    return root;
  }
  get tempDir() {
    const commandPath = this.commandPath;
    const name = this.name;
    const subPath = [...commandPath, name]
      .join("/")
      .replaceAll("/", "@")
      .replaceAll(" ", "+");
    const tempDir = this.root
      .resolve({
        next: this.#finalUserConfig.base.tempDir,
      })
      .resolve({
        next: subPath,
      });
    return tempDir;
  }

  get locale() {
    return this.#program.locale;
  }
}
