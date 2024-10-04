import { usePath } from "./path";
import fs from "node:fs/promises";
import fsExtra from "fs-extra/esm";
import { MaybePromise } from "./types";
export type FsUtils = typeof fs & typeof fsExtra & CustomFsUtils;
export type CustomFsUtils = ReturnType<typeof useCustomFsUtils>;

export const useCustomFsUtils = () => {
  const path = usePath();
  const { readFile, readdir, stat } = fs;
  const { outputFile, pathExists } = fsExtra;

  const readJson = async <T>(path: string): Promise<T> => {
    let jsonObj: T | undefined = undefined;
    const content = (await readFile(path, "utf-8")) as string;
    jsonObj = JSON.parse(content || "") as T;
    return jsonObj;
  };

  const tryReadJson = async <T>(path: string): Promise<undefined | T> => {
    let jsonObj: T | undefined = undefined;
    try {
      jsonObj = await readJson<T>(path);
    } catch (error) {
      console.log("tryReadJson error:", path);
    }
    return jsonObj;
  };

  const modifyJson = async <T, V = T>(
    path: string,
    modify: (input?: T) => MaybePromise<V | undefined>
  ) => {
    let oldContent: string | undefined = undefined;
    let oldJson: T | undefined = undefined;
    try {
      oldContent = (await readFile(path, "utf-8")) as string;
      oldJson = JSON.parse(oldContent || "");
    } catch (error) {}
    const newJson = (await modify(oldJson)) || "";
    const detectIndent = await import("detect-indent");
    const detectNewline = await import("detect-newline");
    const DEFAULT_INDENT = 2;
    const CRLF = "\r\n";
    const LF = "\n";
    const indent =
      detectIndent.default(oldContent || "").indent || DEFAULT_INDENT;
    const newline = detectNewline.detectNewline(oldContent || "");
    let newContent = JSON.stringify(newJson, null, indent);
    if (newline === CRLF) {
      newContent = newContent.replace(/\n/g, CRLF) + CRLF;
    }
    newContent = newContent + LF;
    await outputFile(path, newContent, "utf-8");
  };

  const listFiles = async (dir?: string) => {
    const files: string[] = [];
    if (!dir) {
      return [];
    }
    const getFiles = async (currentDir: string) => {
      const fileList = (await readdir(currentDir)) as string[];
      for (const file of fileList) {
        const name = path.join(currentDir, file);
        if ((await stat(name)).isDirectory()) {
          await getFiles(name);
        } else {
          files.push(name);
        }
      }
    };
    await getFiles(dir);
    return files;
  };
  const listChildDir = async (dir?: string) => {
    const dirs: string[] = [];
    if (!dir) {
      return [];
    }
    const fileList = (await readdir(dir)) as string[];
    for (const file of fileList) {
      const name = path.join(dir, file);
      if ((await stat(name)).isDirectory()) {
        dirs.push(name);
      }
    }
    return dirs;
  };
  const isFile = async (path: string) => {
    try {
      const _stat = await stat(path);
      return _stat.isFile();
    } catch {
      return false;
    }
  };
  const isDirectory = async (path: string) => {
    try {
      const _stat = await stat(path);
      return _stat.isDirectory();
    } catch {
      return false;
    }
  };
  const delPath = async (path: string) => {
    const isExist = await pathExists(path);
    if (!isExist) {
      return;
    }
    await fs.rm(path, { recursive: true, force: true });
  };
  return {
    delPath,
    readJson,
    modifyJson,
    tryReadJson,
    listFiles,
    listChildDir,
    isFile,
    isDirectory,
  };
};

export const useFs = (): FsUtils => {
  const customFsUtils = useCustomFsUtils();

  return {
    ...fs,
    ...fsExtra,
    ...customFsUtils,
  };
};
