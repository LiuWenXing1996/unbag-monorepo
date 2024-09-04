import { Command, Option } from "commander";
import { transform, TransformCommand } from "../commands/transform";
import { clean } from "../commands/clean";
import { parallel } from "../commands/parallel";
import {
  CheckWaitFileResult,
  WaitCmdName,
  checkWaitFile,
} from "../commands/parallel/wait";
import {
  resolveUserConfig,
  mergeDefaultConfig,
  useDefaultConfig,
  mergeConfig,
  UserConfigOptional,
  deepFreezeConfig,
} from "./config";
import { ReleaseCommand } from "../commands/release";
import { CommitCommand } from "../commands/commit";
import { AbsolutePath } from "./path";
import path from "node:path";
import _ from "lodash";
import { Locale } from "./common";
import { commitLint, CommitLintCommand } from "@/commands/commit/lint";
import { resolveUserConfigFromCli } from "@/core/user-config";
class CustomCliCommand extends Command {
  addOptions(options: Option[]) {
    for (const option of options) {
      this.addOption(option);
    }
    return this;
  }
}
const getCommonOptions = () => {
  const options: Option[] = [
    new Option("-c,--config <string>", "配置文件路径"),
    new Option("-r,--root <string>", "根路径"),
    new Option("-l,--local <string>", "本地化语言"),
  ];
  return options;
};
const resolveCliUserConfig = async (options: {
  config?: string;
  root?: string;
  locale?: Locale;
  overrides?: UserConfigOptional;
}) => {
  const { config, root, overrides, locale } = options;
  const defaultConfig = useDefaultConfig();
  const absoluteRoot = new AbsolutePath({
    content: path.resolve(root || defaultConfig.root),
  });
  const userConfig = await resolveUserConfig({
    root: absoluteRoot,
    filePath: config,
    locale: locale || defaultConfig.locale,
  });
  let mergedConfig = mergeDefaultConfig(userConfig);
  mergedConfig = mergeConfig(mergedConfig, {
    root: absoluteRoot.content,
  });
  mergedConfig = mergeConfig(mergedConfig, {
    ...overrides,
  });
  const freezedConfig = deepFreezeConfig(mergedConfig);
  return freezedConfig;
};
export const read = () => {
  const program = new CustomCliCommand();
  program.name("unbag").description("unbag CLI").version("0.8.0");
  program
    .addCommand(
      new CustomCliCommand()
        .name("transform")
        .description("转换文件")
        .addOptions(getCommonOptions())
        .option("-w,--watch", "启用观察模式")
        .action(async (options) => {
          const userConfig = await resolveUserConfigFromCli({
            cliOptions: options,
            overrides: {
              transform: {
                watch: options.watch,
              },
            },
          });
          const cmd = new TransformCommand(userConfig);
          await cmd.run();
        })
    )
    .addCommand(
      new CustomCliCommand()
        .name("commit")
        .description("提交文件")
        .addOptions(getCommonOptions())
        .action(async (options) => {
          const userConfig = await resolveUserConfigFromCli({
            cliOptions: options,
          });
          const cmd = new CommitCommand(userConfig);
          await cmd.run();
        })
        .addCommand(
          new CustomCliCommand()
            .name("lint")
            .description("校验提交信息")
            .addOptions(getCommonOptions())
            .option("-m,--message <string>", "信息")
            .action(async (options) => {
              const { message } = options;
              const userConfig = await resolveUserConfigFromCli({
                cliOptions: options,
              });
              const cmd = new CommitLintCommand(userConfig);
              await cmd.run(message);
            })
        )
    )
    .addCommand(
      new CustomCliCommand()
        .name("release")
        .description("release")
        .addOptions(getCommonOptions())
        .action(async (options) => {
          const userConfig = await resolveUserConfigFromCli({
            cliOptions: options,
          });
          const cmd = new ReleaseCommand(userConfig);
          await cmd.run();
        })
    )
    .addCommand(
      new CustomCliCommand()
        .name("clean")
        .action(() => {
          // clean();
          console.log("clean");
        })
        .addCommand(
          new CustomCliCommand().name("cleansss").action(() => {
            console.log("cleansss");
          })
        )
    )
    .addCommand(
      new CustomCliCommand()
        .name("parallel")
        .description("运行多个npm script")
        .option("-c,--config <string>", "配置文件路径")
        .addOptions(getCommonOptions())
        .action(async (options) => {
          const cliUserConfig = await resolveCliUserConfig(options);
          const finalConfig = mergeConfig(cliUserConfig, {});
          await parallel(finalConfig);
        })
    )
    .addCommand(
      new CustomCliCommand()
        .name(WaitCmdName)
        .description("parallel命令利用此命令来达到wait功能")
        .option("-n,--name <string>", "等待的命令名称")
        .option("-f,--absoluteFilePath <string>", "要轮询检查的文件的绝对路径")
        .option("-tg,--tag <string>", "等待的函数运行标志")
        .option("-td,--tempDir <string>", "临时文件夹")
        .option("-i,--interval <string>", "检测间隔")
        .option("-tm,--timeout <string>", "超时时间")
        .action(async (options) => {
          const { name = "", absoluteFilePath = "" } = options;
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
        })
    );
  program.parse();
};
