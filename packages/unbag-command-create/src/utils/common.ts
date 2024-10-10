import { AbsolutePath } from "unbag";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

export interface CreateCommandConfig {
  useInline: boolean;
  templates?: CreateTemplateConfig[];
}

export interface CreateTemplateConfig {
  name: string;
  path: AbsolutePath;
  description?: string;
  keywords?: string[];
}

export const listChildDir = async (dir?: string) => {
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

export const listFiles = async (dir?: string) => {
  const files: string[] = [];
  if (!dir) {
    return [];
  }
  const getFiles = async (currentDir: string) => {
    const fileList = (await fs.readdir(currentDir)) as string[];
    for (const file of fileList) {
      const name = path.resolve(currentDir, file);
      if ((await fs.stat(name)).isDirectory()) {
        await getFiles(name);
      } else {
        files.push(name);
      }
    }
  };
  await getFiles(dir);
  return files;
};

export const readJson = async <T>(path: string): Promise<T> => {
  let jsonObj: T | undefined = undefined;
  const content = (await fs.readFile(path, "utf-8")) as string;
  jsonObj = JSON.parse(content || "") as T;
  return jsonObj;
};

export const useInlineTemplates = async (): Promise<CreateTemplateConfig[]> => {
  const templatesDir = new AbsolutePath({
    content: path.resolve(
      fileURLToPath(import.meta.url),
      "../../..",
      "templates"
    ),
  });
  console.log({ templatesDir });
  const templates = await resolveTemplates({
    templatesDir,
  });

  return templates;
};

export interface PkgJson {
  name?: string;
  description?: string;
  keywords?: string[];
}

export const resolveTemplates = async (params: {
  templatesDir: AbsolutePath;
}): Promise<CreateTemplateConfig[]> => {
  const { templatesDir } = params;
  const templateDirList = await listChildDir(templatesDir.content);

  const templates: CreateTemplateConfig[] = await Promise.all([
    ...templateDirList.map(async (templateDir) => {
      const pkgJsonPath = path.resolve(templateDir, "package.json");
      const pkgJson = await readJson<PkgJson>(pkgJsonPath);
      if (!pkgJson.name) {
        throw new Error(`${pkgJsonPath} undefined name`);
      }
      return {
        name: pkgJson.name,
        path: new AbsolutePath({ content: templateDir }),
        description: pkgJson.description,
        keywords: pkgJson.keywords,
      };
    }),
  ]);

  return templates;
};
