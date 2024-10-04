import fs from "node:fs/promises";
import fsExtra from "fs-extra/esm";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type MaybePromise<T> = T | Promise<T>;

export const modifyJson = async <T, V = T>(
  path: string,
  modify: (input: T) => MaybePromise<V | undefined>
) => {
  let oldContent: string | undefined = undefined;
  let oldJson: T | undefined = undefined;
  try {
    oldContent = (await fs.readFile(path, "utf-8")) as string;
    oldJson = JSON.parse(oldContent || "");
  } catch (error) {}
  const newJson = (await modify(oldJson as T)) || "";
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
  await fsExtra.outputFile(path, newContent, "utf-8");
};

export const readJson = async <T>(path: string): Promise<T> => {
  let jsonObj: T | undefined = undefined;
  const content = (await fs.readFile(path, "utf-8")) as string;
  jsonObj = JSON.parse(content || "") as T;
  return jsonObj;
};
