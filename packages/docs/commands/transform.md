# transform

批量转换文件

## 用法

::: code-group

```sh [npm]
$ npm unbag transform
```

```sh [pnpm]
$ pnpm unbag transform
```

```sh [yarn]
$ yarn unbag transform
```
:::

启动`观察模式`

::: code-group

```sh [npm]
$ npm unbag transform -w
# 或者
$ npm unbag transform --watch
```

```sh [pnpm]
$ pnpm unbag transform -w
# 或者
$ pnpm unbag transform --watch
```

```sh [yarn]
$ yarn unbag transform -w
# 或者
$ yarn unbag transform --watch
```
:::

## 配置
在对应的`unbag.config.js`的`transform`的属性设置配置

### `entry`
- 类型:`string`
- 是否必填：是
- 需要转换的源码文件夹的相对路径，相对于配置文件

### `sourcemap`
- 类型:`boolean`
- 默认值:`false`
- 是否输出sourcemap
  
### `plugins`

- 类型:`Plugin[]`
- 是否必填：是
- 插件配置