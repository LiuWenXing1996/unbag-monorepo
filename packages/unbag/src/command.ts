import { type InferredOptionTypes } from "yargs";
import { ParserCommand, ParserOptions } from "./parser";
import { DeepPartial, MaybePromise } from "./utils/types";
import {
  defineUserConfig,
  FinalUserConfig,
  UserConfigBase,
} from "./core/user-config";
import { Program } from "./program";
import _ from "lodash";
import { AbsolutePath } from "./utils/path";
import path from "node:path";

export type CommandOptions = ParserOptions;

export interface Command<
  Config extends object = {},
  Options extends CommandOptions = {},
  ConfigClone extends object = {
    [k in keyof Config]: Config[k];
  }
> {
  name: string;
  description?: string;
  aliases?: string[] | string;
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
  Config extends object = {},
  Options extends CommandOptions = {}
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

export const subCommandToParserCommand = (params: {
  command: SubCommand;
  wrapRun: (params: {
    parserCommand: ParserCommand;
    value: SubCommand["run"];
    commandPath: string[];
  }) => ParserCommand["run"];
  commandPath?: string[];
}): ParserCommand => {
  const { command, wrapRun, commandPath } = params;
  const parserCommand: ParserCommand = {
    name: command.name,
    description: command.description,
    aliases: command.aliases,
    options: command.options,
    run: () => void 0,
  };
  const defineSubCommand = (c: any) => c;
  const subCommands = command.subCommands?.({ defineSubCommand });
  if (subCommands) {
    parserCommand.subCommands = subCommands.map((subCommand) =>
      subCommandToParserCommand({
        command: subCommand,
        wrapRun,
        commandPath: [...(commandPath || []), parserCommand.name],
      })
    );
  }
  parserCommand.run = wrapRun({
    parserCommand,
    value: command.run,
    commandPath: [...(commandPath || [])],
  });
  return parserCommand;
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
}

useCommand(
  defineCommand({
    name: "",
    defaultConfig: {
      c: "ss",
    },
    options: {
      ss: {
        type: "boolean",
      },
    },
    run: ({ args }) => {
      args.ss;
    },
  }),
  () => {
    return {};
  }
);

export const a = defineUserConfig({
  commands: [
    useCommand(
      defineCommand(async () => ({
        defaultConfig: {
          c: "",
        },
        name: "build",
        options: {
          all: {
            description: "是否构建所有",
          },
        },
        run: async ({ args }) => {
          args.all;
        },
      })),
      {}
    ),
  ],
});
