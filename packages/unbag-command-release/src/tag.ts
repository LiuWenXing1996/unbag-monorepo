import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { MaybePromise } from "@/utils/types";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
import { useTagPrefix } from "./utils";
import { FinalUserConfig } from "@/core/user-config";
import { ReleaseConfig } from ".";
export interface TagData {
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}
export interface ReleaseTagConfig {
  genPrefix: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
  }) => MaybePromise<string>;
  force?: boolean;
  disable?: boolean;
  messageFormat: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string>;
}
export const ReleaseTagConfigDefault: ReleaseTagConfig = {
  genPrefix: ({ finalUserConfig }) => {
    const {
      commandConfig: { scope },
    } = finalUserConfig;
    if (scope?.name) {
      return `${scope.name}@`;
    }
    return "v";
  },
  messageFormat: ({ finalUserConfig, changelogRes, bumpRes }) => {
    const { commandConfig: release } = finalUserConfig;
    const { scope } = release;
    return `release${scope?.name ? `(${scope.name})` : ``}: ${
      bumpRes?.version
    }`;
  },
};
export const tag = async (params: {
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { finalUserConfig, bumpRes, changelogRes } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.base.locale,
  });
  log.info(message.release.tag.processing());
  const {
    commandConfig: {
      dry,
      tag: { force, messageFormat, disable },
    },
  } = finalUserConfig;
  const prefix = await useTagPrefix({ finalUserConfig });
  log.info(message.release.tag.prefix({ prefix }));
  const tagName = `${prefix}${bumpRes.version}`;
  log.info(message.release.tag.name({ name: tagName }));
  const tagMessage = await messageFormat({
    finalUserConfig,
    changelogRes,
    bumpRes,
  });
  log.info(message.release.tag.message({ message: tagMessage }));
  let _disable = disable;
  if (dry) {
    _disable = true;
    log.warn(message.release.dry.tag.disable());
  }
  if (_disable) {
    log.warn(message.releaseTagDisable());
    return;
  }
  if (force) {
    log.warn(message.release.tag.force());
  }
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
