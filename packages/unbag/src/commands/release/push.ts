// TODO:实现 git push
import { $ } from "execa";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { ReleaseConfig } from ".";
import { FinalUserConfig } from "@/core/user-config";

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
  const message = useMessage({ locale: finalUserConfig.base.locale });
  const {
    commandConfig: {
      dry,
      push: { disable, force },
    },
  } = finalUserConfig;
  log.info(message.release.push.processing());
  let _disable = disable;
  if (dry) {
    _disable = true;
    log.warn(message.release.dry.push.disable());
  }

  if (_disable) {
    log.warn(message.release.push.disable());
    return;
  }

  try {
    if (force) {
      log.warn(message.release.push.disable());
    }
    await $`git push --follow-tags ${force ? ["-f"] : []}`;
  } catch (err) {
    log.warn(message.release.push.fail());
    throw err;
  }
  log.info(message.release.push.success());
};
