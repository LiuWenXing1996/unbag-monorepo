import {
  arraify,
  filterNullable,
  Locale,
  unSafeObjectWrapper,
} from "@/utils/common";
import { useFs } from "@/utils/fs";
import { useMessage } from "@/utils/message";
import { AbsolutePath, usePath } from "@/utils/path";
import { MaybePromise } from "@/utils/types";
import { bundleRequire } from "bundle-require";
import yargs, {
  Argv,
  InferredOptionType,
  InferredOptionTypes,
  Options,
} from "yargs";
import { hideBin } from "yargs/helpers";
import {
  freezeConfig,
  mergeConfig,
  UserConfigBase,
  UserConfig,
  FinalUserConfig,
} from "./user-config";
import { DeepPartial, DeepReadonly } from "ts-essentials";
import { wrapAsyncFuncWithLog } from "@/utils/log";

export const createProgram = () => {
  return yargs(hideBin(process.argv)).help(false).version(false);
};
export type CliCommandOptions = { [key: string]: Options };
export interface CliCommand<C> {
  useDefaultConfig: () => MaybePromise<C>;
  defineActions: (params: {
    defineAction: <O extends { [key: string]: Options }>(
      action: CliCommandAction<C, O>
    ) => CliCommandAction<C, O>;
  }) => CliCommandAction<C, { [key: string]: Options }>[];
}

export interface CliCommandAction<
  C,
  O extends { [key: string]: Options },
  D extends DeepPartial<C> = DeepPartial<C>
> {
  name: string;
  description?: string;
  aliases?: string[] | string;
  options?: O;
  configParse?: (params: {
    args: InferredOptionTypes<O>;
  }) => MaybePromise<D | undefined | void>;
  userConfigBaseParse?: (params: {
    args: InferredOptionTypes<O>;
  }) => MaybePromise<UserConfigBase | undefined | void>;
  run: (params: {
    args: InferredOptionTypes<O>;
    finalUserConfig: FinalUserConfig<C>;
  }) => MaybePromise<void>;
}

export const defineCliCommand = <C>(
  cliCommand: CliCommand<C>
): CliCommand<C> => {
  return cliCommand;
};

export class CliCommandFactory<C, D extends DeepPartial<C> = DeepPartial<C>> {
  #config?: D;
  get config() {
    return this.#config;
  }
  #cliCommand: CliCommand<C>;
  get cliCommand() {
    return this.#cliCommand;
  }
  constructor(params: { cliCommand: CliCommand<C>; config?: D }) {
    const { cliCommand, config } = params;
    this.#config = config;
    this.#cliCommand = cliCommand;
  }
}

export const useCliCommand = <C, O extends CliCommandOptions>(
  cliCommand: CliCommand<C>,
  config?: DeepPartial<C>
) => {
  return new CliCommandFactory<C>({
    cliCommand,
    config,
  });
};

export const addCliCommandAction = async <
  C,
  O extends { [key: string]: Options }
>(params: {
  program: Argv;
  command: CliCommandAction<C, O>;
  userConfigBase: UserConfigBase;
  commandConfig: C;
}): Promise<Argv> => {
  const { program, command, userConfigBase, commandConfig } = params;
  const {
    name,
    aliases,
    description,
    run: action,
    configParse: userConfigCommandParse,
    userConfigBaseParse,
  } = unSafeObjectWrapper(command);
  const { options } = command;
  if (!name) {
    throw new Error("undefined name for addCliCommandAction");
  }
  if (!action) {
    throw new Error("undefined action for addCliCommandAction");
  }
  const cmdNameWithAliases: string[] = [
    name,
    ...filterNullable(arraify(aliases || [])),
  ];

  program.command(
    cmdNameWithAliases,
    description || "",
    options || {},
    async (args: any) => {
      delete args._;
      delete args.$0;
      const userConfigBaseFromArgs = await userConfigBaseParse?.({ args });
      const userConfigCommandFromArgs = await userConfigCommandParse?.({
        args,
      });
      const userConfigBaseMerged = mergeConfig({
        defaultValue: userConfigBase,
        overrides: [userConfigBaseFromArgs],
      });
      const userConfigCommandMerged = mergeConfig({
        defaultValue: commandConfig,
        overrides: [userConfigCommandFromArgs],
      });
      const finalUserConfig = freezeConfig({
        base: userConfigBaseMerged,
        commandConfig: userConfigCommandMerged,
      });
      const actionWithLog = wrapAsyncFuncWithLog({
        finalUserConfig: finalUserConfig,
        func: async () => {
          await action({ args, finalUserConfig });
        },
      });
      await actionWithLog();
    }
  );
  return program;
};

