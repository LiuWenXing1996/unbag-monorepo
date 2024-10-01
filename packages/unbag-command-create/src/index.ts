import { read } from "./read";

import { defineCliCommand } from "unbag";
import { CreateCommandConfig } from "@/utils/common";

export const CreateCommand = defineCliCommand<CreateCommandConfig>({
  useDefaultConfig: () => {
    return {
      useInline: true,
    };
  },
  defineActions: ({ defineAction }) => {
    return [
      defineAction({
        name: "create",
        run: async ({ finalUserConfig }) => {
          const config = finalUserConfig.commandConfig as CreateCommandConfig;
          await read({ config });
        },
      }),
    ];
  },
});
export { read } from "./read";
export { type CreateTemplateConfig, resolveTemplates } from "@/utils/common";
