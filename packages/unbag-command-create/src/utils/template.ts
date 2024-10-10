import { AbsolutePath, RelativePath } from "unbag";
import fs from "fs-extra";
import path from "node:path";
import { template } from "radash";
import { listChildDir, listFiles } from "./common";
import micromatch from "micromatch";

export interface TemplateMeta {
  name: string;
  description?: string;
  keywords?: string[];
  keepMeta?: boolean;
  files?: string[];
  vars?: {
    [varName: string]: TemplateMetaVar;
  };
  fileNameMapping?: {
    [namePattern: string]: {
      replacePattern: string;
      replaceString: string;
      replaceAll?: boolean;
    };
  };
}

export type TemplateMetaVar =
  | {
      type: "input";
      description: string;
      required?: boolean;
    }
  | {
      type: "select";
      description: string;
      choices: {
        name: string;
        value: string;
        description?: string;
        disabled?: boolean;
      }[];
    }
  | {
      type: "confirm";
      description: string;
      default?: boolean;
    }
  | {
      type: "number";
      description: string;
      default?: boolean;
      min?: number;
      max?: number;
      step?: number | "any";
      required?: boolean;
    }
  | {
      type: "checkbox";
      description: string;
      required?: boolean;
      choices: {
        name: string;
        value: string;
        description?: string;
        disabled?: boolean;
      }[];
    };

export interface TemplateConfig {
  path: AbsolutePath;
  meta: TemplateMeta;
}

export const TemplateMetaFileName = "_template_meta_.json";

export enum TemplateConstValues {
  NAME = "NAME",
  DESCRIPTION = "DESCRIPTION",
}

export type TemplateInputData = {
  defaults: {
    name: string;
    description?: string;
  };
  helpers: {
    // TODO:注入 lodash change-case
  };
  vars: {
    [varName: string]: string | boolean | number | undefined;
  };
};

export const resolveTemplates = async (params: {
  templatesDir: AbsolutePath;
}): Promise<TemplateConfig[]> => {
  const { templatesDir } = params;
  const templateDirList = await listChildDir(templatesDir.content);
  const templates: TemplateConfig[] = [];

  for (const templateDir of templateDirList) {
    const templateAbsoluteDir = new AbsolutePath({ content: templateDir });
    const templateConfig = await resolveTemplateConfig({
      templateDir: templateAbsoluteDir,
    });
    if (templateConfig) {
      templates.push({
        meta: templateConfig,
        path: templateAbsoluteDir,
      });
    }
  }

  return templates;
};

export const modifyTemplateFileContent = async (params: {
  content: string;
  data: {
    [key in TemplateConstValues]: string;
  };
}) => {
  const { content, data } = params;
  let newContent = content || "";
  for (const templateConstValue of Object.values(TemplateConstValues)) {
    newContent = newContent.replaceAll(
      `{{${templateConstValue}}}`,
      data[templateConstValue]
    );
  }
  return newContent;
};

export const resolveTemplateConfig = async (params: {
  templateDir: AbsolutePath;
}): Promise<TemplateMeta | undefined> => {
  try {
    const { templateDir } = params;
    const tplConfigJsonPath = path.resolve(
      templateDir.content,
      TemplateMetaFileName
    );
    const templateConfig = (await fs.readJson(tplConfigJsonPath)) as
      | Partial<TemplateMeta>
      | undefined;

    if (!templateConfig) {
      return;
    }

    if (!templateConfig.name) {
      return;
    }
    return {
      name: templateConfig.name,
      description: templateConfig.description,
      keywords: templateConfig.keywords,
      files: templateConfig.files,
      keepMeta: templateConfig.keepMeta,
    };
  } catch (error) {}
};

export const collectNeedModifyProjectFiles = async (params: {
  targetDir: AbsolutePath;
  meta: TemplateMeta;
}): Promise<AbsolutePath[]> => {
  const files: AbsolutePath[] = [];
  const { meta, targetDir } = params;
  const projectFiles = await listFiles(targetDir.content);
  const projectRelativeFiles = projectFiles.map((e) => {
    return path.relative(targetDir.content, e);
  });
  const matchedFiles = micromatch(projectRelativeFiles, meta.files || []);
  for (const matchedFile of matchedFiles) {
    files.push(targetDir.resolve({ next: matchedFile }));
  }
  return files;
};

export const modifyProjectFiles = async (params: {
  targetDir: AbsolutePath;
  meta: TemplateMeta;
  data: {
    [key in TemplateConstValues]: string;
  };
}) => {
  const { meta, targetDir, data } = params;
  const { keepMeta } = meta;
  const needModifyProjectFiles = await collectNeedModifyProjectFiles({
    targetDir,
    meta,
  });
  for (const needModifyProjectFile of needModifyProjectFiles) {
    if (needModifyProjectFile.content.indexOf(targetDir.content) !== 0) {
      throw new Error(
        `${needModifyProjectFile.content} 必须包含在 ${targetDir.content} 内`
      );
    }
    const fileContent = await fs.readFile(
      needModifyProjectFile.content,
      "utf-8"
    );
    let newFileContent = fileContent || "";
    for (const templateConstValue of Object.values(TemplateConstValues)) {
      newFileContent = template(
        newFileContent,
        {
          templateConstValue: data[templateConstValue],
        },
        new RegExp(`{{${templateConstValue}}}`, "g")
      );
    }
    await fs.outputFile(needModifyProjectFile.content, newFileContent);
  }
  if (!keepMeta) {
    const metaFilePath = targetDir.resolve({ next: TemplateMetaFileName });
    fs.rm(metaFilePath.content, { force: true });
  }
};

export const createProjectByTemplate = async (params: {
  templateDir: AbsolutePath;
  targetDir: AbsolutePath;
  data: {
    [key in TemplateConstValues]: string;
  };
}) => {
  const { templateDir, targetDir, data } = params;
  const templateMeta = await resolveTemplateConfig({ templateDir });
  if (!templateMeta) {
    throw new Error(`${templateDir.content} undefined templateMeta`);
  }
  await fs.copy(templateDir.content, targetDir.content);
  await modifyProjectFiles({ targetDir, meta: templateMeta, data });
};
