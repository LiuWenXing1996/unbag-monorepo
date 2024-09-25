import { defineConfig } from "vitepress";

const baseUrl = "unbag-monorepo";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "unbag",
  base: `/${baseUrl}/`,
  description: "一个专门用来开发npm工具的包",
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: `/${baseUrl}/logo.svg` },
    ],
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "指引", link: "/guide/" },
      {
        text: "更新日志",
        link: "https://github.com/LiuWenXing1996/unbag/blob/main/packages/unbag/CHANGELOG.md",
      },
    ],
    sidebar: [
      { text: "开始", link: "/guide/" },
      { text: "配置", link: "/guide/config" },
      {
        text: "命令",
        items: [
          { text: "transform", link: "/commands/transform" },
          { text: "parallel", link: "/commands/parallel" },
          {
            text: "commit",
            link: "/commands/commit",
            items: [{ text: "lint", link: "/commands/commit/lint" }],
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/LiuWenXing1996/unbag-monorepo",
      },
    ],
  },
});
