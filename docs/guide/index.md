# 开始

使用`unbag`可以很方便的输出以下资源：

- `esm`格式的包
- `cjs`格式的包
- 包的`d.ts`类型声明文件
- ...(更多类型的输出资源可以通过插件扩展)

`unbag`还提供了一个很有用的`parallel`命令，可以支持同时运行多个`npm scripts`，并且可以控制每一个`npm scripts`的启动时机。

## 安装

::: code-group

```sh [npm]
$ npm add -D unbag
```

```sh [pnpm]
$ pnpm add -D unbag
```

```sh [yarn]
$ yarn add -D unbag
```
:::

## 使用

在`package.json`中添加以下`scripts`
```json
{
  "scripts": {
    "build": "unbag transform",
    "dev": "unbag transform -w"
  },
}
```
在项目根目录添加配置文件，unbag 会自动解析项目根目录下名为 `unbag.config.js` 的配置文件（也支持其他`JS`和`TS`扩展名）。你可以显式地通过 `--config` 选项指定一个配置文件（相对于`cwd`路径进行解析）
```js
// unbag.config.js
import { TsToDtsPlugin, TsToJsPlugin, defineConfig } from "unbag";

export default defineConfig({
  transform: {
    entry: "./src",
    sourcemap: true,
    plugins: [
      {
        config: {
          output: "./dist/types",
        },
        plugin: TsToDtsPlugin(),
      },
      {
        config: {
          output: "./dist/esm",
        },
        plugin: TsToJsPlugin({
          format: "esm",
        }),
      },
      {
        config: {
          output: "./dist/cjs",
        },
        plugin: TsToJsPlugin({
          format: "cjs",
        }),
      },
    ],
  },
});

```

尝试在项目的`src`目录下添加一些源码文件，比如

```ts
// src/index.ts
export const hello = () => {
  console.log("hello world");
};
```

运行以下命令，可以看到在`dist`文件夹中输出了三种资源：`esm`格式的包、`cjs`格式的包、包的`d.ts`类型声明文件
::: code-group

```sh [npm]
$ npm build
```

```sh [pnpm]
$ pnpm build
```

```sh [yarn]
$ yarn build
```
:::

使用以下命令，可以启动观察模式，`unbag`会自动检测`entry`中的文件变化，然后自动重新运行`transform`
::: code-group

```sh [npm]
$ npm dev
```

```sh [pnpm]
$ pnpm dev
```

```sh [yarn]
$ yarn dev
```
:::