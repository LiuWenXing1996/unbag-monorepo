import i18next from "i18next";
import { initI18n } from "./i18n";
import { usePrompts } from "./utils/prompts";
import { CommandHelper, useFs, usePath } from "unbag";
import {
  CreateCommandConfig,
  CreateTemplateConfig,
  useInlineTemplates,
} from "@/utils/common";

export const read = async (params: {
  config: CreateCommandConfig;
  commandHelper: CommandHelper;
}) => {
  const { config, commandHelper } = params;
  await initI18n(commandHelper.locale);
  const { input, select, confirm } = usePrompts();
  const fs = useFs();
  const path = usePath();

  const defaultProjectParentDir = process.cwd();
  let currentProjectParentDir = defaultProjectParentDir;
  let projectParentDirSelectFinish = false;
  do {
    enum SelectValueEnum {
      UseCurrentDir,
      FindParentDir,
      FindChildDir,
    }
    const currentDir = currentProjectParentDir;
    const parentDir = path.dirname(currentProjectParentDir);
    const childDirList = await fs.listChildDir(currentDir);
    const selectedValue = await select({
      message: i18next.t("project.projectParentDir.select"),
      choices: [
        {
          name: `${i18next.t(
            "project.projectParentDir.values.useCurrentDir"
          )} ${currentDir}`,
          value: SelectValueEnum.UseCurrentDir,
        },
        {
          name: `${i18next.t(
            "project.projectParentDir.values.findParentDir"
          )} ${parentDir}`,
          value: SelectValueEnum.FindParentDir,
        },
        {
          name: `${i18next.t("project.projectParentDir.values.findChildDir")}`,
          value: SelectValueEnum.FindChildDir,
          disabled: !(childDirList.length > 0),
        },
      ],
    });
    if (selectedValue === SelectValueEnum.UseCurrentDir) {
      currentProjectParentDir = currentDir;
      projectParentDirSelectFinish = true;
    } else if (selectedValue === SelectValueEnum.FindParentDir) {
      currentProjectParentDir = parentDir;
      projectParentDirSelectFinish = false;
    } else if (selectedValue === SelectValueEnum.FindChildDir) {
      const childDirSelectedValue = await select({
        message: i18next.t("project.projectParentDir.selectChildDir"),
        choices: childDirList.map((e) => {
          return {
            name: e,
            value: e,
          };
        }),
      });
      currentProjectParentDir = childDirSelectedValue;
      projectParentDirSelectFinish = false;
    }
  } while (!projectParentDirSelectFinish);

  const projectName = await input({
    message: i18next.t("project.name.input"),
    required: true,
  });

  const projectDescription = await input({
    message: i18next.t("project.description.input"),
  });
  const inlineTemplates = await useInlineTemplates();

  const templates: CreateTemplateConfig[] = [
    ...(config.useInline ? inlineTemplates : []),
    ...(config.templates || []),
  ];

  const projectTemplate = await select({
    message: i18next.t("project.template.select"),
    choices: [
      ...templates.map((template) => {
        return {
          name: `${template.name}(${template.path.content})`,
          value: template.path.content,
          description: template.description,
        };
      }),
    ],
  });
  const templateDir = projectTemplate;

  const projectDir = projectName.trim();
  const targetDir = path.resolve(currentProjectParentDir, projectDir);
  const isExist = await fs.pathExists(targetDir);
  let forceOverwrite = false;
  if (isExist) {
    forceOverwrite = await confirm({
      message: i18next.t("project.targetDir.forceOverwrite.confirm", {
        fileName: projectDir,
      }),
      default: false,
    });
    if (!forceOverwrite) {
      console.log(i18next.t("project.exit"));
      process.exit(0);
    }
    fs.emptyDir(targetDir);
  }

  await fs.copy(templateDir, targetDir);
  await fs.modifyJson<any>(
    path.resolve(targetDir, "./package.json"),
    async (input) => {
      return {
        ...input,
        description: projectDescription,
        name: projectName,
      };
    }
  );
  console.log(i18next.t("project.success", { pathName: targetDir }));
};
