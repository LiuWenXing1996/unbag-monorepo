import { FinalUserConfig } from "unbag";
import { ReleaseConfig } from ".";
import { useLog } from "unbag";
import { useGit } from "./utils";
import i18next from "i18next";
export interface ReleaseBranchConfig {
  mainName: string;
  mainCheckDisable: boolean;
  cleanCheckDisable: boolean;
}
export type ReleaseBranchResult = {
  currentBranchName: string;
};
export const ReleaseBranchConfigDefault: ReleaseBranchConfig = {
  mainName: "main",
  mainCheckDisable: false,
  cleanCheckDisable: false,
};
export const branch = async (params: {
  finalUserConfig: FinalUserConfig<ReleaseConfig>;
}): Promise<ReleaseBranchResult> => {
  const { finalUserConfig } = params;
  const {
    commandConfig: {
      branch: { mainCheckDisable, mainName, cleanCheckDisable },
    },
  } = finalUserConfig;
  const log = useLog({ finalUserConfig });
  const { currentBranchGet, currentBranchStatusGet } = useGit();
  const currentBranchName = await currentBranchGet();
  if (!currentBranchName) {
    throw new Error(i18next.t("release.branch.currentBranchUndefined"));
  }
  log.info(
    i18next.t("release.branch.currentBranchName", { currentBranchName })
  );
  if (!mainCheckDisable) {
    log.info(i18next.t("release.branch.mainBranchChecking"));
    if (currentBranchName !== mainName) {
      throw new Error(
        i18next.t("release.branch.mainBranchCheckFail", {
          currentBranchName,
          mainBranchName: mainName,
        })
      );
    }
    log.info(i18next.t("release.branch.mainBranchCheckSuccess"));
  } else {
    log.info(i18next.t("release.branch.mainBranchCheckDisable"));
  }
  if (!cleanCheckDisable) {
    log.info(i18next.t("release.branch.cleanChecking"));
    const currentBranchStatus = await currentBranchStatusGet();
    if (currentBranchStatus) {
      throw new Error(
        i18next.t("release.branch.cleanCheckFail", {
          branchStatusInfo: currentBranchStatus,
        })
      );
    }
    log.info(i18next.t("release.branch.cleanCheckSuccess"));
  } else {
    log.info(i18next.t("release.branch.cleanCheckDisable"));
  }
  return {
    currentBranchName,
  };
};
