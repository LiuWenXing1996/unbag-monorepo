import { MaybePromise } from "../../utils/types";
import { FinalUserConfig } from "../../utils/config";
import { ReleaseBumpConfig, ReleaseBumpConfigDefault, bump } from "./bump";
import { ReleaseChangelogConfig, ReleaseChangelogConfigDefault, changelog } from "./changelog";
import { ReleaseCommitConfig, ReleaseCommitConfigDefault, commit } from "./commit";
import { ReleaseTagConfig, ReleaseTagConfigDefault, TagData, tag } from "./tag";
import { ReleaseBranchConfig, ReleaseBranchConfigDefault, branch } from "./branch";
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
  tag: ReleaseTagConfigDefault
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
export const release = async (config: FinalUserConfig) => {
  await branch({
    config
  });
  const bumpRes = await bump({
    config
  });
  const changelogRes = await changelog({
    config
  });
  await commit({
    config,
    bumpRes,
    changelogRes
  });
  await tag({
    config,
    bumpRes,
    changelogRes
  });
};