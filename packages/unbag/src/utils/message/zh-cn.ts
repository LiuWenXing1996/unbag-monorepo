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
    scope: {
      undefinedCheck: () => {
        return `release.scope.check 需要配置`;
      },
      unValidScopeName: () => {
        return `无效的 scope 名称，请检查相关配置 release.scope.name release.scope.check`;
      },
    },
    dry: {
      tip: () => {
        return `进入试运行模式，将会自动禁用一些操作`;
      },
      bump: {
        versionFileWriteDisable: () => {
          return `试运行模式，禁用版本描述文件写入`;
        },
      },
      changelog: {
        fileWriteDisable: () => {
          return `试运行模式，禁用更新日志写入`;
        },
      },
      commit: {
        disable: () => {
          return `试运行模式，禁用更改文件提交`;
        },
      },
      tag: {
        disable: () => {
          return `试运行模式，禁用 git tag 添加`;
        },
      },
      push: {
        disable: () => {
          return `试运行模式，禁用 git push `;
        },
      },
    },
    branch: {
      currentBranchUndefined: () => {
        return `现在没有处在任何分支,请切换到某分支下进行操作`;
      },
    },
    bump: {
      unValidOldVersion: () => {
        return `无效的旧版号，请检查相关配置 release.bump.versionFilePath release.bump.versionFilePathResolve release.bump.versionFileRead`;
      },
      end: (params: { version: string; oldVersion: string }) => {
        const { version, oldVersion } = params;
        return `版本号生成结束, 旧版本号: ${oldVersion}, 下一个版本号: ${version}`;
      },
      unValidVersionResult: () => {
        return `生成的版本号无效`;
      },
    },
    changelog: {
      generating: () => {
        return `正在生成更新日志...`;
      },
      newChangeset: (params: { newChangeset: string }) => {
        const { newChangeset } = params;
        return `将会新增以下日志：
${newChangeset}`;
      },
    },
    commit: {
      processing: () => {
        return `准备自动提交更改文件...`;
      },
      willCommitAll: () => {
        return `将会自动提交所有更改文件`;
      },
      fileCollecting: () => {
        return `正在自动收集更改文件...`;
      },
      commitFilesEmpty: () => {
        return `未检测到需要提交的文件, 退出自动提交`;
      },
      commitFilesInfo: ({ files }: { files: string[] }) => {
        return `需要提交的文件:\n   ${files.join("\n   ")}`;
      },
      messageUndefined: () => {
        return `CommitMessage 为空, 请检查 commitMessageFormat`;
      },
      messageInfo: (params: { message: string }) => {
        const { message } = params;
        return `提交信息: ${message}`;
      },
      disable: () => {
        return `自动提交更改文件已被禁用`;
      },
    },
    tag: {
      processing: () => {
        return `准备添加 git tag ...`;
      },
      undefinedGenPrefix: () => {
        return `生成的 tag prefix 无效，请检查 release.tag.genPrefix `;
      },
      prefix: (params: { prefix: string }) => {
        const { prefix } = params;
        return `tagPrefix: ${prefix}`;
      },
      name: (params: { name: string }) => {
        const { name } = params;
        return `tagName: ${name}`;
      },
      message: (params: { message: string }) => {
        const { message } = params;
        return `tagMessage: ${message}`;
      },
      force: () => {
        return `已启用强制添加 git tag`;
      },
    },
    push: {
      processing: () => {
        return `准备执行 git push ...`;
      },
      disable: () => {
        return `git push 已被禁用`;
      },
      force: () => {
        return `已启用强制 git push`;
      },
      fail:()=>{
        return `git push 失败`;
      },
      success:()=>{
        return `git push 完成`;
      }
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
  releaseChangelogFileWriting: () => {
    return `正在写入更新日志...`;
  },
  releaseChangelogFileWriteSuccess: () => {
    return `写入更新日志成功`;
  },
  releaseChangelogFileWriteDisable: () => {
    return `写入更新日志已被禁用`;
  },

  releaseCommitMessageInfoUndefined: () => {
    return `提交信息不能为空, 请检查配置文件中的 release.commit.message,release.commit.messageFormat `;
  },

  releaseCommitSuccess: () => {
    return `自动提交成功`;
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
};
