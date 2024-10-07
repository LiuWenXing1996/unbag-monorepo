// import { FinalUserConfig } from "@/utils/config";
import {
  CommandHelper,
  type FinalUserConfig,
  unSafeObjectShallowWrapper,
  useLog,
} from "unbag";
import { CommitConfig, loadCommitLintConfig } from "./config";
import lint from "@commitlint/lint";
import i18next from "i18next";
import { initI18n } from "./i18n";

export const commitLint = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
  message: string;
  commandHelper: CommandHelper;
}) => {
  const { finalUserConfig, commandHelper } = params;
  await initI18n(commandHelper.locale);
  const { message } = unSafeObjectShallowWrapper(params);
  const log = useLog({ finalUserConfig });
  if (!message) {
    throw new Error(i18next.t("commit.lint.error", { message: message || "" }));
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
    throw new Error(i18next.t("commit.lint.error", { message }));
  }
  log.info(i18next.t("commit.lint.success", { message }));
};
