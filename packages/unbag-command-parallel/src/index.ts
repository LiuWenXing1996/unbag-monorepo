import { v4 as uuidv4 } from "uuid";
import {
  WaitConfig,
  WaitDefaultConfig,
  genWaitCommand,
  mergeWaitFile,
  wait,
  waitCmdName,
  writeWaitFile,
} from "./wait";
import concurrently from "concurrently";
import {
  AbsolutePath,
  Command,
  CommandHelper,
  defineCommand,
  FinalUserConfig,
  unSafeObjectShallowWrapper,
} from "unbag";
import { MaybePromise } from "./utils";
import { DeepPartial } from "ts-essentials";
import _ from "lodash";
import fsExtra from "fs-extra/esm";

export type ParallelConfigScripts =
  | ParallelScript[]
  | (() => MaybePromise<ParallelScript[]>);
export interface ParallelConfig {
  wait: WaitConfig;
  beforeRun?: () => MaybePromise<boolean>;
  beforeCheck?: () => MaybePromise<boolean>;
  scripts: ParallelConfigScripts;
  groups: {
    [name: string]: ParallelConfigScripts;
  };
}
export const ParallelDefaultConfig: ParallelConfig = {
  wait: WaitDefaultConfig,
  scripts: [],
  groups: {},
};
export interface ParallelScript {
  name: string;
  wait?: DeepPartial<WaitConfig> & {
    func: () => MaybePromise<boolean>;
  };
  command: string;
}

const runWaitFunc = async (func: () => MaybePromise<boolean>) => {
  console.log("runWaitFunc");
  return await func();
};

export const getParallelScripts = async (params: {
  config: ParallelConfig;
  groupName?: string;
}): Promise<ParallelScript[]> => {
  const { config, groupName } = params;
  const groups = unSafeObjectShallowWrapper(config.groups);
  if (groupName) {
    const scriptsInGroup = groups[groupName];
    if (!scriptsInGroup) {
      throw new Error("exit on beforeRunRes");
    }
    if (_.isFunction(scriptsInGroup)) {
      return await scriptsInGroup();
    } else {
      return scriptsInGroup;
    }
  }
  if (config.scripts) {
    console.log({ s: config.scripts, sss: _.isFunction(() => {}) });

    if (_.isFunction(config.scripts)) {
      return await config.scripts();
    } else {
      return config.scripts;
    }
  }
  return [];
};

export const parallel = async (params: {
  config: FinalUserConfig<ParallelConfig>;
  commandHelper: CommandHelper;
  groupName?: string;
}) => {
  const { config, commandHelper, groupName } = params;
  const { commandConfig: parallel } = config;
  const { beforeRun, beforeCheck } = parallel;
  const tempDir = commandHelper.tempDir;
  fsExtra.emptyDir(tempDir.content);
  const finalScripts = await getParallelScripts({
    config: config.commandConfig as ParallelConfig,
    groupName,
  });

  const waitFuncList: {
    path: AbsolutePath;
    func: () => MaybePromise<boolean>;
  }[] = [];

  const commandList: {
    command: string;
    name: string;
  }[] = await Promise.all([
    ...finalScripts.map(async (script) => {
      let command = `${script.command}`;
      if (script.wait?.func) {
        console.log({ tempDir: tempDir.content });
        const waitFilePath = tempDir.resolve({
          next: `${script.name}_wait_${uuidv4()}`,
        });
        await writeWaitFile({
          filePath: waitFilePath,
          content: {
            name: script.name,
            finish: false,
            interval:
              script.wait.interval ||
              parallel.wait.interval ||
              WaitDefaultConfig.interval,
            timeout:
              script.wait.interval ||
              parallel.wait.timeout ||
              WaitDefaultConfig.timeout,
            checkTime: [],
            result: false,
            message: "",
          },
        });
        waitFuncList.push({
          func: script.wait?.func,
          path: waitFilePath,
        });

        const waitCmd = genWaitCommand({
          waitResAbsoluteFilePath: waitFilePath,
          commandHelper,
        });
        command = `${waitCmd} && ${command}`;
      }
      return {
        name: script.name,
        command,
      };
    }),
  ]);
  if (beforeRun) {
    const beforeRunRes = await beforeRun();
    if (!beforeRunRes) {
      throw new Error("exit on beforeRunRes");
    }
  }

  console.log({ commandList });

  concurrently(commandList, {
    prefixColors: "auto",
    prefix: "[{time}]-[{name}]",
    timestampFormat: "HH:mm:ss",
    killOthers: ["failure"],
  });

  if (beforeCheck) {
    const res = await beforeCheck();
    if (!res) {
      throw new Error("exit on beforeCheck");
    }
  }

  for (const waitFunc of waitFuncList) {
    runWaitFunc(waitFunc.func)
      .then(async (res) => {
        console.log("check finish");
        await mergeWaitFile({
          filePath: waitFunc.path,
          content: {
            finish: true,
            result: res,
            message: res ? "success" : "false",
          },
        });
      })
      .catch(async (error) => {
        await mergeWaitFile({
          filePath: waitFunc.path,
          content: {
            finish: true,
            result: false,
            message: error.message || "unknown error",
          },
        });
      });
  }
};
export const ParallelCommand = defineCommand({
  defaultConfig: ParallelDefaultConfig,
  name: "parallel",
  description: "在支持运行多个 npm script 时，同时可将某些 npm script 延迟执行",
  options: {
    group: {
      alias: "g",
      description: "使用的某一组脚本操作",
    },
  },
  run: async ({ finalUserConfig, helper }) => {
    await parallel({
      config: finalUserConfig,
      commandHelper: helper,
    });
  },
  subCommands: ({ defineSubCommand }) => {
    return [
      defineSubCommand({
        name: waitCmdName,
        description: "parallel 内部利用此命令来达到脚本延迟执行功能",
        options: {
          filePath: {
            alias: "f",
            description: "要轮询检查的文件的路径",
            type: "string",
          },
        },
        run: async ({ args }) => {
          const { filePath = "" } = args;
          await wait({ filePath });
        },
      }),
    ];
  },
});
