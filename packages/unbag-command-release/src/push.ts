import { $ } from "execa";
import { ReleaseConfig } from ".";
import { FinalUserConfig, useLog } from "unbag";
import i18next from "i18next";

export interface ReleasePushConfig {
  disable?: boolean;
  force?: boolean;
}

export const ReleasePushConfigDefault: ReleasePushConfig = {};

export const push = async (params: {
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
}) => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const {
    commandConfig: {
      dry,
      push: { disable, force },
    },
  } = finalUserConfig;
  log.info(i18next.t("release.push.processing"));
  let _disable = disable;
  if (dry) {
    _disable = true;
    log.warn(i18next.t("release.dry.push.disable"));
  }

  if (_disable) {
    log.warn(i18next.t("release.push.disable"));
    return;
  }

  try {
    if (force) {
      log.warn(i18next.t("release.push.force"));
    }
    await $`git push --follow-tags ${force ? ["-f"] : []}`;
  } catch (err) {
    log.warn(i18next.t("release.push.fail"));
    throw err;
  }
  log.info(i18next.t("release.push.success"));
};