export const addCliCommand = async <C>(params: {
  program: Argv;
  cliCommandFactory: CliCommandFactory<C>;
  userConfigBase: UserConfigBase;
}): Promise<Argv> => {
  const { program, cliCommandFactory, userConfigBase } = params;
  const command = cliCommandFactory.cliCommand;
  const commandConfig = cliCommandFactory.config;
  const { useDefaultConfig, defineActions } = command;
  const defaultCommandConfig = await useDefaultConfig();
  const userCommandConfig = mergeConfig<C, DeepPartial<C> | undefined>({
    defaultValue: defaultCommandConfig,
    overrides: [commandConfig],
  });
  const commands = defineActions({
    defineAction: (c) => c,
  });
  for (const command of commands) {
    await addCliCommandAction({
      program,
      command,
      userConfigBase,
      commandConfig: userCommandConfig,
    });
  }
  return program;
};

export interface CliOption<K extends string, O extends Options> {
  key: K;
  options: O;
}

export const defineCliOption = <K extends string, O extends Options>(
  cliOption: CliOption<K, O>
): CliOption<K, O> => {
  return cliOption;
};

export const addCliOption = <
  K extends string,
  O extends Options,
  T extends { [key in K]: InferredOptionType<O> },
  D
>(params: {
  program: Argv<D>;
  option: {
    key: K;
    options: O;
  };
}): Argv<D & T> => {
  const { program, option } = params;
  const { key, options } = option;
  program.option(key, options);
  return program as Argv<D & T>;
};

export const localeDetect = () => {
  const program = createProgram();
  const localeDetected = program.locale();
  return localeDetected;
};

export const LocaleCliOption = defineCliOption({
  key: "l",
  options: {
    description: "本地化语言",
    alias: "locale",
    type: "string",
  },
});

export const RootCliOption = defineCliOption({
  key: "r",
  options: {
    alias: "root",
    type: "string",
  },
});

export const UserConfigFilePathCliOption = defineCliOption({
  key: "c",
  options: {
    alias: "config",
    type: "string",
  },
});

export const parseLocaleFromCli = async (): Promise<string | undefined> => {
  const program = createProgram();
  const p = addCliOption({
    program,
    option: LocaleCliOption,
  });
  const localeParser = await program
    .option(LocaleCliOption.key, LocaleCliOption.options)
    .parse();
  const localeFromCli = localeParser.l;
  return localeFromCli;
};

export const parseUserConfigFilePathFromCli = async (): Promise<
  string | undefined
> => {
  const program = createProgram();
  const userConfigFilePathParser = await program
    .option(
      UserConfigFilePathCliOption.key,
      UserConfigFilePathCliOption.options
    )
    .parse();
  const userConfigFilePath = userConfigFilePathParser.c;
  return userConfigFilePath;
};

export const parseRootFromCli = async (): Promise<string | undefined> => {
  const program = createProgram();
  const rootParser = await program
    .option(RootCliOption.key, UserConfigFilePathCliOption.options)
    .parse();
  const root = rootParser.r;
  return root;
};

export const lookupUserConfigFilePath = async (params: {
  root: AbsolutePath;
  configFilePath?: string;
  locale: Locale;
}): Promise<AbsolutePath | undefined> => {
  const { root, configFilePath, locale } = params;
  const path = usePath();
  const fs = useFs();
  const message = useMessage({
    locale,
  });
  if (configFilePath) {
    const absoluteFilePath = new AbsolutePath({
      content: path.resolve(root.content, configFilePath),
    });
    const isExit = await fs.pathExists(absoluteFilePath.content);
    if (!isExit) {
      throw new Error(message.config.file.notFound(absoluteFilePath.content));
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
};

export async function loadUserConfigFromFile(params: {
  filePath: AbsolutePath;
}): Promise<UserConfig | undefined> {
  const { filePath } = params;
  const { mod } = await bundleRequire({
    filepath: filePath.content,
    format: "esm",
  });
  const config = mod.default || mod;
  return config;
}
