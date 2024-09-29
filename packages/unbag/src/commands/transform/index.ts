import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { AbsolutePath, RelativePath } from "@/utils/path";
import { DeepReadonly, MaybePromise } from "@/utils/types";
import { useFs } from "@/utils/fs";
import { useTransformEntry, useTransformTempDir } from "./utils";
import { TransformActionHelper, useTransformActionHelper } from "./action";
import { defineCliCommand } from "@/core/cli";
import { FinalUserConfig } from "@/core/user-config";

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
    finalUserConfig: FinalUserConfig<TransformConfig>;
  }) => MaybePromise<boolean>;
  actions: Record<
    string,
    (params: {
      helper: TransformActionHelper;
      finalUserConfig: FinalUserConfig<TransformConfig>;
    }) => Promise<void>
  >;
  action: (params: {
    helper: TransformActionHelper;
    finalUserConfig: FinalUserConfig<TransformConfig>;
  }) => Promise<void>;
}

export type TransformTask = (params: {
  inputDir: AbsolutePath;
  tempDir: AbsolutePath;
  filePaths: RelativePath[];
  finalUserConfig: FinalUserConfig<TransformConfig>;
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
      locale: finalUserConfig.base.locale,
    });
    throw new Error(message.transform.action.empty());
  },
  match: async ({ filePath, finalUserConfig }) => {
    const {
      commandConfig: { ignores },
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
const innerTransform = async (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const fs = useFs();
  const message = useMessage({ locale: finalUserConfig.base.locale });
  log.info(message.transform.starting());
  const { commandConfig: transform } = finalUserConfig;
  const { action } = transform;
  const transformTempDir = useTransformTempDir({ finalUserConfig });
  const actionHelper = useTransformActionHelper({ finalUserConfig });
  await fs.emptyDir(transformTempDir.content);
  await action({ helper: actionHelper, finalUserConfig });
  log.info(message.transform.end());
};
export const watch = async (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const entryDir = useTransformEntry({ finalUserConfig });
  const log = useLog({ finalUserConfig });
  const message = useMessage({ locale: finalUserConfig.base.locale });
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
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  if (finalUserConfig.commandConfig.watch) {
    await watch({ finalUserConfig });
  } else {
    return await innerTransform({ finalUserConfig });
  }
};

export const TransformCommand = defineCliCommand({
  useDefaultConfig: () => {
    return TransformConfigDefault;
  },
  defineActions: ({ defineAction }) => {
    return [
      defineAction({
        name: "transform",
        description: "转换文件",
        options: {
          watch: {
            alias: "w",
            boolean: true,
          },
        },
        configParse: ({ args }) => {
          return {
            watch: args.watch,
          };
        },
        run: async ({ finalUserConfig }) => {
          await transform({ finalUserConfig });
        },
      }),
    ];
  },
});
