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
    config: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
    commitFiles: string[];
    addAll: boolean;
  }) => MaybePromise<string>;
  filesCollect: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string[]>;
}
export const ReleaseCommitConfigDefault: ReleaseCommitConfig = {
  addAll: false,
  messageFormat: async ({ config, bumpRes }) => {
    const { release } = config;
    const { scope } = release;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
  filesCollect: async ({ config, bumpRes, changelogRes }) => {
    const { release } = config;
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
          config,
        });
        files.push(pkgFileAbsolutePath);
      }
    }
    if (!changelogFileWriteDisable) {
      if (changelogRes.body) {
        const changelogFileAbsolutePath = await changelogFilePathResolve({
          config,
        });
        files.push(changelogFileAbsolutePath);
      }
    }
    return files;
  },
};
export const commit = async ({
  config,
  bumpRes,
  changelogRes,
}: {
  config: FinalUserConfig;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { release } = config;
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
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
      config,
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
      config,
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
