import { $ } from "execa";
export const useGit = () => {
  const currentBranchGet = async () => {
    const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
    return stdout;
  };
  const currentBranchStatusGet = async () => {
    const { stdout } = await $`git status -s`;
    return stdout;
  };
  const gitRootPathGet = async () => {
    const { stdout } = await $`git rev-parse --show-toplevel`;
    return stdout.trim();
  };
  const stageFilesGet = async () => {
    const { stdout } = await $`git diff --cached --no-ext-diff --name-only`;
    return stdout
      .trim()
      .split("\n")
      .filter((e) => e);
  };

  // const isClean = (repoPath, done, stageAllFiles) => {
  //   exec(
  //     `git diff --cached --no-ext-diff --name-only ${
  //       !!stageAllFiles ? "&& git diff --no-ext-diff --name-only" : ""
  //     }`,
  //     {
  //       maxBuffer: Infinity,
  //       cwd: repoPath,
  //     },
  //     function (error, stdout) {
  //       if (error) {
  //         return done(error);
  //       }
  //       let output = stdout || "";
  //       done(null, output.trim().length === 0);
  //     }
  //   );
  // };
  return {
    currentBranchGet,
    currentBranchStatusGet,
    gitRootPathGet,
    stageFilesGet,
  };
};
