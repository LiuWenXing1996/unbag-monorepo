import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BaseManifest } from "@pnpm/types";

export interface TemplateConfig {
  name: string;
  path: string;
  description?: string;
  keywords?: string[];
}

const listChildDir = async (dir?: string) => {
  const dirs: string[] = [];
  if (!dir) {
    return [];
  }
  const fileList = (await fs.readdir(dir)) as string[];
  for (const file of fileList) {
    const name = path.join(dir, file);
    if ((await fs.stat(name)).isDirectory()) {
      dirs.push(name);
    }
  }
  return dirs;
};

const readJson = async <T>(path: string): Promise<T> => {
  let jsonObj: T | undefined = undefined;
  const content = (await fs.readFile(path, "utf-8")) as string;
  jsonObj = JSON.parse(content || "") as T;
  return jsonObj;
};

export const useCustomTemplates = async (): Promise<TemplateConfig[]> => {
  const templatesDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../../..",
    "templates"
  );

  const templateDirList = await listChildDir(templatesDir);

  const templates: TemplateConfig[] = await Promise.all([
    ...templateDirList.map(async (templateDir) => {
      const pkgJsonPath = path.resolve(templateDir, "package.json");
      const pkgJson = await readJson<BaseManifest>(pkgJsonPath);
      if (!pkgJson.name) {
        throw new Error(`${pkgJsonPath} undefined name`);
      }
      return {
        name: pkgJson.name,
        path: templateDir,
        description: pkgJson.description,
        keywords: pkgJson.keywords,
      };
    }),
  ]);

  return templates;
};
