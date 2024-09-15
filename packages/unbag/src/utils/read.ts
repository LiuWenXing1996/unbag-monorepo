import { Command, Option } from "commander";
import { transform } from "../commands/transform";
import { parallel } from "../commands/parallel";
import {
  CheckWaitFileResult,
  WaitCmdName,
  checkWaitFile,
} from "../commands/parallel/wait";
import { release } from "../commands/release";
import { commit } from "../commands/commit";
import _ from "lodash";
import { commitLint } from "@/commands/commit/lint";
import { createCliCommand } from "@/core/cli-command";
export class CustomCliCommand extends Command {
  addOptions(options: Option[]) {
    for (const option of options) {
      this.addOption(option);
    }
    return this;
  }
}
export const read = () => {
  const program = new CustomCliCommand();
  program.name("unbag").description("unbag CLI").version("0.8.0");
  program
    .addCommand(
      createCliCommand({
        config: {
          name: "transform",
          description: "转换文件",
          options: [
            {
              flags: "-w,--watch",
              description: "启用观察模式",
            },
          ],
          optionsParser: ({ cliOptions }) => {
            return {
              userConfig: {
                transform: {
                  watch: cliOptions.watch,
                },
              },
            };
          },
          task: async ({ finalUserConfig }) => {
            await transform({ finalUserConfig });
          },
        },
      })
    )
    .addCommand(
      createCliCommand({
        config: {
          name: "commit",
          description: "提交文件",
          task: async ({ finalUserConfig }) => {
            await commit({ finalUserConfig });
          },
        },
      })
    )
    .addCommand(
      createCliCommand({
        config: {
          name: "commit-lint",
          description: "校验提交信息",
          options: [
            {
              flags: "-m,--message <string>",
              description: "需要校验的信息文本",
            },
          ],
          optionsParser: ({ cliOptions }) => {
            return {
              taskInput: {
                message: cliOptions.message as string,
              },
            };
          },
          task: async ({ finalUserConfig, input }) => {
            await commitLint({ finalUserConfig, message: input.message });
          },
        },
      })
    )
    .addCommand(
      createCliCommand({
        config: {
          name: "release",
          description:
            "执行一系列的发布操作，包含生成版本号、生成发布日志、提交发布文件、添加 git 标签等动作",
          options: [
            {
              flags: "-d,--dry",
              description: "启用试运行模式",
            },
          ],
          optionsParser: ({ cliOptions }) => {
            return {
              userConfig: {
                release: {
                  dry: cliOptions.dry,
                },
              },
            };
          },
          task: async ({ finalUserConfig }) => {
            await release({ finalUserConfig });
          },
        },
      })
    )
    .addCommand(
      createCliCommand({
        config: {
          name: "parallel",
          description: "运行多个npm script",
          task: async ({ finalUserConfig }) => {
            await parallel(finalUserConfig);
          },
        },
      })
    )
    .addCommand(
      createCliCommand({
        config: {
          name: WaitCmdName,
          description: "parallel命令利用此命令来达到wait功能",
          options: [
            {
              flags: "-n,--name <string>",
              description: "等待的命令名称",
            },
            {
              flags: "-f,--absoluteFilePath <string>",
              description: "要轮询检查的文件的绝对路径",
            },
            {
              flags: "-tg,--tag <string>",
              description: "等待的函数运行标志",
            },
            {
              flags: "-td,--tempDir <string>",
              description: "临时文件夹",
            },
            {
              flags: "-i,--interval <string>",
              description: "临时文件夹",
            },
            {
              flags: "-tm,--timeout <string>",
              description: "超时时间",
            },
          ],
          optionsParser: ({ cliOptions }) => {
            const { name = "", absoluteFilePath = "" } = cliOptions;
            return {
              taskInput: {
                name: name as string,
                absoluteFilePath: absoluteFilePath as string,
              },
            };
          },
          task: async ({ finalUserConfig, input }) => {
            const { name = "", absoluteFilePath = "" } = input;
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
        },
      })
    );
  program.parse();
};
