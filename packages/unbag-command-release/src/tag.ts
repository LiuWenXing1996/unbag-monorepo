import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";
import { useTagPrefix } from "./utils";
import { ReleaseConfig } from ".";
import { FinalUserConfig, useLog } from "unbag";
import { MaybePromise } from "./types";
import i18next from "i18next";
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
  log.info(i18next.t("release.tag.processing"));
  const {
    commandConfig: {
      dry,
      tag: { force, messageFormat, disable },
    },
  } = finalUserConfig;
  const prefix = await useTagPrefix({ finalUserConfig });
  log.info(i18next.t("release.tag.prefix", { prefix }));
  const tagName = `${prefix}${bumpRes.version}`;
  log.info(i18next.t("release.tag.name", { name: tagName }));
  const tagMessage = await messageFormat({
    finalUserConfig,
    changelogRes,
    bumpRes,
  });
  log.info(i18next.t("release.tag.message", { message: tagMessage }));
  let _disable = disable;
  if (dry) {
    _disable = true;
    log.warn(i18next.t("release.dry.tag.disable"));
  }
  if (_disable) {
    log.warn(i18next.t("release.tag.disable"));
    return;
  }
  if (force) {
    log.warn(i18next.t("release.tag.force"));
  }
  await $`git tag -a ${tagName} ${force ? ["-f"] : []} -m ${tagMessage}`;
  log.info(
    i18next.t("release.tag.addSuccess", {
      tagMessage,
      tagName,
    })
  );
};
