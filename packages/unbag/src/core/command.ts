// import {
//   deepFreezeConfig,
//   mergeDefaultConfig,
//   UserConfigOptional,
// } from "@/utils/config";
// import { useLog } from "@/utils/log";
// import { MaybePromise } from "@/utils/types";
// import { DeepPartial, DeepReadonly } from "ts-essentials";
// import { InferredOptionTypes, Options } from "yargs";
// import { UserConfig, UserConfigBase } from "./user-config";

// export abstract class Command<P = void, R = void> {
//   #finalUserConfig: FinalUserConfig;
//   constructor(config: UserConfigOptional) {
//     const finalUserConfig = mergeDefaultConfig(config);
//     const freezedConfig = deepFreezeConfig(finalUserConfig);
//     this.#finalUserConfig = freezedConfig;
//   }
//   get finalUserConfig(): FinalUserConfig {
//     return this.#finalUserConfig;
//   }
//   async run(params: P) {
//     const { finalUserConfig } = this;

//     const log = useLog({ finalUserConfig });
//     try {
//       await this.task(params);
//     } catch (error) {
//       log.catchThrowError(error);
//       process.exit(1);
//     }
//   }
//   abstract task(params: P): MaybePromise<R>;
// }

// export interface SubCommand<
//   C,
//   O extends { [key: string]: Options } = { [key: string]: Options },
//   D = DeepPartial<C>
// > {
//   name: string;
//   description?: string;
//   aliases?: string[] | string;
//   options?: O;
//   userConfigCommandParse?: (params: {
//     args: InferredOptionTypes<O>;
//   }) => MaybePromise<D | undefined | void>;
//   userConfigBaseParse?: (params: {
//     args: InferredOptionTypes<O>;
//   }) => MaybePromise<D | undefined | void>;
//   action: (params: {
//     args: InferredOptionTypes<O>;
//     finalUserConfigBase: DeepReadonly<UserConfigBase>;
//     finalUserConfigCommand: DeepReadonly<C>;
//   }) => MaybePromise<void>;
// }

// export abstract class CliCommand<C> {
//   #commands: SubCommand<C, { [key: string]: Options }>[];
//   abstract useDefaultConfig(): MaybePromise<C>;
//   abstract resolveConfigFromUserConfig(userConfig: UserConfig): MaybePromise<C>;
//   addSubCommand<O extends { [key: string]: Options }>(
//     params: SubCommand<C, O>
//   ) {}
//   async init() {}
// }
