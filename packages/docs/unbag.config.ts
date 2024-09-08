import { defineUserConfig } from "unbag";
import { checkScope } from "../../scripts/scopes";

export default defineUserConfig({
  log: {
    debug: false,
  },
  release: {
    // TODO：这个地方的名字似乎要和 package name 相对应
    scope: {
      name: "unbag-docs",
      check: async ({ name }) => {
        return await checkScope(name);
      },
    },
    branch: {
      mainCheckDisable: true,
      cleanCheckDisable: true,
    },
    bump: {
      versionFileWriteDisable: true,
    },
    changelog: {
      header: `我是更新日志的头部!!!`,
      footer: `我是更新日志的脚部!!!`,
    },
    commit: {
      disable: true,
    },
    tag: {
      // TODO:这个 prefix 是不是不能自定义比较好？
      prefix: "docs@",
      disable: true,
    },
  },
});
