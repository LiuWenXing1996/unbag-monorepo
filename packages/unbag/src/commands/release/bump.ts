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
import { useTagPrefix } from "./utils";
import { unSafeFunctionWrapper } from "@/utils/common";
export interface VersionFileFileContent {
  version: string;
}
export interface ReleaseBumpConfig {
  versionFilePath: string;
  versionFilePathResolve: (params: {
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<string>;
  versionFileRead: (params: {
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<VersionFileFileContent>;
  versionFileWrite: (params: {
    finalUserConfig: FinalUserConfig;
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
  versionFilePathResolve: async ({ finalUserConfig }) => {
    const {
      release: {
        bump: { versionFilePath },
      },
      root,
    } = finalUserConfig;
    const path = usePath();
    const absolutePath = path.resolve(root, versionFilePath);
    return absolutePath;
  },
  versionFileRead: async ({ finalUserConfig }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = finalUserConfig;
    const pkgFileAbsolutePath = await versionFilePathResolve({
      finalUserConfig,
    });
    const fs = useFs();
    const content = await fs.readJson<VersionFileFileContent>(
      pkgFileAbsolutePath
    );
    return content;
  },
  versionFileWrite: async ({ finalUserConfig, bumpRes }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = finalUserConfig;
    const pkgFileAbsolutePath = await versionFilePathResolve({
      finalUserConfig,
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
  finalUserConfig: FinalUserConfig;
  data: {
    oldVersion: string;
  };
}): Promise<BumpResult> => {
  const { finalUserConfig, data } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  log.info(message.releaseBumpingByCommits());
  const {
    release: {
      scope,
      preset,
      bump: { releasePre, releasePreTag },
    },
  } = finalUserConfig;
  const tagPrefix = await useTagPrefix({ finalUserConfig });
  const { oldVersion } = data;
  const bumper = new Bumper();
  bumper.loadPreset({
    name: preset.path,
    ...preset.params,
  });
  bumper.tag({
    prefix: tagPrefix,
  });
  let commits = await getCommits(bumper);
  log.debug({
    // commits,
    scope,
    tagPrefix,
  });
  if (scope?.name) {
    commits = commits.filter((e) => e.scope === scope.name);
  }
  log.info(
    message.releaseBumpCommitsList({
      commits,
    })
  );
  if (commits.length > 0) {
    log.info(commits.map((e) => `    ${e.header}`).join("\n"));
  }
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
    log.error(message.releaseBumpCommitsGenUnValidReleaseType());
    throw new Error(message.releaseBumpCommitsGenUnValidReleaseType());
  }
  log.info(
    message.releaseBumpCommitsGenReleaseTypeSuccess({
      releaseType,
    })
  );
  const version = semver.inc(oldVersion, releaseType, releasePreTag);
  if (!version) {
    log.error(message.releaseBumpGenUnValidVersion());
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
export const genVersion = async (params: {
  finalUserConfig: FinalUserConfig;
}): Promise<BumpResult> => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  log.info(message.releaseBumping());
  const {
    release: {
      bump: { versionFileRead, releaseAs, releaseType, releasePreTag },
    },
  } = finalUserConfig;
  const versionFileContent = await unSafeFunctionWrapper(versionFileRead)({
    finalUserConfig,
  });
  if (!versionFileContent) {
    throw new Error(message.releaseBumpNotFoundVersionFile());
  }
  if (!versionFileContent.version) {
    throw new Error(message.release.bump.unValidOldVersion());
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
    finalUserConfig,
    data: {
      oldVersion,
    },
  });
};
export const bump = async (params: {
  finalUserConfig: FinalUserConfig;
}): Promise<BumpResult> => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  const versionResult = await genVersion({
    finalUserConfig,
  });
  log.info(
    message.release.bump.end({
      version: versionResult.version,
      oldVersion: versionResult.oldVersion,
    })
  );
  if (semver.compare(versionResult.oldVersion, versionResult.version) >= 0) {
    throw new Error(message.release.bump.unValidVersionResult());
  }
  const {
    release: {
      dry,
      bump: { versionFileWriteDisable, versionFileWrite },
    },
  } = finalUserConfig;

  let _versionFileWriteDisable = versionFileWriteDisable;

  if (dry) {
    _versionFileWriteDisable = true;
    log.warn(message.release.dry.bump.versionFileWriteDisable());
  }

  if (!_versionFileWriteDisable) {
    await versionFileWrite({
      finalUserConfig,
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
