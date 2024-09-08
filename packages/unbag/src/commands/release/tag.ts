import { FinalUserConfig } from "@/utils/config";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { MaybePromise } from "@/utils/types";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
import { useTagPrefix } from "./utils";
export interface TagData {
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}
export interface ReleaseTagConfig {
  genPrefix: (params: {
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<string>;
  force?: boolean;
  disable?: boolean;
  messageFormat: (params: {
    finalUserConfig: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string>;
}
export const ReleaseTagConfigDefault: ReleaseTagConfig = {
  genPrefix: ({ finalUserConfig }) => {
    const {
      release: { scope },
    } = finalUserConfig;
    if (scope?.name) {
      return `${scope.name}v`;
    }
    return "v";
  },
  messageFormat: ({ finalUserConfig, changelogRes, bumpRes }) => {
    const { release } = finalUserConfig;
    const { scope } = release;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
};
export const tag = async (params: {
  finalUserConfig: FinalUserConfig;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { finalUserConfig, bumpRes, changelogRes } = params;
  const { release } = finalUserConfig;
  const {
    tag: { force, messageFormat, disable },
  } = release;
  const prefix = await useTagPrefix({ finalUserConfig });
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  log.info(message.releaseTagging());
  if (disable) {
    log.warn(message.releaseTagDisable());
    return;
  }
  const tagName = `${prefix}${bumpRes.version}`;
  const tagMessage = await messageFormat({
    finalUserConfig,
    changelogRes,
    bumpRes,
  });
  await $`git tag -a ${tagName} ${force ? ["-f"] : []} -m ${tagMessage}`;
  log.info(
    message.releaseTagAddSuccess({
      tagMessage,
      tagName,
    })
  );

  // TODO:继续实现 tag
  /**
   * 添加 log
   * 添加 自动的 git tag push ?
   */
};
