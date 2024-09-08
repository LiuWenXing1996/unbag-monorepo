import { FinalUserConfig } from "../../utils/config";
import { useLog } from "../../utils/log";
import { useMessage } from "../../utils/message";
import { MaybePromise } from "../../utils/types";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
export interface ReleaseCommitConfig {
  disable?: boolean;
  message?: string;
  addAll: boolean;
  messageFormat: (params: {
    finalUserConfig: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
    commitFiles: string[];
    addAll: boolean;
  }) => MaybePromise<string>;
  filesCollect: (params: {
    finalUserConfig: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string[]>;
}
export const ReleaseCommitConfigDefault: ReleaseCommitConfig = {
  addAll: false,
  messageFormat: async ({ finalUserConfig, bumpRes }) => {
    const { release } = finalUserConfig;
    const { scope } = release;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
  filesCollect: async ({ finalUserConfig, bumpRes, changelogRes }) => {
    const { release } = finalUserConfig;
    const {
      bump: { versionFileWriteDisable, versionFilePathResolve },
      changelog: {
        fileWriteDisable: changelogFileWriteDisable,
        filePathResolve: changelogFilePathResolve,
      },
    } = release;
    const files: string[] = [];
    if (!versionFileWriteDisable) {
      if (bumpRes.oldVersion !== bumpRes.version) {
        const pkgFileAbsolutePath = await versionFilePathResolve({
          finalUserConfig,
        });
        files.push(pkgFileAbsolutePath);
      }
    }
    if (!changelogFileWriteDisable) {
      if (changelogRes.body) {
        const changelogFileAbsolutePath = await changelogFilePathResolve({
          finalUserConfig,
        });
        files.push(changelogFileAbsolutePath);
      }
    }
    return files;
  },
};
export const commit = async (params: {
  finalUserConfig: FinalUserConfig;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { finalUserConfig, bumpRes, changelogRes } = params;
  const { release } = finalUserConfig;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  const {
    commit: {
      disable,
      message: commitMessage,
      messageFormat,
      filesCollect,
      addAll,
    },
  } = release;
  if (disable) {
    log.warn(message.releaseCommitDisable());
    return;
  }
  log.info(message.releaseCommitting());
  let addFiles: string[] = [];
  if (addAll) {
    log.info(message.releaseCommitAll());
  } else {
    log.info(message.releaseCommitFileCollecting());
    addFiles = await filesCollect({
      finalUserConfig,
      bumpRes,
      changelogRes,
    });
    if (addFiles.length <= 0) {
      log.warn(message.releaseCommitFilesEmpty());
      return;
    }
    log.info(
      message.releaseCommitFilesInfo({
        files: [...addFiles],
      })
    );
  }
  const finalCommitMsg =
    commitMessage ||
    (await messageFormat({
      finalUserConfig,
      bumpRes,
      changelogRes,
      commitFiles: {
        ...addFiles,
      },
      addAll,
    }));
  if (!finalCommitMsg) {
    throw new Error(message.releaseCommitMessageUndefined());
  }
  log.info(
    message.releaseCommitMessageInfo({
      message: finalCommitMsg,
    })
  );
  if (addAll) {
    await $`git add .`;
  } else {
    await $`git add ${[...addFiles]}`;
  }
  await $`git commit -m ${finalCommitMsg}`;
  log.info(message.releaseCommitSuccess());
};
