import semver, { type ReleaseType } from "semver";
import type { Commit } from "conventional-commits-parser";
import type { BumperRecommendation } from "conventional-recommended-bump";
import {
  useLog,
  useFs,
  FinalUserConfig,
  usePath,
  unSafeFunctionWrapper,
} from "unbag";
import { Bumper } from "conventional-recommended-bump";
import { useTagPrefix } from "./utils";
import { ReleaseConfig } from ".";
import { MaybePromise } from "./types";
import i18next from "i18next";
export interface VersionFileFileContent {
  version: string;
}
export interface ReleaseBumpConfig {
  versionFilePath: string;
  versionFilePathResolve: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
  }) => MaybePromise<string>;
  versionFileRead: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
  }) => MaybePromise<VersionFileFileContent>;
  versionFileWrite: (params: {
    finalUserConfig: FinalUserConfig<ReleaseConfig>;
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
      commandConfig: {
        bump: { versionFilePath },
      },
      base: { root },
    } = finalUserConfig;
    const path = usePath();
    const absolutePath = path.resolve(root, versionFilePath);
    return absolutePath;
  },
  versionFileRead: async ({ finalUserConfig }) => {
    const {
      commandConfig: {
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
      commandConfig: {
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
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
  data: {
    oldVersion: string;
  };
}): Promise<BumpResult> => {
  const { finalUserConfig, data } = params;
  const log = useLog({ finalUserConfig });
  log.info(i18next.t("release.bump.byCommits"));
  const {
    commandConfig: {
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
    i18next.t("release.bump.commitsList", { commitsLength: commits.length })
  );
  if (commits.length > 0) {
    log.info(commits.map((e) => `    ${e.header}`).join("\n"));
  }
  if (commits.length <= 0) {
    log.warn(i18next.t("release.bump.commitsNoData", { oldVersion }));
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
    throw new Error(i18next.t("release.bump.commitsGenUnValidReleaseType"));
  }
  if (releasePre) {
    if (isInPrerelease(oldVersion)) {
      releaseType = "prerelease";
    } else {
      releaseType = `pre${releaseType}`;
    }
  }
  if (!isReleaseType(releaseType)) {
    throw new Error(i18next.t("release.bump.commitsGenUnValidReleaseType"));
  }
  log.info(
    i18next.t("release.bump.commitsGenReleaseTypeSuccess", { releaseType })
  );
  const version = semver.inc(oldVersion, releaseType, releasePreTag);
  if (!version) {
    throw new Error(i18next.t("release.bump.genUnValidVersion"));
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
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
}): Promise<BumpResult> => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  log.info(i18next.t("release.bump.processing"));
  const {
    commandConfig: {
      bump: { versionFileRead, releaseAs, releaseType, releasePreTag },
    },
  } = finalUserConfig;
  const versionFileContent = await unSafeFunctionWrapper(versionFileRead)({
    finalUserConfig,
  });
  if (!versionFileContent) {
    throw new Error(i18next.t("release.bump.notFoundVersionFile"));
  }
  if (!versionFileContent.version) {
    throw new Error(i18next.t("release.bump.unValidOldVersion"));
  }
  const oldVersion = versionFileContent.version;
  log.info(i18next.t("release.bump.oldVersion", { oldVersion }));
  if (releaseAs) {
    if (!semver.valid(releaseAs)) {
      throw new Error(
        i18next.t("release.bump.releaseAsUnValid", { releaseAs })
      );
    }
    log.info(i18next.t("release.bump.versionByReleaseAs", { releaseAs }));
    return {
      version: releaseAs,
      oldVersion,
    };
  }
  if (releaseType) {
    if (!isReleaseType(releaseType)) {
      throw new Error(
        i18next.t("release.bump.releaseTypeUnValid", { releaseType })
      );
    }
    const version = semver.inc(oldVersion, releaseType, releasePreTag);
    if (!version) {
      throw new Error(i18next.t("release.bump.genUnValidVersion"));
    }
    log.info(
      i18next.t("release.bump.versionByReleaseType", { releaseType, version })
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
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
}): Promise<BumpResult> => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const versionResult = await genVersion({
    finalUserConfig,
  });
  log.info(
    i18next.t("release.bump.end", {
      version: versionResult.version,
      oldVersion: versionResult.oldVersion,
    })
  );
  if (semver.compare(versionResult.oldVersion, versionResult.version) >= 0) {
    throw new Error(i18next.t("release.bump.unValidVersionResult"));
  }
  const {
    commandConfig: {
      dry,
      bump: { versionFileWriteDisable, versionFileWrite },
    },
  } = finalUserConfig;

  let _versionFileWriteDisable = versionFileWriteDisable;

  if (dry) {
    _versionFileWriteDisable = true;
    log.warn(i18next.t("release.dry.bump.versionFileWriteDisable"));
  }

  if (!_versionFileWriteDisable) {
    await versionFileWrite({
      finalUserConfig,
      bumpRes: versionResult,
    });
    log.info(
      i18next.t("release.bump.versionFileWriteSuccess", {
        version: versionResult.version,
      })
    );
  } else {
    log.warn(i18next.t("release.bump.versionFileWriteDisable"));
  }
  return versionResult;
};
