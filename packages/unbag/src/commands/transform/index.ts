import { FinalUserConfig, UserConfigOptional } from "@/utils/config";
import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { AbsolutePath, RelativePath } from "@/utils/path";
import { MaybePromise } from "@/utils/types";
import { useFs } from "@/utils/fs";
import {
  useTransformEntry,
  useTransformTaskTempDir,
  useTransformTempDir,
} from "./utils";
import dayjs from "dayjs";
import { TransformActionHelper, useTransformActionHelper } from "./action";
import { Command } from "@/core/command";

export interface TransformConfig {
  entry: string;
  watch: boolean;
  sourcemap: boolean;
  ignores: {
    [extname: string]: boolean;
  };
  match: (params: {
    filePath: RelativePath;
    inputDir: AbsolutePath;
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<boolean>;
  actions: Record<
    string,
    (params: {
      helper: TransformActionHelper;
      finalUserConfig: FinalUserConfig;
    }) => Promise<void>
  >;
  action: (params: {
    helper: TransformActionHelper;
    finalUserConfig: FinalUserConfig;
  }) => Promise<void>;
}

export type TransformTask = (params: {
  inputDir: AbsolutePath;
  tempDir: AbsolutePath;
  filePaths: RelativePath[];
  finalUserConfig: FinalUserConfig;
}) => Promise<TransformTaskResult>;

export type TransformProcess = (params: {
  task: TransformTask;
  name: string;
}) => Promise<{
  taskResult: TransformTaskResult;
  tempDir: AbsolutePath;
}>;
export type TransformTaskOutFile = {
  from: RelativePath;
} & (
  | {
      type: TransformTaskOutFileType.Transformed;
      to: RelativePath;
      content: string | Buffer;
      sourcemap?: string;
    }
  | {
      type: TransformTaskOutFileType.Copy;
      to: RelativePath;
    }
  | {
      type: TransformTaskOutFileType.Ignored;
    }
);
export enum TransformTaskOutFileType {
  "Transformed" = "Transformed",
  "Copy" = "Copy",
  "Ignored" = "Ignored",
}
export type TransformTaskResult = (TransformTaskOutFile | undefined)[];

export const TransformConfigDefault: TransformConfig = {
  entry: "./src",
  watch: false,
  sourcemap: false,
  ignores: {
    ".DS_Store": true,
  },
  actions: {},
  action: async ({ finalUserConfig }) => {
    const message = useMessage({
      locale: finalUserConfig.locale,
    });
    throw new Error(message.transform.action.empty());
  },
  match: async ({ filePath, finalUserConfig }) => {
    const {
      transform: { ignores },
    } = finalUserConfig;
    const ignoresExtnames = Object.entries(ignores)
      .filter(([, ignore]) => ignore)
      .map(([extname]) => extname);
    const needIgnore = ignoresExtnames.some((extName) =>
      filePath.content.endsWith(extName)
    );
    if (needIgnore) {
      return false;
    }
    return true;
  },
};
const innerTransform = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const fs = useFs();
  const message = useMessage({ locale: finalUserConfig.locale });
  log.info(message.transform.starting());
  const { transform } = finalUserConfig;
  const { action } = transform;
  const transformTempDir = useTransformTempDir({ finalUserConfig });
  const actionHelper = useTransformActionHelper({ finalUserConfig });
  await fs.emptyDir(transformTempDir.content);
  await action({ helper: actionHelper, finalUserConfig });
  log.info(message.transform.end());
};
export const watch = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const entryDir = useTransformEntry({ finalUserConfig });
  const log = useLog({ finalUserConfig });
  const message = useMessage({ locale: finalUserConfig.locale });
  const watcher = fsWatch(entryDir.content);
  const debouncedTransform = debounce(async () => {
    await innerTransform({ finalUserConfig });
  }, 100);
  await debouncedTransform();
  watcher.on("all", async (type, file) => {
    log.info(
      message.transform.watch.fileChanged({
        type,
        filePath: file,
      })
    );
    await debouncedTransform();
  });
  log.info(message.transform.watch.enabled());
};
export const transform = async (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  if (finalUserConfig.transform.watch) {
    await watch({ finalUserConfig });
  } else {
    return await innerTransform({ finalUserConfig });
  }
};

export class TransformCommand extends Command{
  async task() {
    const { finalUserConfig } = this;
    await transform({ finalUserConfig });
  }
}
