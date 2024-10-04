import { sleep, modifyJson, readJson } from "@/utils";
import { AbsolutePath, CommandHelper, unSafeObjectWrapper } from "unbag";
import { DeepPartial } from "ts-essentials";
import fsExtra from "fs-extra/esm";
export interface WaitConfig {
  timeout: number;
  interval: number;
}
export const WaitDefaultConfig: WaitConfig = {
  timeout: 10000,
  interval: 500,
};

export interface WaitFileContent {
  name: string;
  interval: number;
  timeout: number;
  finish: boolean;
  result: boolean;
  message: string;
  updateTime: number;
  checkTime: number[];
}

export const mergeWaitFile = async (params: {
  filePath: AbsolutePath;
  content: Partial<Omit<WaitFileContent, "updateTime">>;
}) => {
  const { filePath, content } = params;
  await modifyJson<WaitFileContent>(filePath.content, (oldJson) => {
    return {
      ...oldJson,
      ...content,
      updateTime: Date.now(),
      checkTime: [...oldJson.checkTime, ...(content.checkTime || [])],
    };
  });
};

export const writeWaitFile = async (params: {
  filePath: AbsolutePath;
  content: Omit<WaitFileContent, "updateTime">;
}) => {
  const { filePath, content } = params;
  await fsExtra.outputFile(
    filePath.content,
    JSON.stringify({
      ...content,
      updateTime: Date.now(),
    }),
    "utf-8"
  );
};
export const readWaitFile = async (filePath: AbsolutePath) => {
  const content = readJson<WaitFileContent>(filePath.content);
  if (!content) {
    throw new Error("readWaitFile error");
  }
  return content;
};
export interface CheckWaitFileResult {
  checkTime: number;
  content: WaitFileContent;
}

export const check = async (params: {
  startTime: number;
  filePath: AbsolutePath;
}): Promise<CheckWaitFileResult> => {
  const { filePath, startTime } = params;
  const thisCheckTime = Date.now();
  const currentContent = await readWaitFile(filePath);
  const { name } = currentContent;
  await mergeWaitFile({
    filePath,
    content: {
      checkTime: [thisCheckTime],
    },
  });
  const {
    timeout = WaitDefaultConfig.timeout,
    interval = WaitDefaultConfig.interval,
    finish,
  } = currentContent;
  if (finish) {
    return {
      checkTime: thisCheckTime,
      content: currentContent,
    };
  }
  const timeSpan = thisCheckTime - startTime;
  if (timeSpan > timeout) {
    console.log(`${name} wait timeout`);
    await mergeWaitFile({
      filePath,
      content: {
        finish: true,
        result: false,
        message: "timeout",
      },
    });

    return {
      checkTime: thisCheckTime,
      content: await readWaitFile(filePath),
    };
  }
  console.log(`${name} wait ...`);
  await sleep(interval);
  return await check({
    startTime,
    filePath,
  });
};

export const wait = async (params: { filePath: string }) => {
  try {
    const { filePath } = unSafeObjectWrapper(params);
    if (!filePath) {
      throw new Error("filePath undefined");
    }
    const absoluteFilePath = new AbsolutePath({ content: filePath });
    const startTime = Date.now();
    const checkResult = await check({ startTime, filePath: absoluteFilePath });
    if (checkResult?.content.result) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
};

export const waitCmdName = "wait";

export const genWaitCommand = (params: {
  commandHelper: CommandHelper;
  waitResAbsoluteFilePath: AbsolutePath;
}) => {
  const { waitResAbsoluteFilePath, commandHelper } = params;
  const { programName, args } = commandHelper;
  const [parallelCmdName, ...rest] = args;
  const cmdName = `${programName} ${parallelCmdName} ${waitCmdName}`;
  const cmdParams = `${rest.join(" ")} -f ${waitResAbsoluteFilePath.content}`;
  const cmd = `${cmdName} ${cmdParams}`;
  return cmd;
};
