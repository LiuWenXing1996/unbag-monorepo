import path from "node:path";
import { useFs } from "@/utils/fs";
import { sleep } from "../../utils/common";
export interface WaitConfig {
  timeout: number;
  interval: number;
}
export const WaitDefaultConfig: WaitConfig = {
  timeout: 10000,
  interval: 500,
};
export interface WaitResFileContent {
  lastUpdateTime?: number;
  lastCheckTime?: number;
  tag?: string;
  finish?: boolean;
  result?: boolean;
  message?: string;
  interval?: number;
  timeout?: number;
}
export const genWaitResAbsoluteFilePath = (params: {
  absoluteTempDir: string;
  tag: string;
}) => {
  const { absoluteTempDir, tag } = params;
  const absoluteFilePath = path.resolve(absoluteTempDir, `${tag}.json`);
  return absoluteFilePath;
};
export const writeWaitResFile = async (params: {
  absoluteFilePath: string;
  content?: WaitResFileContent;
  merge?: boolean;
}) => {
  const fs = useFs();
  const { absoluteFilePath, content, merge } = params;
  await fs.modifyJson<WaitResFileContent>(absoluteFilePath, (oldJson) => {
    if (merge) {
      return {
        ...oldJson,
        ...content,
      };
    } else {
      return content;
    }
  });
};
export const readWaitResFile = async (absoluteFilePath: string) => {
  const fs = useFs();
  try {
    return fs.readJson<WaitResFileContent>(absoluteFilePath);
  } catch (error) {}
};
export const WaitCmdName = "parallel-wait";
export interface CheckWaitFileResult {
  checkTime: number;
  content: WaitResFileContent;
}
export const checkWaitFile = async (params: {
  name: string;
  absoluteFilePath: string;
}): Promise<CheckWaitFileResult> => {
  const startTime = Date.now();
  const { absoluteFilePath, name } = params;
  const check = async (): Promise<CheckWaitFileResult> => {
    const thisCheckTime = Date.now();
    const currentContent = await readWaitResFile(absoluteFilePath);
    if (!currentContent) {
      throw Error();
    }
    await writeWaitResFile({
      absoluteFilePath,
      merge: true,
      content: {
        lastCheckTime: thisCheckTime,
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
      const timeoutContent: WaitResFileContent = {
        finish: true,
        result: false,
        message: "timeout",
      };
      await writeWaitResFile({
        absoluteFilePath,
        merge: true,
        content: {
          ...timeoutContent,
        },
      });
      return {
        checkTime: thisCheckTime,
        content: {
          ...currentContent,
          ...timeoutContent,
        },
      };
    }
    console.log(`${name} wait ...`);
    await sleep(interval);
    return await check();
  };
  return await check();
};

// export const checkWaitFuncResByFile = async (params: {
//   name: string;
//   tempDir?: string;
//   tag: string;
//   timeout?: number;
//   interval?: number;
// }) => {
//   const {
//     name,
//     tempDir = defaultTempDir,
//     tag,
//     timeout = 10000,
//     interval = 500,
//   } = params;
//   const filePath = getResFilePath({ tempDir, tag });
//   const startTime = Date.now();
//   let content = "";
//   const tryGetRes = async () => {
//     console.log(`${name} wait ...`);
//     let timeSpan = Date.now() - startTime;
//     if (timeSpan > timeout) {
//       return A;
//     }
//     try {
//       content = await fs.readFile(filePath, "utf-8");
//     } catch (error) {}
//     if (!content) {
//       await sleep(interval);
//       await tryGetRes();
//     }
//   };
//   await tryGetRes();
//   return content === SUCCESS;
// };
export const genWaitCommand = (params: { name: string; tag: string }) => {
  const { tag, name } = params || {};
  let cmd = `unbag ${WaitCmdName} -n ${name} -tg ${tag}`;
  return cmd;
};
