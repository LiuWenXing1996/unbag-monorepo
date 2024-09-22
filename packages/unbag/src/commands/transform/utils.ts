import { filterNullable, useRoot } from "@/utils/common";
import { v4 as uuidv4 } from "uuid";
import { TransformConfig, TransformTask } from ".";
import { AbsolutePath } from "@/utils/path";
import { useFs } from "@/utils/fs";
import { FinalUserConfig } from "@/core/user-config";

export const useTransformTempDir = (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const {
    base: { tempDir },
  } = finalUserConfig;
  const rootPath = useRoot({ finalUserConfig });
  const transformTempDir = rootPath
    .resolve({
      next: tempDir,
    })
    .resolve({
      next: "./transform",
    });
  return transformTempDir;
};

export const useTransformTaskTempDir = (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const transformTempDir = useTransformTempDir({ finalUserConfig });
  const transformTaskTempDir = transformTempDir.resolve({
    next: `./task_${uuidv4()}`,
  });
  return transformTaskTempDir;
};

export const useTransformEntry = (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const { commandConfig: transform } = finalUserConfig;
  const { entry } = transform;
  const rootPath = useRoot({ finalUserConfig });
  return rootPath.resolve({
    next: entry,
  });
};

export const useTransformFiles = async (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
  inputDir: AbsolutePath;
}) => {
  const { finalUserConfig, inputDir } = params;
  const fs = useFs();
  const inputFilePaths = (await fs.listFiles(inputDir.content))
    .map((e) => {
      return new AbsolutePath({
        content: e,
      });
    })
    .map((e) => {
      return e.toRelativePath({
        rel: inputDir,
      });
    });
  const inputFilePathsFiltered = filterNullable(
    await Promise.all(
      inputFilePaths.map(async (filePath) => {
        const matched = await finalUserConfig.commandConfig.match({
          filePath,
          inputDir,
          finalUserConfig,
        });
        if (matched) {
          return filePath;
        }
      })
    )
  );
  return [...inputFilePathsFiltered];
};

export const defineTransformTask = (task: TransformTask) => task;
