import { FinalUserConfig, useLog, useMessage } from "unbag";
import { ReleaseConfig } from ".";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
import { MaybePromise } from "./types";
export interface ReleaseCommitConfig {
  disable?: boolean;
  message?: string;
  addAll: boolean;
  messageFormat: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
    commitFiles: string[];
    addAll: boolean;
  }) => MaybePromise<string>;
  filesCollect: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string[]>;
}
export const ReleaseCommitConfigDefault: ReleaseCommitConfig = {
  addAll: false,
  messageFormat: async ({ finalUserConfig, bumpRes }) => {
    const { commandConfig: release } = finalUserConfig;
    const { scope } = release;
    return `release${scope?.name ? `(${scope.name})` : ``}: ${
      bumpRes?.version
    }`;
  },
  filesCollect: async ({ finalUserConfig, bumpRes, changelogRes }) => {
    const { commandConfig: release } = finalUserConfig;
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
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { finalUserConfig, bumpRes, changelogRes } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.base.locale,
  });
  log.info(message.release.commit.processing());
  const {
    commandConfig: {
      dry,
      commit: {
        disable,
        message: commitMessage,
        messageFormat,
        filesCollect,
        addAll,
      },
    },
  } = finalUserConfig;
  let addFiles: string[] = [];
  if (addAll) {
    log.info(message.release.commit.willCommitAll());
  } else {
    log.info(message.release.commit.fileCollecting());
    addFiles = await filesCollect({
      finalUserConfig,
      bumpRes,
      changelogRes,
    });
    if (addFiles.length <= 0) {
      log.warn(message.release.commit.commitFilesEmpty());
      return;
    }
    log.info(
      message.release.commit.commitFilesInfo({
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
    throw new Error(message.release.commit.messageUndefined());
  }
  log.info(
    message.release.commit.messageInfo({
      message: finalCommitMsg,
    })
  );
  let _disable = disable;
  if (dry) {
    _disable = true;
    log.warn(message.release.dry.commit.disable());
  }
  if (_disable) {
    log.warn(message.release.commit.disable());
    return;
  }
  if (addAll) {
    await $`git add .`;
  } else {
    await $`git add ${[...addFiles]}`;
  }
  await $`git commit -m ${finalCommitMsg}`;
  log.info(message.releaseCommitSuccess());
};
