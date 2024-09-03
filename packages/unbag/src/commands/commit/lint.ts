import { FinalUserConfig } from "@/utils/config";
import { loadCommitLintConfig } from "./config";
import lint from "@commitlint/lint";

export const commitlint = async (params: {
  finalUserConfig: FinalUserConfig;
  message: string;
}) => {
  const { finalUserConfig, message } = params;
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const report = await lint(message, lintConfig.rules, lintConfig);
  if (!report.valid) {
    throw new Error("校验失败");
  }
};
