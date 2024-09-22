import { useGit } from "@/utils/git";
import { useLog } from "@/utils/log";
import { useMessage } from "../../utils/message";
import { FinalUserConfig } from "@/core/user-config";
import { ReleaseConfig } from ".";
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
  const message = useMessage({
    locale: finalUserConfig.base.locale,
  });
  const { currentBranchGet, currentBranchStatusGet } = useGit();
  const currentBranchName = await currentBranchGet();
  // TODO:.....
  if (!currentBranchName) {
    throw new Error(message.releaseCurrentBranchUndefined());
  }
  log.info(
    message.releaseCurrentBranchName({
      currentBranchName,
    })
  );
  if (!mainCheckDisable) {
    log.info(message.releaseMainBranchChecking());
    if (currentBranchName !== mainName) {
      throw new Error(
        message.releaseMainBranchCheckFail({
          currentBranchName,
          mainBranchName: mainName,
        })
      );
    }
    log.info(message.releaseMainBranchCheckSuccess());
  } else {
    log.warn(message.releaseMainBranchCheckDisable());
  }
  if (!cleanCheckDisable) {
    log.info(message.releaseBranchCleanChecking());
    const currentBranchStatus = await currentBranchStatusGet();
    if (currentBranchStatus) {
      throw new Error(
        message.releaseBranchCleanCheckFail({
          branchStatusInfo: currentBranchStatus,
        })
      );
    }
    log.info(message.releaseBranchCleanCheckSuccess());
  } else {
    log.warn(message.releaseBranchCleanCheckDisable());
  }
  return {
    currentBranchName,
  };
};
