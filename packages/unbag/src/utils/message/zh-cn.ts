import { LintOutcome } from "@commitlint/types";
import { type Commit } from "conventional-commits-parser";
export const message = {
  config: {
    file: {
      notFound: (filePath: string) => {
        return `没有找到配置文件: ${filePath}`;
      },
    },
  },
  transform: {
    starting: () => {
      return `转换文件中...`;
    },
    action: {
      empty: () => {
        return `transform action 未定义`;
      },
      processParentNotFound: (params: { uid: string }) => {
        const { uid } = params;
        return `没有找到 uid 为 ${uid} 的 transform action process`;
      },
      taskProcessing: (params: { startTime: string; name: string }) => {
        const { name, startTime } = params;
        return `[${startTime}] 正在处理任务 ${name} ... `;
      },
      taskEnd: (params: {
        name: string;
        interval: number;
        endTime: string;
      }) => {
        const { name, interval, endTime } = params;
        return `[${endTime}] 处理任务 ${name} 完成, 耗时 ${interval} 秒 `;
      },
      taskFail: (params: {
        name: string;
        interval: number;
        endTime: string;
      }) => {
        const { name, interval, endTime } = params;
        return `[${endTime}] 处理任务 ${name} 失败, 耗时 ${interval} 秒 `;
      },
    },
    plugin: {
      processing: (params: { name: string }) => {
        const { name } = params;
        return `正在处理插件 ${name} ... `;
      },
    },
    watch: {
      enabled: () => {
        return `观察模式已启动...`;
      },
      fileChanged: (params: { type: string; filePath: string }) => {
        const { filePath, type } = params;
        return `检测到文件变化: [${type}] ${filePath}`;
      },
    },
    end: () => {
      return `转换完成`;
    },
  },
  commit: {
    branch: {
      stageFiles: {
        empty: () => {
          return `没有检测到暂存的文件, 请暂存文件后再试`;
        },
      },
    },
    lint: {
      error: (params: { message: string }) => {
        const { message } = params;
        return `校验信息失败, 当前输入信息: ${message} `;
      },
      success: (params: { message: string }) => {
        const { message } = params;
        return `校验信息通过, 当前输入信息: ${message} `;
      },
    },
  },
  release: {
    bump: {
      end: (params: { version: string; oldVersion: string }) => {
        const { version, oldVersion } = params;
        return `版本号生成结束, 旧版本号: ${oldVersion}, 下一个版本号: ${version}`;
      },
      unValidVersionResult: () => {
        return `生成的版本号无效`;
      },
    },
  },
  releaseCurrentBranchUndefined: () => {
    return `现在没有处在任何分支,请切换到某分支下进行操作`;
  },
  releaseCurrentBranchName: ({
    currentBranchName,
  }: {
    currentBranchName: string;
  }) => {
    return `现在处在分支 ${currentBranchName}`;
  },
  releaseMainBranchChecking: () => {
    return `正在检查是否处于主分支...`;
  },
  releaseMainBranchCheckDisable: () => {
    return `主分支检查已禁用`;
  },
  releaseMainBranchCheckSuccess: () => {
    return `主分支检查通过`;
  },
  releaseMainBranchCheckFail: ({
    currentBranchName,
    mainBranchName,
  }: {
    currentBranchName: string;
    mainBranchName: string;
  }) => {
    return `现在处在分支 ${currentBranchName},请使用 git checkout ${mainBranchName} 切换到主分支 ${mainBranchName} 操作`;
  },
  releaseBranchCleanChecking: () => {
    return `正在检查当前分支是否干净...`;
  },
  releaseBranchCleanCheckFail: ({
    branchStatusInfo,
  }: {
    branchStatusInfo: string;
  }) => {
    return `检测到有未提交的更改：\n${branchStatusInfo},\n请提交以上更改, 保持git工作区的干净`;
  },
  releaseBranchCleanCheckSuccess: () => {
    return `当前分支是干净的`;
  },
  releaseBranchCleanCheckDisable: () => {
    return `分支是否干净的检查已禁用`;
  },
  releaseBumping: () => {
    return `正在生成下一个版本号...`;
  },
  releaseBumpNotFoundVersionFile: () => {
    return `没有找到项目的版本描述文件, 请检查配置文件中的 release.bump.versionFilePath、release.bump.versionFilePathResolve, release.bump.versionFileRead`;
  },
  releaseBumpOldVersion: ({ oldVersion }: { oldVersion: string }) => {
    return `当前版本号 ${oldVersion}`;
  },
  releaseBumpReleaseAsUnValid: (currentValue?: string) => {
    return `releaseAs 必须是一个格式正确的 semvar 版本号, 当前值: ${currentValue}`;
  },
  releaseBumpVersionByReleaseAs: ({ releaseAs }: { releaseAs: string }) => {
    return `使用 ${releaseAs} 作为下一个版本号`;
  },
  releaseBumpReleaseTypeUnValid: (currentValue?: string) => {
    return `releaseType 必须是一个跟是正确的 server ReleaseType, 当前值: ${currentValue}`;
  },
  releaseBumpVersionByReleaseType: ({
    releaseType,
    version,
  }: {
    releaseType: string;
    version: string;
  }) => {
    return `使用 ${releaseType} 生成了下一个版本号: ${version}`;
  },
  releaseBumpGenUnValidVersion: () => {
    return `自动生成 version 失败`;
  },
  releaseBumpingByCommits: () => {
    return `正在使用以往的 commits 生成下一个版本号...`;
  },
  releaseBumpCommitsList: ({ commits }: { commits: Commit[] }) => {
    return `查找到 ${commits.length} 条提交记录`;
  },
  releaseBumpCommitsNoData: ({ oldVersion }: { oldVersion: string }) => {
    return `未找到任何的提交记录, 使用旧版本号 ${oldVersion} 作为下一个版本号`;
  },
  releaseBumpCommitsGenUnValidReleaseType: () => {
    return `自动生成 releaseType 失败`;
  },
  releaseBumpCommitsGenReleaseTypeSuccess: ({
    releaseType,
  }: {
    releaseType: string;
  }) => {
    return `自动生成 releaseType: ${releaseType}`;
  },
  releaseBumpVersionFileWriteDisable: () => {
    return `版本描述文件写入已被禁用`;
  },
  releaseBumpVersionFileWriteSuccess: ({ version }: { version: string }) => {
    return `版本描述文件已被写入下一个版本号：${version}`;
  },
  releaseChangelogGenerating: () => {
    return `正在生成更新日志...`;
  },
  releaseChangelogFileWriting: () => {
    return `正在写入更新日志...`;
  },
  releaseChangelogFileWriteSuccess: () => {
    return `写入更新日志成功`;
  },
  releaseChangelogFileWriteDisable: () => {
    return `写入更新日志已被禁用`;
  },
  releaseCommitting: () => {
    return `准备自动提交更改文件...`;
  },
  releaseCommitDisable: () => {
    return `自动提交更改文件已被禁用`;
  },
  releaseCommitAll: () => {
    return `将会自动提交所有更改文件`;
  },
  releaseCommitFileCollecting: () => {
    return `正在自动收集更改文件...`;
  },
  releaseCommitMessageInfoUndefined: () => {
    return `提交信息不能为空, 请检查配置文件中的 release.commit.message,release.commit.messageFormat `;
  },
  releaseCommitMessageInfo: ({ message }: { message: string }) => {
    return `提交信息: ${message}`;
  },
  releaseCommitFilesEmpty: () => {
    return `未检测到需要提交的文件, 退出自动提交`;
  },
  releaseCommitFilesInfo: ({ files }: { files: string[] }) => {
    return `需要提交的文件:\n   ${files.join("\n   ")}`;
  },
  releaseCommitSuccess: () => {
    return `自动提交成功`;
  },
  releaseTagging: () => {
    return `准备添加 git tag ...`;
  },
  releaseTagDisable: () => {
    return `添加 git tag 已被禁用`;
  },
  releaseTagAddSuccess: ({
    tagName,
    tagMessage,
  }: {
    tagName: string;
    tagMessage: string;
  }) => {
    return `添加 git tag 成功, name: ${tagName}, message: ${tagMessage}`;
  },
  configPropertyUndefined: (keyPath: string, configFilePath?: string) => {
    if (!configFilePath) {
      return `配置中的 ${keyPath} 未定义`;
    } else {
      return `配置中的 ${keyPath} 未定义, 请检查 ${configFilePath}`;
    }
  },
  releaseUndefinedChangelogFilePathConfig: () => {
    return `changelogFilePath 为 undefined`;
  },
  releaseUndefinedPkgFilePathConfig: () => {
    return `pkgFilePath 为 undefined`;
  },
  releaseCommitMessageUndefined: () => {
    return `CommitMessage 为空, 请检查 commitMessageFormat`;
  },
};
