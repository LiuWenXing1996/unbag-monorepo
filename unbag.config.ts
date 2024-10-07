import {
  AbsolutePath,
  defineCommand,
  defineUserConfig,
  useCommand,
} from "unbag";
import { execa } from "execa";
import { PackageType, resolvePackages } from "build-tools";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RuleConfigSeverity } from "@commitlint/types";
import { DepsGraph, useFs, createDepsGraph } from "build-tools";
import waitOn from "wait-on";
import fs from "node:fs/promises";
const __dirname = fileURLToPath(import.meta.url);
const dirname = new AbsolutePath({
  content: __dirname,
});

export default defineUserConfig(async ({ mode }) => {
  const packages = await resolvePackages({
    root: path.dirname(dirname.content),
  });
  const devModeCommands = mode === "dev" ? await getCommandsInDevMode() : [];
  return {
    commands: [
      ...devModeCommands,
      useCommand(
        defineCommand({
          defaultConfig: {},
          name: "clean",
          description: "清楚构建的资源",
          options: {
            type: {
              alias: "t",
              choices: ["all", "commands", "main"],
              demandOption: true,
            },
          },
          run: async ({ args }) => {
            const { type } = args;
            const needProcessPackages = packages.filter((pkg) => {
              if (pkg.type === PackageType.Root) {
                return false;
              }
              if (type === "all") {
                return true;
              }
              if (type === "main") {
                return pkg.type === PackageType.Main;
              }
              if (type === "commands") {
                return pkg.name.startsWith("unbag-command");
              }
              return false;
            });
            for (const pkg of needProcessPackages) {
              for (const buildResource of pkg.buildResources || []) {
                console.log(`将会移除 ${buildResource}`);
                await fs.rm(buildResource, { recursive: true, force: true });
              }
            }
          },
        })
      ),
      useCommand(
        defineCommand({
          defaultConfig: {},
          name: "build",
          description: "构建资源",
          options: {
            type: {
              alias: "t",
              choices: ["all", "commands", "main"],
              demandOption: true,
            },
          },
          run: async ({ args }) => {
            const { type } = args;
            const needProcessPackages = packages.filter((pkg) => {
              if (pkg.type === PackageType.Root) {
                return false;
              }
              if (type === "all") {
                return true;
              }
              if (type === "main") {
                return pkg.type === PackageType.Main;
              }
              if (type === "commands") {
                return pkg.name.startsWith("unbag-command");
              }
              return false;
            });

            const needBuildPackageMap = new Map(
              needProcessPackages.map((pkg) => [pkg.name, pkg])
            );
            const depsGraph = createDepsGraph({
              packages: needProcessPackages,
            });
            let sortedPackages = depsGraph.sortByDeps();
            // 将 build-tools 和 unbag 的构建提前
            const manualOrderList = ["build-tools", "unbag"].reverse();
            for (const manualOrder of manualOrderList) {
              if (sortedPackages.includes(manualOrder)) {
                sortedPackages = sortedPackages.filter(
                  (e) => e !== manualOrder
                );
                sortedPackages.push(manualOrder);
              }
            }
            const tasks = sortedPackages.map((pkgName) => {
              const pkg = needBuildPackageMap.get(pkgName);
              if (!pkg) {
                throw new Error(`没有找到 ${pkg} 的相关信息`);
              }

              return async () => {
                await execa({
                  stdout: process.stdout,
                  stderr: process.stdout,
                })`pnpm --filter ${pkg.name} build`;
              };
            });

            for (const task of tasks) {
              await task();
            }
          },
        })
      ),
    ],
  };
});

export const getCommandsInDevMode = async () => {
  const packages = await resolvePackages({
    root: path.dirname(dirname.content),
  });
  const ParallelCommand = (await import("unbag-command-parallel"))
    .ParallelCommand;
  const useParallelCommand = useCommand(ParallelCommand, () => {
    return {
      wait: {
        timeout: 1000 * 60 * 10,
      },
      beforeCheck: async () => {
        await execa({
          stdout: process.stdout,
          stderr: process.stdout,
        })`pnpm unbag clean -t main`;
        return true;
      },
      scripts: () => {
        const depsGraph = new DepsGraph();
        const needDevPackages = packages.filter((pkg) => {
          return (
            pkg.type !== PackageType.Root && pkg.type !== PackageType.BuildTools
          );
        });
        const needDevPackageMap = new Map(
          needDevPackages.map((pkg) => [pkg.name, pkg])
        );
        for (const pkg of needDevPackages) {
          depsGraph.addPkg(pkg.name);
          const deps = Array.from(
            new Set([
              ...Object.keys(pkg.pkgJson.dependencies || {}),
              ...Object.keys(pkg.pkgJson.peerDependencies || {}),
            ])
          ).filter((dep) =>
            needDevPackages.find(
              (needDevPackage) => needDevPackage.name === dep
            )
          );
          for (const dep of deps) {
            depsGraph.addDep(pkg.name, dep);
          }
        }

        const sortedPackages = depsGraph.sortByDeps();
        type ParallelScript = import("unbag-command-parallel").ParallelScript;

        const scripts: ParallelScript[] = [
          ...sortedPackages.map((pkgName, index) => {
            const pkg = needDevPackageMap.get(pkgName);
            if (!pkg) {
              throw new Error(`没有找到 ${pkg} 的相关信息`);
            }

            return {
              name: pkg.name,
              command: `pnpm --filter ${pkg.name} dev`,
              wait: {
                func: async () => {
                  if (index > 0) {
                    const depPkgName = sortedPackages[index - 1];
                    const depPkg = needDevPackageMap.get(depPkgName);
                    await waitOn({
                      resources: [...(depPkg?.buildResources || [])],
                    });
                  }
                  return true;
                },
              },
            };
          }),
          {
            name: "unbag-unit-test",
            command: `pnpm --filter unbag test-watch`,
          },
        ];
        return scripts;
      },
    };
  });

  const useCommitCommand = useCommand(
    (await import("unbag-command-commit")).CommitCommand,
    () => {
      const scopes = packages.map((pkg) => pkg.name);
      return {
        lint: {
          extends: ["@commitlint/config-pnpm-scopes"],
          rules: {
            "scope-empty": () => [RuleConfigSeverity.Error, "never"],
            "scope-enum": () => [
              RuleConfigSeverity.Error,
              "always",
              [...scopes],
            ],
          },
        },
      };
    }
  );

  const useCreateCommand = useCommand(
    (await import("unbag-command-create")).CreateCommand,
    async () => {
      const resolveTemplates = (await import("unbag-command-create"))
        .resolveTemplates;
      const templatesDir = new AbsolutePath({
        content: path.dirname(dirname.content),
      }).resolve({ next: "./templates" });
      return {
        templates: [
          ...(await resolveTemplates({
            templatesDir: templatesDir,
          })),
        ],
      };
    }
  );

  return [useCreateCommand, useCommitCommand, useParallelCommand];
};
