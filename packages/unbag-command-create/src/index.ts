import { read } from "./read";

import { defineCommand } from "unbag";
import { CreateCommandConfig } from "@/utils/common";

export const CreateCommand = defineCommand({
  name: "create",
  defaultConfig: {
    useInline: true,
  } as CreateCommandConfig,
  run: async ({ finalUserConfig, helper }) => {
    const config = finalUserConfig.commandConfig as CreateCommandConfig;
    await read({ config, commandHelper: helper });
  },
});
export { read } from "./read";
export { type CreateTemplateConfig, resolveTemplates } from "@/utils/common";
