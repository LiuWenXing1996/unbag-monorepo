import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { AbsolutePath } from "@/utils/path";
import { v4 as uuidv4 } from "uuid";
import { useTransformTempDir } from "../utils";
import dayjs from "dayjs";
import { useFs } from "@/utils/fs";
import { FinalUserConfig } from "@/core/user-config";
import { TransformConfig } from "..";

export type TransformProcessTask = (params: {
  tempDir: AbsolutePath;
}) => Promise<void>;

export class TransformActionProcessUid {
  #content: string;
  constructor() {
    this.#content = uuidv4();
  }
  get content() {
    return this.#content;
  }
}

export const useTransformActionProcessMap = (params: {
  finalUserConfig: FinalUserConfig<TransformConfig>;
}) => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({ locale: finalUserConfig.base.locale });
  const transformTempDir = useTransformTempDir({ finalUserConfig });
  const processMap = new Map<
    TransformActionProcessUid,
    {
      name: string;
      tempDir: AbsolutePath;
    }
  >();
  const getProcess = (params: { uid: TransformActionProcessUid }) => {
    const { uid } = params;
    const process = processMap.get(uid);
    if (!process) {
      throw new Error(
        message.transform.action.processParentNotFound({ uid: uid.content })
      );
    }
    return {
      ...process,
    };
  };
  const createProcess = async (params: {
    task: (params: { tempDir: AbsolutePath }) => Promise<void>;
    name: string;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, task } = params;
    const fs = useFs();
    const uid = new TransformActionProcessUid();
    const fileName = name.replaceAll("/", "@");
    const tempDir = transformTempDir.resolve({
      next: `./${fileName}-${uid.content}`,
    });
    processMap.set(uid, {
      tempDir,
      name,
    });
    const startTime = Date.now();
    log.info(
      message.transform.action.taskProcessing({
        name,
        startTime: dayjs(startTime).format("HH:mm:ss"),
      })
    );
    await fs.ensureDir(tempDir.content);
    try {
      await task({ tempDir });
      const endTime = Date.now();
      const interval = Number(((endTime - startTime) / 1000).toFixed(2));
      log.info(
        message.transform.action.taskEnd({
          name,
          interval,
          endTime: dayjs(endTime).format("HH:mm:ss"),
        })
      );
    } catch (error) {
      const endTime = Date.now();
      const interval = Number(((endTime - startTime) / 1000).toFixed(2));
      log.info(
        message.transform.action.taskFail({
          name,
          interval,
          endTime: dayjs(endTime).format("HH:mm:ss"),
        })
      );
      log.error(error);
    }

    return uid;
  };
  return {
    createProcess,
    getProcess,
  };
};
