# 配置

`unbag`会自动解析项目根目录下名为 `unbag.config.js` 的配置文件（也支持其他`JS`和`TS`扩展名）。最基础的配置文件是这样的

```js
// unbag.config.js
import { defineUserConfig } from "unbag";

export default defineUserConfig({
  // ...
});

```

也可以显式地通过 `--config` 选项指定一个配置文件（相对于`cwd`路径进行解析）

``` bash
unbag --config unbag-custom.config.js
```

## 智能提示



## 使用函数生成配置

可以在配置文件中导出一个函数，只要函数最后的返回值是合理的配置对象即可

```js
// unbag.config.js
import { defineUserConfig } from "unbag";


```