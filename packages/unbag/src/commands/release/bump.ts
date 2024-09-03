import semver, { type ReleaseType } from "semver";
import { useMessage } from "../../utils/message";
import type { Commit } from "conventional-commits-parser";
import type { BumperRecommendation } from "conventional-recommended-bump";
import { FinalUserConfig } from "../../utils/config";
import { MaybePromise } from "../../utils/types";
import { usePath } from "../../utils/path";
import { useFs } from "@/utils/fs";
import { useLog } from "@/utils/log";
import { Bumper } from "conventional-recommended-bump";
import { resolvePresetPath } from "./utils";
export interface VersionFileFileContent {
  version: string;
}
export interface ReleaseBumpConfig {
  versionFilePath: string;
  versionFilePathResolve: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<string>;
  versionFileRead: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<VersionFileFileContent>;
  versionFileWrite: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
  }) => MaybePromise<void>;
  versionFileWriteDisable?: boolean;
  releaseAs?: string;
  releaseType?: ReleaseType;
  releasePre?: boolean;
  releasePreTag?: string;
}
export const ReleaseBumpConfigDefault: ReleaseBumpConfig = {
  versionFilePath: "package.json",
  versionFilePathResolve: async ({ config }) => {
    const {
      release: {
        bump: { versionFilePath },
      },
      root,
    } = config;
    const path = usePath();
    const absolutePath = path.resolve(root, versionFilePath);
    return absolutePath;
  },
  versionFileRead: async ({ config }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = config;
    const pkgFileAbsolutePath = await versionFilePathResolve({
      config,
    });
    const fs = useFs();
    const content = await fs.readJson<VersionFileFileContent>(
      pkgFileAbsolutePath
    );
    return content;
  },
  versionFileWrite: async ({ config, bumpRes }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = config;
    const pkgFileAbsolutePath = await versionFilePathResolve({
      config,
    });
    const version = bumpRes?.version;
    if (!version) {
      return;
    }
    if (version === bumpRes.oldVersion) {
      return;
    }
    const fs = useFs();
    await fs.modifyJson<VersionFileFileContent>(
      pkgFileAbsolutePath,
      (value) => {
        return {
          ...value,
          version,
        };
      }
    );
  },
};
export const VERSIONS = ["major", "minor", "patch"] as const;
export const getCommits = async (bumper: Bumper) => {
  //@ts-ignore
  const commitsStream = bumper.commitsGetter();
  const commits: Commit[] = [];
  let commit: Commit;
  for await (commit of commitsStream) {
    commits.push(commit);
  }
  return commits;
};
export const isReleaseType = (value: string): value is ReleaseType => {
  return semver.RELEASE_TYPES.includes(value as any);
};
export const isInPrerelease = (version: string) => {
  return Array.isArray(semver.prerelease(version));
};
export const genVersionByCommits = async (params: {
  config: FinalUserConfig;
  data: {
    oldVersion: string;
  };
}): Promise<BumpResult> => {
  const { config, data } = params;
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
  });
  log.info(message.releaseBumpingByCommits());
  const {
    release: {
      scope,
      tag: { prefix: tagPrefix },
      bump: { releasePre, releasePreTag },
    },
  } = config;
  const { oldVersion } = data;
  const bumper = new Bumper();
  const presetPath = resolvePresetPath();
  bumper.loadPreset(presetPath);
  bumper.tag({
    prefix: tagPrefix,
  });
  let commits = await getCommits(bumper);
  if (scope) {
    commits = commits.filter((e) => e.scope === scope);
  }
  log.info(
    message.releaseBumpCommitsList({
      commits,
    })
  );
  if (commits.length <= 0) {
    log.warn(
      message.releaseBumpCommitsNoData({
        oldVersion,
      })
    );
    return {
      version: oldVersion,
      oldVersion,
    };
  }
  // @ts-ignore
  const result = (await bumper.whatBump(commits)) as
    | BumperRecommendation
    | undefined;
  let releaseType: string | undefined = undefined;
  if (result && typeof result.level === "number") {
    releaseType = VERSIONS[result.level];
  }
  if (!releaseType) {
    throw new Error(message.releaseBumpCommitsGenUnValidReleaseType());
  }
  if (releasePre) {
    if (isInPrerelease(oldVersion)) {
      releaseType = "prerelease";
    } else {
      releaseType = `pre${releaseType}`;
    }
  }
  if (!isReleaseType(releaseType)) {
    throw new Error(message.releaseBumpCommitsGenUnValidReleaseType());
  }
  log.info(
    message.releaseBumpCommitsGenReleaseTypeSuccess({
      releaseType,
    })
  );
  const version = semver.inc(oldVersion, releaseType, releasePreTag);
  if (!version) {
    throw new Error(message.releaseBumpGenUnValidVersion());
  }
  return {
    version,
    oldVersion,
    releaseType,
    commits,
  };
};
export interface BumpResult {
  oldVersion: string;
  version: string;
  releaseType?: ReleaseType;
  commits?: Commit[];
}
export const genVersion = async ({
  config,
}: {
  config: FinalUserConfig;
}): Promise<BumpResult> => {
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
  });
  log.info(message.releaseBumping());
  const {
    release: {
      bump: { versionFileRead, releaseAs, releaseType, releasePreTag },
    },
  } = config;
  const versionFileContent = await versionFileRead({
    config,
  });
  if (!versionFileContent) {
    throw new Error(message.releaseBumpNotFoundVersionFile());
  }
  const oldVersion = versionFileContent.version;
  log.info(
    message.releaseBumpOldVersion({
      oldVersion,
    })
  );
  if (releaseAs) {
    if (!semver.valid(releaseAs)) {
      throw new Error(message.releaseBumpReleaseAsUnValid(releaseAs));
    }
    log.info(
      message.releaseBumpOldVersion({
        oldVersion,
      })
    );
    return {
      version: releaseAs,
      oldVersion,
    };
  }
  if (releaseType) {
    if (!isReleaseType(releaseType)) {
      throw new Error(message.releaseBumpReleaseTypeUnValid(releaseType));
    }
    const version = semver.inc(oldVersion, releaseType, releasePreTag);
    if (!version) {
      throw new Error(message.releaseBumpGenUnValidVersion());
    }
    log.info(
      message.releaseBumpVersionByReleaseType({
        releaseType,
        version,
      })
    );
    return {
      version,
      oldVersion,
      releaseType,
    };
  }
  return await genVersionByCommits({
    config,
    data: {
      oldVersion,
    },
  });
};
export const bump = async ({
  config,
}: {
  config: FinalUserConfig;
}): Promise<BumpResult> => {
  const versionResult = await genVersion({
    config,
  });
  const {
    release: {
      bump: { versionFileWriteDisable, versionFileWrite },
    },
  } = config;
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
  });
  if (!versionFileWriteDisable) {
    await versionFileWrite({
      config,
      bumpRes: versionResult,
    });
    log.info(
      message.releaseBumpVersionFileWriteSuccess({
        version: versionResult.version,
      })
    );
  } else {
    log.warn(message.releaseBumpVersionFileWriteDisable());
  }
  return versionResult;
};
