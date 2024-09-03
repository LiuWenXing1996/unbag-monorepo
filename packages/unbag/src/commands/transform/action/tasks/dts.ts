import ts from "typescript";
import {
  defineTransformActionTask,
  TransformActionTaskOutFileType,
  TransformActionTaskResult,
} from "..";
import { FinalUserConfig, mergeConfig } from "@/utils/config";
import { useRoot } from "@/utils/common";
import _ from "lodash";
import { RelativePath, usePath } from "@/utils/path";
import { useTransformTempDir } from "../../utils";
import { DeepPartial } from "@/utils/types";
import { useLog } from "@/utils/log";

export interface TransformActionTaskDtsOptions {
  supportExtensions: Record<string, boolean>;
  configFilePath: string;
  compilerOptions?: ts.CompilerOptions;
  noLogDiagnosticErrors?: boolean;
}

export const TransformActionTaskDtsOptionsDefault: TransformActionTaskDtsOptions =
  {
    supportExtensions: {
      ".ts": true,
      ".tsx": true,
      ".d.ts": true,
      ".js": true,
      ".jsx": true,
      ".cts": true,
      ".d.cts": true,
      ".cjs": true,
      ".mts": true,
      ".d.mts": true,
      ".mjs": true,
    },
    configFilePath: "tsconfig.json",
  };

export const useCompilerOptions = (params: {
  finalUserConfig: FinalUserConfig;
  taskOptions: TransformActionTaskDtsOptions;
}) => {
  const { taskOptions, finalUserConfig } = params;
  const root = useRoot({ finalUserConfig });
  const { configFilePath, compilerOptions: compilerOptionsOverrides } =
    taskOptions;
  const finalConfigFilePath = root.resolve({ next: configFilePath });
  let compilerOptionsFromFile: ts.CompilerOptions | undefined = undefined;
  const { config } = ts.readConfigFile(
    finalConfigFilePath.content,
    ts.sys.readFile
  );
  if (config.compilerOptions) {
    const { options } = ts.convertCompilerOptionsFromJson(
      config?.compilerOptions,
      root.content,
      finalConfigFilePath.content
    );
    compilerOptionsFromFile = options;
  }
  const finalCompilerOptions = _.merge(
    {},
    compilerOptionsFromFile,
    compilerOptionsOverrides
  );
  return finalCompilerOptions;
};

export const TransformActionTaskDts = (
  options: DeepPartial<TransformActionTaskDtsOptions>
) => {
  const finalOptions = mergeConfig(
    TransformActionTaskDtsOptionsDefault,
    options
  );
  const { supportExtensions, noLogDiagnosticErrors } = finalOptions;
  return defineTransformActionTask(async (params) => {
    const { finalUserConfig, inputDir, filePaths } = params;
    const matchedFiles = filePaths
      .filter((e) => {
        return supportExtensions[e.extname];
      })
      .map((e) => {
        return inputDir.resolve({ next: e.content });
      });
    const transformTempDir = useTransformTempDir({ finalUserConfig });
    const compilerOptions = useCompilerOptions({
      finalUserConfig,
      taskOptions: finalOptions,
    });
    const path = usePath();
    const log = useLog({ finalUserConfig });
    const outDir = transformTempDir.resolve({
      next: "./transform-action-task-dts",
    });
    const finalCompilerOptions: ts.CompilerOptions = {
      ...compilerOptions,
      emitDeclarationOnly: true,
      declaration: true,
      composite: false,
      noEmit: false,
      outDir: outDir.content,
    };
    const program = ts.createProgram(
      matchedFiles.map((e) => e.content),
      finalCompilerOptions
    );
    const dtsFiles: {
      path: RelativePath;
      content: string;
    }[] = [];
    const emitResult = program.emit(undefined, (fileName, text) => {
      const filePath = new RelativePath({
        content: path.relative(outDir.content, fileName),
      });
      dtsFiles.push({
        path: filePath,
        content: text,
      });
    });
    if (!noLogDiagnosticErrors) {
      const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
      allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          let { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!
          );
          let message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          );
          log.error(
            `${diagnostic.file.fileName} (${line + 1},${
              character + 1
            }): ${message}`
          );
        } else {
          log.error(
            ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
          );
        }
      });
    }
    // TODO:如果dts files 为空，检查下   noEmitOnError 是不是为 true,如果是 true 的话，就提示下
    const result: TransformActionTaskResult = dtsFiles.map((dtsFile) => {
      return {
        type: TransformActionTaskOutFileType.Transformed,
        to: dtsFile.path,
        content: dtsFile.content,
      };
    });
    return result;
  });
};
