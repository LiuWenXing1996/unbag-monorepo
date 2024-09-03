import path from "./path";
import fs from "node:fs/promises";
import { MaybePromise } from "./types";
import fsExtra from "fs-extra/esm";

export const useFs = () => {
  const { readFile, readdir, stat } = fs;
  const { emptyDir, ensureDir, copy, outputFile, pathExists } = fsExtra;

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
    dir = dir || "/";
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
  return {
    ...fs,
    outputFile,
    emptyDir,
    ensureDir,
    copy,
    pathExists,
    readJson,
    modifyJson,
    tryReadJson,
    listFiles,
    isFile,
    isDirectory,
  };
};
