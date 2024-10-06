// import { FinalUserConfig } from "@/utils/config";
import {
  type FinalUserConfig,
  unSafeObjectShallowWrapper,
  useLog,
  useMessage,
} from "unbag";
import { CommitConfig, loadCommitLintConfig } from "./config";
import lint from "@commitlint/lint";

export const commitLint = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
  message: string;
}) => {
  const { finalUserConfig } = params;
  const { message } = unSafeObjectShallowWrapper(params);
  const log = useLog({ finalUserConfig });
  const messageMap = useMessage({ locale: finalUserConfig.base.locale });
  if (!message) {
    throw new Error(messageMap.commit.lint.error({ message: message || "" }));
  }
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const report = await lint(message, lintConfig.rules, lintConfig);
  if (!report.valid) {
    report.errors.map((e) => {
      log.error(`${e.message}`);
    });
    report.warnings.map((e) => {
      log.warn(`${e.message}`);
    });
    throw new Error(messageMap.commit.lint.error({ message }));
  }
  log.info(messageMap.commit.lint.success({ message }));
};

// export class CommitLintCommand extends Command<string> {
//   async task(message: string) {
//     const { finalUserConfig } = this;
//     await commitLint({ finalUserConfig, message });
//   }
// }
