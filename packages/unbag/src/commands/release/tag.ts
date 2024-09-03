import { FinalUserConfig } from "../../utils/config";
import { useLog } from "../../utils/log";
import { useMessage } from "../../utils/message";
import { MaybePromise } from "../../utils/types";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
export interface TagData {
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}
export interface ReleaseTagConfig {
  prefix: string;
  force?: boolean;
  disable?: boolean;
  messageFormat: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string>;
}
export const ReleaseTagConfigDefault: ReleaseTagConfig = {
  prefix: "v",
  messageFormat: ({ config, changelogRes, bumpRes }) => {
    const { release } = config;
    const { scope } = release;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
};
export const tag = async ({
  config,
  changelogRes,
  bumpRes,
}: {
  config: FinalUserConfig;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { release } = config;
  const {
    tag: { prefix, force, messageFormat, disable },
  } = release;
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
  });
  log.info(message.releaseTagging());
  if (disable) {
    log.warn(message.releaseTagDisable());
    return;
  }
  const tagName = `${prefix}${bumpRes.version}`;
  const tagMessage = await messageFormat({
    config,
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
