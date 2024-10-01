import { defineUserConfig, DEFAULT_COMMIT_TYPES } from "unbag";
import { checkScope } from "unbag-build-tools";

export default defineUserConfig({
  release: {
    // TODO：这个地方的名字似乎要和 package name 相对应
    scope: {
      name: "unbag-docs",
      check: async ({ name }) => {
        return await checkScope(name);
      },
    },
    preset: {
      params: {
        types: [
          { type: "docs", section: "Documentation", hidden: false },
          ...DEFAULT_COMMIT_TYPES,
        ],
      },
    },
    changelog: {
      header: `我是更新日志的头部!!!`,
      footer: `我是更新日志的脚部!!!`,
    },
  },
});
