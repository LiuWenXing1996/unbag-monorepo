import { FinalUserConfig } from "../../utils/config";
import { ReleaseBumpConfig, ReleaseBumpConfigDefault, bump } from "./bump";
import {
  ReleaseChangelogConfig,
  ReleaseChangelogConfigDefault,
  changelog,
} from "./changelog";
import {
  ReleaseCommitConfig,
  ReleaseCommitConfigDefault,
  commit,
} from "./commit";
import { ReleaseTagConfig, ReleaseTagConfigDefault, TagData, tag } from "./tag";
import {
  ReleaseBranchConfig,
  ReleaseBranchConfigDefault,
  branch,
} from "./branch";
import { Command } from "@/core/command";
import { MaybePromise } from "@/utils/types";
import { unSafeFunctionWrapper } from "@/utils/common";
import { useMessage } from "@/utils/message";
export interface ReleaseConfig {
  scope?: {
    name: string;
    check?: (params: {
      name: string;
      finalUserConfig: FinalUserConfig;
    }) => MaybePromise<boolean>;
  };
  branch: ReleaseBranchConfig;
  bump: ReleaseBumpConfig;
  changelog: ReleaseChangelogConfig;
  commit: ReleaseCommitConfig;
  tag: ReleaseTagConfig;
}
export const releaseDefaultConfig: ReleaseConfig = {
  branch: ReleaseBranchConfigDefault,
  bump: ReleaseBumpConfigDefault,
  changelog: ReleaseChangelogConfigDefault,
  commit: ReleaseCommitConfigDefault,
  tag: ReleaseTagConfigDefault,
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
// TODO:继续实现 release 和其子命令
export const release = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const message = useMessage({ locale: finalUserConfig.locale });
  const {
    release: { scope },
  } = finalUserConfig;
  if (scope) {
    const { check, name } = scope;
    if (!check) {
      throw new Error(message.release.scope.undefinedCheck());
    }
    const validName = await unSafeFunctionWrapper(check)({
      name,
      finalUserConfig,
    });
    if (!validName) {
      throw new Error(message.release.scope.unValidScopeName());
    }
  }
  await branch({ finalUserConfig });
  const bumpRes = await bump({ finalUserConfig });
  const changelogRes = await changelog({ finalUserConfig });
  await commit({
    finalUserConfig,
    bumpRes,
    changelogRes,
  });
  await tag({
    finalUserConfig,
    bumpRes,
    changelogRes,
  });
};

export class ReleaseCommand extends Command {
  async task() {
    const { finalUserConfig } = this;
    await release({ finalUserConfig });
  }
}
