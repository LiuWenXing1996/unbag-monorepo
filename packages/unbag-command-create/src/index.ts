import { read } from "./read";

import { defineCommand } from "unbag";
import { CreateCommandConfig } from "@/utils/common";

export const CreateCommand = defineCommand({
  name: "create",
  defaultConfig: {
    useInline: true,
  } as CreateCommandConfig,
  run: async ({ finalUserConfig }) => {
    const config = finalUserConfig.commandConfig as CreateCommandConfig;
    await read({ config });
  },
});
export { read } from "./read";
export { type CreateTemplateConfig, resolveTemplates } from "@/utils/common";
