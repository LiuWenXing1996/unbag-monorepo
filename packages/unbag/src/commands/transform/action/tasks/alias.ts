import { DeepPartial, MaybePromise } from "@/utils/types";
import path, { AbsolutePath, RelativePath } from "@/utils/path";
import { transformFileAsync } from "@babel/core";
import { createRequire } from "node:module";
import { useRoot } from "@/utils/common";
import { defineTransformActionTask, TransformActionTaskOutFileType } from "..";
import { FinalUserConfig, mergeConfig } from "@/core/user-config";
import { TransformConfig } from "../..";
const require = createRequire(import.meta.url);
export type TransformActionTaskAliasFileResolver = (params: {
  inputDir: AbsolutePath;
  filePath: RelativePath;
  finalOptions: TransformActionTaskAliasOptions;
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => MaybePromise<string>;
export type TransformActionTaskAliasOptions = {
  paths: Record<string, string>;
  pathResolver: (params: {
    sourcePath: string;
    inputDir: AbsolutePath;
    filePath: RelativePath;
    finalOptions: TransformActionTaskAliasOptions;
    finalUserConfig: FinalUserConfig<TransformConfig>;
  }) => MaybePromise<string>;
  fileResolvers: Record<string, TransformActionTaskAliasFileResolver>;
  getFileResolver: (params: {
    inputDir: AbsolutePath;
    filePath: RelativePath;
    finalUserConfig: FinalUserConfig<TransformConfig>;
    finalOptions: TransformActionTaskAliasOptions;
  }) => MaybePromise<TransformActionTaskAliasFileResolver> | undefined;
};
export const DefaultTransformActionTaskAliasOptions: TransformActionTaskAliasOptions =
  {
    paths: {},
    pathResolver: (params) => {
      const { finalOptions, sourcePath, inputDir, filePath, finalUserConfig } =
        params;
      const { paths } = finalOptions;
      const rootPath = useRoot({ finalUserConfig });
      const matched = Object.entries(paths).find(([key]) =>
        sourcePath.startsWith(`${key}/`)
      );
      if (!matched) {
        return sourcePath;
      }
      const [key, value] = matched;
      const absoluteSourcePath = new AbsolutePath({
        content: sourcePath.replace(
          `${key}/`,
          `${path.resolve(rootPath.content, value)}/`
        ),
      });
      const absoluteFilePath = filePath.toAbsolutePath({
        rel: inputDir,
      });
      const absoluteFileDir = new AbsolutePath({
        content: path.dirname(absoluteFilePath.content),
      });
      const relativePath = absoluteSourcePath.toRelativePath({
        rel: absoluteFileDir,
      });
      const relativePathContent = "./" + relativePath.content;
      return relativePathContent;
    },
    fileResolvers: {
      ".js": async ({ filePath, inputDir, finalOptions, finalUserConfig }) => {
        const { pathResolver } = finalOptions;
        const absoluteFilePath = filePath.toAbsolutePath({
          rel: inputDir,
        });
        const jsFile = await transformFileAsync(absoluteFilePath.content, {
          plugins: [
            [
              require.resolve("babel-plugin-module-resolver"),
              {
                resolvePath: (sourcePath: string) => {
                  return pathResolver({
                    sourcePath,
                    finalOptions,
                    finalUserConfig,
                    inputDir,
                    filePath,
                  });
                },
              },
            ],
          ],
        });
        return jsFile?.code || "";
      },
      ".ts": async ({ filePath, inputDir, finalOptions, finalUserConfig }) => {
        const { pathResolver } = finalOptions;
        const absoluteFilePath = filePath.toAbsolutePath({
          rel: inputDir,
        });
        const jsFile = await transformFileAsync(absoluteFilePath.content, {
          plugins: [
            [require.resolve("@babel/plugin-syntax-typescript")],
            [
              require.resolve("babel-plugin-module-resolver"),
              {
                resolvePath: (sourcePath: string) => {
                  return pathResolver({
                    sourcePath,
                    finalOptions,
                    finalUserConfig,
                    inputDir,
                    filePath,
                  });
                },
              },
            ],
          ],
        });
        return jsFile?.code || "";
      },
    },
    getFileResolver: ({ filePath, finalOptions }) => {
      const { fileResolvers } = finalOptions;
      const extName = path.extname(filePath.content);
      return fileResolvers[extName];
    },
  };
export const TransformActionTaskAlias = (
  options?: DeepPartial<TransformActionTaskAliasOptions>
) => {
  const finalOptions = mergeConfig({
    defaultValue: DefaultTransformActionTaskAliasOptions,
    overrides: [options || {}],
  });
  return defineTransformActionTask(async (params) => {
    const { finalUserConfig, inputDir, filePaths } = params;
    return await Promise.all(
      filePaths.map(async (filePath) => {
        const resolver = await finalOptions.getFileResolver({
          finalUserConfig,
          filePath,
          inputDir,
          finalOptions,
        });
        if (resolver) {
          return {
            from: filePath,
            to: filePath,
            type: TransformActionTaskOutFileType.Transformed,
            content: await resolver({
              finalUserConfig,
              filePath,
              inputDir,
              finalOptions,
            }),
            sourcemap: undefined,
          };
        }
        return {
          from: filePath,
          to: filePath,
          type: TransformActionTaskOutFileType.Copy,
        };
      })
    );
  });
};
