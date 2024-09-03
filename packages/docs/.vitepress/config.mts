import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "unbag",
  base: "/unbag/",
  description: "一个专门用来开发npm工具的包",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/unbag/logo.svg" }],
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
      {
        text: "命令",
        items: [
          { text: "transform", link: "/commands/transform" },
          { text: "parallel", link: "/commands/parallel" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/LiuWenXing1996/unbag" },
    ],
  },
});
