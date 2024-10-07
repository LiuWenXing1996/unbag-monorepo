import yargs, {
  Argv,
  InferredOptionType,
  InferredOptionTypes,
  Options,
} from "yargs";
import { MaybePromise } from "./utils/types";
import { arraify, filterNullable, unSafeObjectWrapper } from "./utils/common";

export interface ParserOption {
  key: string;
  options: Options;
}

export interface ParserOptions {
  [key: string]: Options;
}

export interface ParserCommand<Options extends ParserOptions = ParserOptions> {
  name: string;
  description?: string;
  aliases?: string[] | string;
  options?: Options;
  subCommands?: ParserCommand[];
  run: (params: { args: InferredOptionTypes<Options> }) => MaybePromise<void>;
}

const addCommand = (params: {
  yargsInstance: Argv;
  command: ParserCommand;
}) => {
  const { yargsInstance, command } = params;
  const { name, aliases, description, run, subCommands } =
    unSafeObjectWrapper(command);
  const { options } = command;
  if (!name) {
    throw new Error("undefined name for addCommand");
  }
  if (!run) {
    throw new Error("undefined run for addCommand");
  }
  const cmdNameWithAliases: string[] = [
    name,
    ...filterNullable(arraify(aliases || [])),
  ];
  yargsInstance.command(
    cmdNameWithAliases,
    description || "",
    (subYargsInstance) => {
      subYargsInstance.options(options || {});
      if (subCommands?.length && subCommands.length > 0) {
        for (const subCommand of subCommands) {
          addCommand({
            yargsInstance: subYargsInstance,
            command: subCommand as ParserCommand,
          });
        }
      }
    },
    async (args: any) => {
      delete args._;
      delete args.$0;
      await run(args);
    }
  );
};

export class Parser<Options extends ParserOptions = {}> {
  #yargs: Argv<{
    [key in keyof Options]: InferredOptionType<Options[key]>;
  }>;
  constructor(params: { options: Options; scriptName?: string }) {
    const { options, scriptName } = params;
    this.#yargs = yargs().help(false).version(false).options(options);
    if (scriptName) {
      this.#yargs.scriptName(scriptName);
    }
  }
  async parse(args: string[]): Promise<InferredOptionTypes<Options>> {
    const res = await this.#yargs.parse(args);
    return res as unknown as InferredOptionTypes<Options>;
  }
  addCommand<Options extends ParserOptions>(command: ParserCommand<Options>) {
    addCommand({
      yargsInstance: this.#yargs,
      command,
    });
  }
  enableHelp() {
    this.#yargs.help(true).alias("help", "h");
  }
  disableHelp() {
    this.#yargs.help(false);
  }
  enableVersion(version: string) {
    this.#yargs.version(version).alias("version", "v");
  }
  disableVersion() {
    this.#yargs.version(false);
  }
  localeDetect() {
    return this.#yargs.locale();
  }
}
