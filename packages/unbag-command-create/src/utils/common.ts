import { AbsolutePath } from "unbag";
import { useFs, usePath } from "unbag";
import { fileURLToPath } from "node:url";

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

export const useInlineTemplates = async (): Promise<CreateTemplateConfig[]> => {
  const path = usePath();
  const templatesDir = new AbsolutePath({
    content: path.resolve(
      fileURLToPath(import.meta.url),
      "../../..",
      "templates"
    ),
  });
  const templates = await resolveTemplates({
    templatesDir,
    presetList: [
      {
        name: "base",
        description: "基础模板",
        keywords: ["base-template"],
      },
    ],
  });

  return templates;
};

export const resolveTemplates = async (params: {
  templatesDir: AbsolutePath;
  presetList: Omit<CreateTemplateConfig, "path">[];
  disabledCheckTemplate?: boolean;
}): Promise<CreateTemplateConfig[]> => {
  const { templatesDir, presetList, disabledCheckTemplate } = params;
  const fs = useFs();

  const templates: CreateTemplateConfig[] = presetList.map((l) => {
    return {
      path: templatesDir.resolve({ next: l.name }),
      ...l,
    };
  });

  if (!disabledCheckTemplate) {
    await Promise.all([
      ...templates.map(async (template) => {
        const pathValue = template.path.content;
        const pathIsExists = await fs.pathExists(pathValue);
        if (!pathIsExists) {
          throw new Error(`${pathValue} must exist`);
        }
        const isDirectory = await fs.isDirectory(pathValue);
        if (!isDirectory) {
          throw new Error(`${pathValue} must be directory`);
        }
      }),
    ]);
  }

  return templates;
};
