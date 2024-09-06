import { defineUserConfig } from "unbag";

export default defineUserConfig({
  release: {
    // TODO：这个地方的名字似乎要和 package name 相对应
    scope: "docs",
    changelog: {
      header: `我是更新日志的头部!!!`,
      footer: `我是更新日志的脚部!!!`,
    },
    commit: {
      // disable: true,
    },
    tag: {
      // TODO:这个 prefix 是不是不能自定义比较好？
      prefix: "docs@",
      // disable: true,
    },
  },
});
