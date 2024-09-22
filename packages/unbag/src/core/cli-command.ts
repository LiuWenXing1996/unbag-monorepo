// import { Locale, unSafeObjectWrapper } from "@/utils/common";
// import {
//   FinalUserConfig,
//   UserConfigOptional,
//   useDefaultConfig,
// } from "@/utils/config";
// import { AbsolutePath, usePath } from "@/utils/path";
// import { MaybePromise } from "@/utils/types";
// import {
//   Option as CommanderOption,
//   Command as CommanderCommand,
// } from "commander";
// import { bundleRequire } from "bundle-require";
// import { useFs } from "@/utils/fs";
// import { useMessage } from "@/utils/message";
// import { freezeUserConfig, mergeUserConfig } from "./user-config";
// import { useLog } from "@/utils/log";

// export interface CliCommandConfig<P = void, R = void> {
//   name: string;
//   description?: string;
//   options?: {
//     flags: string;
//     description?: string;
//   }[];
//   optionsParser?: (params: { cliOptions: any }) => MaybePromise<
//     | {
//         userConfig?: UserConfigOptional;
//         taskInput?: P;
//       }
//     | undefined
//   >;
//   task: (params: {
//     input: P;
//     finalUserConfig: FinalUserConfig;
//   }) => MaybePromise<R>;
// }

// export const resolveUserConfigFromCli = async (options: {
//   root: AbsolutePath;
//   filePath?: string;
//   locale: Locale;
// }): Promise<
//   | (UserConfigOptional & {
//       configFileResolvedPath: string;
//     })
//   | undefined
// > => {
//   const { filePath, root, locale } = options;
//   const fs = useFs();
//   const path = usePath();
//   const message = useMessage({
//     locale,
//   });
//   if (filePath) {
//     const absoluteFilePath = path.resolve(root.content, filePath);
//     const isExit = await fs.pathExists(absoluteFilePath);
//     if (!isExit) {
//       throw new Error(message.config.file.notFound(absoluteFilePath));
//     }
//     return await loadUserConfigFromFile(
//       new AbsolutePath({
//         content: absoluteFilePath,
//       })
//     );
//   } else {
//     const configFileDefaultList = [
//       "unbag.config.ts",
//       "unbag.config.js",
//       "unbag.config.cjs",
//       "unbag.config.mjs",
//     ];
//     for (const filePath of configFileDefaultList) {
//       const absoluteFilePath = path.resolve(root.content, filePath);
//       const isExit = await fs.pathExists(absoluteFilePath);
//       if (!isExit) {
//         break;
//       }
//       return await loadUserConfigFromFile(
//         new AbsolutePath({
//           content: absoluteFilePath,
//         })
//       );
//     }
//   }
// };

// export async function loadUserConfigFromFile(
//   absoluteFilePath: AbsolutePath
// ): Promise<
//   | (UserConfigOptional & {
//       configFileResolvedPath: string;
//     })
//   | undefined
// > {
//   const { mod } = await bundleRequire({
//     filepath: absoluteFilePath.content,
//     format: "esm",
//   });
//   const config = mod.default || mod;
//   config.configFileResolvedPath = absoluteFilePath;
//   return config;
// }

// export const createCliCommand = <P = void, R = void>(params: {
//   config: CliCommandConfig<P, R>;
// }): CommanderCommand => {
//   const { config } = params;
//   const { name, description, optionsParser, task } =
//     unSafeObjectWrapper(config);
//   if (!name) {
//     throw new Error("undefined name for createCliCommand");
//   }
//   if (!task) {
//     throw new Error("undefined task for createCliCommand");
//   }
//   const commanderCommand = new CommanderCommand();
//   commanderCommand.name(name);
//   description && commanderCommand.description(description);
//   const commonCommanderOptionList = [
//     new CommanderOption("-c,--config <string>", "配置文件路径"),
//     new CommanderOption("-r,--root <string>", "根路径"),
//     new CommanderOption("-l,--local <string>", "本地化语言"),
//   ];
//   for (const commanderOption of commonCommanderOptionList) {
//     commanderCommand.addOption(commanderOption);
//   }
//   const customCommanderOptionList = (config.options || []).map((option) => {
//     return new CommanderOption(option.flags, option.description);
//   });
//   for (const commanderOption of customCommanderOptionList) {
//     commanderCommand.addOption(commanderOption);
//   }
//   commanderCommand.action(async (cliOptions) => {
//     const { config: filePath, root, locale } = cliOptions;
//     const defaultConfig = useDefaultConfig();
//     const path = usePath();
//     const absoluteRoot = new AbsolutePath({
//       content: path.resolve(root || defaultConfig.root),
//     });
//     const userConfigFromCli = await resolveUserConfigFromCli({
//       root: absoluteRoot,
//       filePath,
//       locale,
//     });
//     const optionsParserRes = await optionsParser?.({ cliOptions });
//     const finalUserConfig = mergeUserConfig({
//       defaultValue: defaultConfig,
//       list: [optionsParserRes?.userConfig, userConfigFromCli],
//     });
//     const freezedConfig = freezeUserConfig(finalUserConfig);

//     const log = useLog({ finalUserConfig });
//     try {
//       await task({
//         input: optionsParserRes?.taskInput as P,
//         finalUserConfig: freezedConfig,
//       });
//     } catch (error) {
//       log.catchThrowError(error);
//       process.exit(1);
//     }
//   });

//   return commanderCommand;
// };
