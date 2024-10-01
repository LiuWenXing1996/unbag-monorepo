import module from "node:module";
import { $ } from "execa";

export const useCreateRequire = () => {
  return module.createRequire;
};


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

  return {
    currentBranchGet,
    currentBranchStatusGet,
    gitRootPathGet,
    stageFilesGet,
  };
};