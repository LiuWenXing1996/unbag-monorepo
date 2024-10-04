---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: unbag
  text: 一个专门用来开发<br/>npm包的工具
  tagline: 简单、快速
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/
  image:
    src: /logo.svg
    alt: unbag

features:
  - icon:
      src: /plugin.svg
    title: 自定义插件
    details: 支持自定义插件
  - icon:
      src: /package-format.svg
    title: 生成 esm 和 cjs 两种格式
    details: 支持输出 esm 和 cjs 两种格式
  - icon:
      src: /parallel-tasks.svg
    title: 多个命令同时执行
    details: 支持支持同时运行多个npm script
  - icon:
      src: /typescript-def.svg
    title: 生成 typescript 类型定义文件
    details: 支持生成 typescript 类型定义文件
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #FFCA28 30%, #E2A610);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #FFCA99 50%, #FFCA99 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.VPFeatures.VPHomeFeatures .VPImage{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: var(--vp-c-default-soft);
  width: 48px;
  height: 48px;
  font-size: 24px;
  padding: 10px;
  transition: background-color 0.25s;
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>