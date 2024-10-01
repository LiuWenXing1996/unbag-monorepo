import { useMessage, usePath, useLog } from "unbag";
import { CommitConfig, loadCommitLintConfig } from "./config";
import inquirer from "inquirer";
import type { FinalUserConfig } from "unbag";
import { useCreateRequire, useGit } from "./utils";
const require = useCreateRequire()(import.meta.url);

const useCommitizenCommit = async (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  const path = usePath();
  const log = useLog({ finalUserConfig });
  const commitizenPath = require.resolve("commitizen");
  log.debug({ commitizenPath });
  const commitizenCommitJsFile = path.resolve(commitizenPath, "../commitizen");
  const process = require(commitizenCommitJsFile);
  return process.commit;
};

export const gitCz = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
}) => {
  const { finalUserConfig } = params;
  const czCommit = await useCommitizenCommit({ finalUserConfig });
  const path = usePath();
  const log = useLog({ finalUserConfig });
  const czCommitlintPath = require.resolve("@commitlint/cz-commitlint");
  const processJsFile = path.resolve(czCommitlintPath, "../lib/Process.js");
  const process = (await import(processJsFile)).default;
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const prompter = (inquirerIns, commit) => {
    process(lintConfig.rules, lintConfig.prompt, inquirerIns).then(commit);
  };
  log.debug({ lintConfig });
  const message = useMessage({ locale: finalUserConfig.base.locale });
  const git = useGit();
  const gitRootPath = await git.gitRootPathGet();
  const stageFiles = await git.stageFilesGet();
  log.debug({ stageFiles, gitRootPath });
  if (stageFiles.length <= 0) {
    throw new Error(message.commit.branch.stageFiles.empty());
  }
  czCommit(
    inquirer,
    gitRootPath,
    prompter,
    {
      disableAppendPaths: true,
      emitData: true,
      quiet: finalUserConfig.base.log.disabled,
    },
    function (error) {
      if (error) {
        throw error;
      }
    }
  );
};
