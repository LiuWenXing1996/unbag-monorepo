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
export interface ReleaseConfig {
  scope?: string;
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
export const release = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  await branch({
    config: finalUserConfig,
  });
  const bumpRes = await bump({
    config: finalUserConfig,
  });
  const changelogRes = await changelog({
    config: finalUserConfig,
  });
  await commit({
    config: finalUserConfig,
    bumpRes,
    changelogRes,
  });
  await tag({
    config: finalUserConfig,
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
