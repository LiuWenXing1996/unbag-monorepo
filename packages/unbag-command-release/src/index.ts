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
import { useDefaultReleasePresetPath } from "./utils";
import { push, ReleasePushConfig, ReleasePushConfigDefault } from "./push";
import {
  CommandHelper,
  defineCommand,
  FinalUserConfig,
  unSafeFunctionWrapper,
  useLog,
} from "unbag";
import { MaybePromise } from "./types";
import { initI18n } from "./i18n";
import i18next from "i18next";
export interface ReleaseConfig {
  dry?: boolean;
  scope?: {
    name: string;
    check?: (params: {
      name: string;
      finalUserConfig: FinalUserConfig<ReleaseConfig>;
    }) => MaybePromise<boolean>;
  };
  preset: {
    path: string;
    params: object;
  };
  branch: ReleaseBranchConfig;
  bump: ReleaseBumpConfig;
  changelog: ReleaseChangelogConfig;
  commit: ReleaseCommitConfig;
  tag: ReleaseTagConfig;
  push: ReleasePushConfig;
}
export const releaseDefaultConfig: ReleaseConfig = {
  preset: {
    path: useDefaultReleasePresetPath(),
    params: {},
  },
  branch: ReleaseBranchConfigDefault,
  bump: ReleaseBumpConfigDefault,
  changelog: ReleaseChangelogConfigDefault,
  commit: ReleaseCommitConfigDefault,
  tag: ReleaseTagConfigDefault,
  push: ReleasePushConfigDefault,
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
// TODO:继续实现 release 和其子命令
export const release = async (params: {
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
  commandHelper: CommandHelper;
}) => {
  const { finalUserConfig, commandHelper } = params;
  await initI18n(commandHelper.locale);
  const log = useLog({ finalUserConfig });
  const {
    commandConfig: { dry, scope },
  } = finalUserConfig;
  if (dry) {
    log.warn(i18next.t("release.dry.tip"));
  }
  if (scope) {
    const { check, name } = scope;
    if (!check) {
      throw new Error(i18next.t("release.scope.undefinedCheck"));
    }
    const validName = await unSafeFunctionWrapper(check)({
      name,
      finalUserConfig,
    });
    if (!validName) {
      throw new Error(i18next.t("release.scope.unValidScopeName"));
    }
  }
  await branch({ finalUserConfig });
  const bumpRes = await bump({ finalUserConfig });
  const changelogRes = await changelog({ finalUserConfig, bumpRes });
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
  await push({
    finalUserConfig,
  });
};

export const ReleaseCommand = defineCommand({
  defaultConfig: () => {
    return releaseDefaultConfig;
  },
  name: "release",
  description:
    "执行一系列的发布操作，包含生成版本号、生成发布日志、提交发布文件、添加 git 标签等动作",
  options: {
    dry: {
      alias: "d",
      description: "启用试运行模式",
      type: "boolean",
    },
  },
  configParse: ({ args }) => {
    return {
      dry: args.dry,
    };
  },
  run: async ({ finalUserConfig, helper }) => {
    await release({ finalUserConfig, commandHelper: helper });
  },
});
