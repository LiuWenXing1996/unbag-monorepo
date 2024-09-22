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

export const createProgram = () => {
  return yargs(hideBin(process.argv)).help(false).version(false);
};

export interface CliCommand<C> {
  useDefaultConfig: () => MaybePromise<C>;
  defineSubCommands: (params: {
    defineSubCommand: <O extends { [key: string]: Options }>(
      subCommand: CliSubCommand<C, O>
    ) => CliSubCommand<C, O>;
  }) => CliSubCommand<C, { [key: string]: Options }>[];
}

export interface CliSubCommand<
  C,
  O extends { [key: string]: Options },
  D = DeepPartial<C>
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
  action: (params: {
    args: InferredOptionTypes<O>;
    finalUserConfig: FinalUserConfig<C>;
  }) => MaybePromise<void>;
}

export const defineCliCommand = <C>(
  cliCommand: CliCommand<C>
): CliCommand<C> => {
  return cliCommand;
};

export const addCliSubCommand = async <
  C,
  O extends { [key: string]: Options }
>(params: {
  program: Argv;
  command: CliSubCommand<C, O>;
  userConfigBase: UserConfigBase;
  commandConfig: C;
}): Promise<Argv> => {
  const { program, command, userConfigBase, commandConfig } = params;
  const {
    name,
    aliases,
    description,
    action,
    configParse: userConfigCommandParse,
    userConfigBaseParse,
  } = unSafeObjectWrapper(command);
  const { options } = command;
  if (!name) {
    throw new Error("undefined name for addCliSubCommand");
  }
  if (!action) {
    throw new Error("undefined action for addCliSubCommand");
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
      await action({ args, finalUserConfig });
    }
  );
  return program;
};

export const addCliCommand = async <C>(params: {
  program: Argv;
  command: CliCommand<C>;
  userConfigBase: UserConfigBase;
  commandConfig: DeepPartial<C>;
}): Promise<Argv> => {
  const { program, command, userConfigBase, commandConfig } = params;
  const { useDefaultConfig, defineSubCommands } = command;
  const defaultCommandConfig = await useDefaultConfig();
  const userCommandConfig = mergeConfig<C, DeepPartial<C>>({
    defaultValue: defaultCommandConfig,
    overrides: [commandConfig],
  });
  const commands = defineSubCommands({
    defineSubCommand: (c) => c,
  });
  for (const command of commands) {
    await addCliSubCommand({
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
