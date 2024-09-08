import { findWorkspacePackages } from "@pnpm/workspace.find-packages";
import { findWorkspaceDir } from "@pnpm/find-workspace-dir";

export const getScopes = async () => {
  const workspaceDir = await findWorkspaceDir(process.cwd());
  if (!workspaceDir) {
    return [];
  }
  const pkgs = await findWorkspacePackages(workspaceDir);
  const scopes = pkgs.map((e) => e.manifest.name).filter((e) => e);
  return scopes;
};

export const checkScope = async (name: string) => {
  const scopes = await getScopes();
  console.log({scopes})
  if (!name) {
    return false;
  }
  return scopes.includes(name);
};
