# parallel

同时运行多个`npm scripts`，并且可以通过自定义的异步函数控制每一个`npm scripts`的启动时机。

## 用法

::: code-group

```sh [npm]
$ npm unbag parallel
```

```sh [pnpm]
$ pnpm unbag parallel
```

```sh [yarn]
$ yarn unbag parallel
```
:::

## 配置
在对应的`unbag.config.js`的`parallel`的属性设置配置

### `tempDir`
- 类型:`string`
- 是否必填：否

为了给每一个命令提供一个启动标记，`unbag`会将启动标记
- 临时文件存放地址

### `commands`
- 类型:`ParallelCommand[]`
- 是否必填：是
- 类型声明：

```ts
export interface ParallelCommand {
  name: string;
  wait?: () => MaybePromise<boolean>;
  waitTimeout?: number;
  waitInterval?: number;
  npmScript: string;
}
```

例如：
