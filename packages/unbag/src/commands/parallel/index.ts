import { DeepPartial, MaybePromise } from "../../utils/types";
import { v4 as uuidv4 } from "uuid";
import {
  CheckWaitFileResult,
  WaitCmdName,
  WaitConfig,
  WaitDefaultConfig,
  checkWaitFile,
  genWaitCommand,
  genWaitResAbsoluteFilePath,
  writeWaitResFile,
} from "./wait";
import concurrently from "concurrently";
import { usePath } from "../../utils/path";
import { FinalUserConfig } from "@/core/user-config";
import { defineCliCommand } from "@/core/cli";
export interface ParallelConfig {
  wait: WaitConfig;
  commands: ParallelCommand[];
  groupName?: string;
  groups: Record<string, ParallelCommand[]>;
}
export const ParallelDefaultConfig: ParallelConfig = {
  wait: WaitDefaultConfig,
  commands: [],
  groups: {},
};
export interface ParallelCommand {
  name: string;
  wait?: DeepPartial<WaitConfig> & {
    func: () => MaybePromise<boolean>;
  };
  npmScript: string;
}
export interface Command {
  command: string;
  name: string;
}
export const parallel = async (config: FinalUserConfig<ParallelConfig>) => {
  const needWaitCmdMap = new Map<string, ParallelCommand | undefined>();
  const {
    commandConfig: parallel,
    base: { root, tempDir },
  } = config;
  const { commands, groupName, groups } = parallel;
  const path = usePath();
  const parallelTempDir = path.resolve(root, tempDir, "parallel");
  const parallelWaitTempDir = path.resolve(parallelTempDir, "wait");
  const finalCommands = (groupName ? groups[groupName] : commands) || [];
  const commandList: Command[] = finalCommands.map((e) => {
    let command = `${e.npmScript}`;
    if (e.wait?.func) {
      const waitTag = `${e.name}_wait_${uuidv4()}`;
      const waitCmd = genWaitCommand({
        tag: waitTag,
        name: e.name,
      });
      command = `${waitCmd} && ${command}`;
      needWaitCmdMap.set(waitTag, e);
    }
    return {
      name: e.name,
      command,
    };
  });
  const waitFuncObj = Object.fromEntries(needWaitCmdMap.entries());

  // prepare wait tag files
  await Promise.all(
    Object.keys(waitFuncObj).map(async (tag) => {
      const cmd = waitFuncObj[tag];
      if (!cmd?.wait?.func) {
        return;
      }
      const waitResAbsoluteFilePath = genWaitResAbsoluteFilePath({
        absoluteTempDir: parallelWaitTempDir,
        tag,
      });
      await writeWaitResFile({
        absoluteFilePath: waitResAbsoluteFilePath,
        content: {
          tag,
          lastUpdateTime: Date.now(),
          finish: false,
          interval: cmd.wait.interval || WaitDefaultConfig.interval,
          timeout: cmd.wait.interval || WaitDefaultConfig.timeout,
        },
      });
    })
  );
  concurrently(commandList, {
    prefixColors: "auto",
    prefix: "[{time}]-[{name}]",
    timestampFormat: "HH:mm:ss",
    killOthers: ["failure"],
  });

  // run wait functions
  Object.keys(waitFuncObj).map(async (tag) => {
    const cmd = waitFuncObj[tag];
    if (!cmd?.wait?.func) {
      return;
    }
    const waitResAbsoluteFilePath = genWaitResAbsoluteFilePath({
      absoluteTempDir: parallelWaitTempDir,
      tag,
    });
    try {
      const res = await cmd.wait.func();
      await writeWaitResFile({
        absoluteFilePath: waitResAbsoluteFilePath,
        merge: true,
        content: {
          lastUpdateTime: Date.now(),
          finish: true,
          result: res,
          message: res ? "success" : "false",
        },
      });
    } catch (error) {
      await writeWaitResFile({
        absoluteFilePath: waitResAbsoluteFilePath,
        merge: true,
        content: {
          finish: true,
          lastUpdateTime: Date.now(),
          result: false,
          message: error.message || "unknown error",
        },
      });
    }
  });
};

export const ParallelCliCommand = defineCliCommand<ParallelConfig>({
  useDefaultConfig: () => {
    return ParallelDefaultConfig;
  },
  defineActions: ({ defineAction }) => {
    return [
      defineAction({
        name: "parallel",
        description: "运行多个npm script",
        run: async ({ finalUserConfig }) => {
          await parallel(finalUserConfig);
        },
      }),
      defineAction({
        name: WaitCmdName,
        description: "parallel命令利用此命令来达到wait功能",
        options: {
          name: {
            alias: "n",
            description: "等待的命令名称",
            type: "string",
          },
          absoluteFilePath: {
            alias: "f",
            description: "要轮询检查的文件的绝对路径",
            type: "string",
          },
          tag: {
            alias: "tg",
            description: "等待的函数运行标志",
            type: "string",
          },
          tempDir: {
            alias: "td",
            description: "临时文件夹",
            type: "string",
          },
          interval: {
            alias: "i",
            description: "临时文件夹",
            type: "string",
          },
          timeout: {
            alias: "tm",
            description: "超时时间",
            type: "string",
          },
        },
        run: async ({ finalUserConfig, args }) => {
          const { name = "", absoluteFilePath = "" } = args;
          let checkResult: CheckWaitFileResult | undefined = undefined;
          if (absoluteFilePath && name) {
            checkResult = await checkWaitFile({
              name,
              absoluteFilePath,
            });
          }
          if (checkResult?.content.result) {
            process.exit(0);
          } else {
            process.exit(1);
          }
        },
      }),
    ];
  },
});
