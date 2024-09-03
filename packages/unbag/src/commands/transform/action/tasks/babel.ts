import { defineTransformActionTask, TransformActionTaskOutFileType } from "..";
import {
  transformFileAsync,
  type TransformOptions as BabelTransformOptions,
} from "@babel/core";
export type TransformActionTaskBabelOptions = {
  babel: BabelTransformOptions;
  extMapping: Record<string, string>;
};
export const TransformActionTaskBabel = (
  options: TransformActionTaskBabelOptions
) => {
  const { babel: babelOptions, extMapping } = options;
  return defineTransformActionTask(async (params) => {
    const { inputDir, filePaths } = params;
    const matchedExtnames = Object.keys(extMapping);
    const filePathsFiltered = filePaths.filter((filePath) => {
      if (matchedExtnames.includes(filePath.extname)) {
        return true;
      }
      return false;
    });
    const outputFiles = await Promise.all(
      filePathsFiltered.map(async (filePath) => {
        const absoluteFilePath = filePath.toAbsolutePath({
          rel: inputDir,
        });
        const jsFile = await transformFileAsync(absoluteFilePath.content, {
          ...babelOptions,
        });
        const targetExtName = extMapping[filePath.extname];
        return {
          from: filePath,
          to: filePath.replaceExtname(targetExtName),
          type: TransformActionTaskOutFileType.Transformed,
          content: jsFile?.code || "",
          sourcemap: undefined,
        };
      })
    );
    return outputFiles;
  });
};
