import { expect, test, describe } from "vitest";
import {
  modifyTemplateFileContent,
  TemplateConstValues,
  modifyProjectFiles,
  resolveTemplates,
  resolveTemplateConfig,
  TemplateMeta,
  collectNeedModifyProjectFiles,
  createProjectByTemplate,
  TemplateInputData,
} from "./template";
import { AbsolutePath } from "unbag";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentDir = new AbsolutePath({
  content: path.dirname(fileURLToPath(import.meta.url)),
});
const templatesDir = currentDir.resolve({ next: "../../templates/" });
const dataDir = currentDir.resolve({ next: "../../data/" });

describe("resolveTemplates", () => {
  test("至少找到一个以一个模板", async () => {
    const templates = await resolveTemplates({
      templatesDir,
    });
    expect(templates.length > 0).toBeTruthy();
  });
});

describe("modifyTemplateFileContent", () => {
  test("修改模板内容", async () => {
    const modifiedContent = await modifyTemplateFileContent({
      content: `
{{${TemplateConstValues.NAME}}}

{{${TemplateConstValues.DESCRIPTION}}}
      `,
      data: {
        [TemplateConstValues.NAME]: "name-test",
        [TemplateConstValues.DESCRIPTION]: "description-test",
      },
    });
    const newContent = `
name-test

description-test
      `;
    expect(modifiedContent).equal(newContent);
  });
});

describe("resolveTemplateConfig", () => {
  test("解析出正确的 base 模板配置", async () => {
    const baseTemplate = await resolveTemplateConfig({
      templateDir: templatesDir.resolve({ next: "./base" }),
    });
    const expectBaseTemplate: TemplateMeta = {
      name: "template-base",
      description: "template-base",
      files: ["./package.json"],
    };
    expect(JSON.stringify(baseTemplate)).equal(
      JSON.stringify(expectBaseTemplate)
    );
  });
});

describe("createProjectByTemplate", async () => {
  const baseTemplateDir = templatesDir.resolve({ next: "./base" });
  const targetProjectDir = dataDir.resolve({
    next: "./createProjectByTemplate",
  });
  const inputData: TemplateInputData = {};
  test("创建项目", async () => {
    await createProjectByTemplate({
      templateDir: baseTemplateDir,
      targetDir: targetProjectDir,
      data: inputData,
    });
    const baseTemplate = await resolveTemplateConfig({
      templateDir: templatesDir.resolve({ next: "./base" }),
    });
    console.log({ baseTemplate });
    if (!baseTemplate) {
      throw new Error("undefined baseTemplate");
    }
    const files = await collectNeedModifyProjectFiles({
      targetDir: dataDir.resolve({ next: "./base-test" }),
      meta: baseTemplate,
    });

    expect(files.length > 0).toBeTruthy();
  });
});

describe("collectNeedModifyProjectFiles", () => {
  test("收集到 base 模板中需要修改的文件", async () => {
    const baseTemplate = await resolveTemplateConfig({
      templateDir: templatesDir.resolve({ next: "./base" }),
    });
    console.log({ baseTemplate });
    if (!baseTemplate) {
      throw new Error("undefined baseTemplate");
    }
    const files = await collectNeedModifyProjectFiles({
      targetDir: dataDir.resolve({ next: "./base-test" }),
      meta: baseTemplate,
    });

    expect(files.length > 0).toBeTruthy();
  });
});

describe("modifyProjectFiles", () => {
  test("", async () => {
    const aaa = await modifyProjectFiles({
      targetDir: new AbsolutePath({
        content: path.resolve(
          fileURLToPath(import.meta.url),
          "../../../templates/base/"
        ),
      }),
      meta: {
        name: "sss",
        files: ["./package.json", "**/*.ts"],
      },
      data: {
        [TemplateConstValues.NAME]: "ssss",
        [TemplateConstValues.DESCRIPTION]: "ddddd",
      },
    });
    expect(1).equal(1);
  });
});
