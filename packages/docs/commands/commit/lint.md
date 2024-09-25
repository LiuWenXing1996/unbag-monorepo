# lint

基于一份约定的提交[规范](https://www.conventionalcommits.org/)，在终端中提供一个交互界面，在界面中可以选择`commit`的`type`和`scope`等参数，最终将会产生一条提交信息，并使用`git commit`提交。

## 用法

::: code-group

```sh [npm]
$ npm unbag commit
```

```sh [pnpm]
$ pnpm unbag commit
```

```sh [yarn]
$ yarn unbag commit
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
