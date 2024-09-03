import { Command, Option } from "commander";
import { transform } from "../commands/transform";
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
import { release } from "../commands/release";
import { commit } from "../commands/commit";
import { AbsolutePath } from "./path";
import path from "node:path";
import _ from "lodash";
import { Locale } from "./common";
import { commitlint } from "@/commands/commit/lint";
class CustomCommand extends Command {
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
  const program = new CustomCommand();
  program.name("unbag").description("unbag CLI").version("0.8.0");
  program
    .addCommand(
      new CustomCommand()
        .name("transform")
        .description("转换文件")
        .addOptions(getCommonOptions())
        .option("-w,--watch", "启用观察模式")
        .action(async (options) => {
          const cliUserConfig = await resolveCliUserConfig(options);
          const finalUserConfig = mergeConfig(cliUserConfig, {
            transform: {
              watch: options.watch,
            },
          });
          await transform({ finalUserConfig });
        })
    )
    .addCommand(
      new CustomCommand().name("clean").action(() => {
        clean();
      })
    )
    .addCommand(
      new CustomCommand()
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
      new CustomCommand()
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
    )
    .addCommand(
      new CustomCommand()
        .name("release")
        .description("release")
        .addOptions(getCommonOptions())
        .action(async (options) => {
          const cliUserConfig = await resolveCliUserConfig(options);
          const finalConfig = mergeConfig(cliUserConfig, {});
          await release(finalConfig);
        })
    )
    .addCommand(
      new CustomCommand()
        .name("commit")
        .description("commit")
        .addOptions(getCommonOptions())
        .action(async (options) => {
          const cliUserConfig = await resolveCliUserConfig(options);
          const finalConfig = mergeConfig(cliUserConfig, {});
          await commit({
            finalUserConfig: finalConfig,
          });
        })
    )
    .addCommand(
      new CustomCommand()
        .name("commitlint")
        .description("commitlint")
        .addOptions(getCommonOptions())
        .option("-m,--message <string>", "信息")
        .action(async (options) => {
          const cliUserConfig = await resolveCliUserConfig(options);
          const finalConfig = mergeConfig(cliUserConfig, {});
          const { message } = options;
          await commitlint({
            finalUserConfig: finalConfig,
            message,
          });
        })
    );
  program.parse();
};
