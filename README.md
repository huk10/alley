# Alley

![](https://img.shields.io/badge/license-MIT-brightgreen.svg)
![](https://img.shields.io/badge/types-included-blue.svg)
![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)
![](https://github.com/huk10/alley/wiki/coverage.svg)

`alley` 是基于基数树实现的一个数据结构。可以使用一个字符串作为 `key`，将任意数据结构存储到树上。并且这个 `key` 支持命名参数和通配符。

在 `alley` 中，任意一个 `key` 都是唯一的，它们不会收到添加顺序的影响。

## Todos

- [ ] 优化错误提示。
- [ ] 优化性能、代码结构。
- [ ] 补全字符转义功能。

## Rules

用于向 `alley` 存储数据用到的 `key` 以下将它称为 `pattern`。查询时用到的 `key` 称为 `path`。

`alley` 允许在 `pattern` 中使用命名参数，只需将参数名称放入大括号 `{}` 内。此外它也支持通配符 `*`，用于匹配任意字符。

### 命名参数的规则

命名参数需要使用大括号 `{}` 将其包裹。并且命名参数会用 `-`、`.`和 `/` 作为边界，它的开始没有任何约束，但是它的后面必须有一个边界字符，或者它在字符串的末尾。

_注意：在 `pattern` 解析时 `{}` 是寻找的最近合并的 `{}` 如：`/user/{{year}-{month}.}`，在解析时第一个 `{` 会认为是静态字符。_

**约束**

命名参数支持约束条件，它需要使用 `<>` 包裹如：`/user/{id<uuid>}`。不过 `alley` 并不会去处理它，它只是会将其解析出来交给上层使用方去处理。

### 通配符的规则

通配符 `*` 用于后续的匹配任意字符，不过它只能出现在路径的末尾。`/user/*` 能匹配 `/user/123` 或 `/user/abc/123`。

只能出现在 `pattern` 的末尾的原因是：它和命名参数在某种场景下是可以匹配到同一个 `path` 的，这样就会依赖于 `pattern` 的添加顺序。

如果需要匹配 `path` 中间的任意字符，请使用命名参数代替。如：`/user/*/123` 请使用 `/user/{id}/12` 代替。

`alley` 希望的是存储结构中的 `pattern` 是唯一的并且也不会依赖顺序等隐藏规则。一个 `path` 只能匹配一个 `pattern`。

### 限制

为了避免歧义，`alley` 做了以下限制：

- 同一层级下不能同时存在多个命名参数和通配符。
- 通配符必须出现在路径的末尾。

如：`/user/{id}` 和 `/user/*` 是不允许同时存在的。`/user/{name}` 和 `/user/{id}` 也不行。

## 转义

`alley` 允许使用转义字符 `\\` 来避免特殊字符的歧义。转义字符仅用于转义，它出现在其他任意位置都会被忽略。

`alley` 支持多重转义，但转义字符仅在以下特定字符之前有效：`{` `}` `*` `<` `>` `/` `-` `.` `\\`。

_请注意如果需要转义你需要再需要转义的特殊字符前添加一个转义符号，这需要使用双斜杠_

**不过转义功能还不够完善部分场景逻辑还待开发**

## API

### normalize

`normalize` 用于将 `path` 进行规范化。

```typescript
interface NormalOptions {
  // 是否忽略尾斜杠
  ignoreTrailingSlash?: boolean;
  // 是否忽略重复的斜杠
  ignoreDuplicateSlashes?: boolean;
  // 是否大小写敏感
  caseSensitive?: boolean;
}
type normalize = (path: string, options?: NormalOptions) => string;
```

### Tree

`Tree` 是内部的数据结构实现。

#### tree.put

使用 `pattern` 向 `alley` 添加数据。

- 如果 `pattern` 已经存在，会抛出错误。
- 如果已存在相似的 `pattern`，也会抛出错误。如：`/user/{id}` 和 `/user/*`。

```typescript
type put = (pattern: string, data: T) => void;
```

#### tree.match

使用 `path` 匹配 `alley` 中的数据。

例：`/static/assets/js/index.js` 匹配 `/static/*`，返回 `{ params: {"1*": "assets/js/index.js"}, value: T }`。

```typescript
type match = (path: string) => Matches<T> | null;
```

#### tree.clear

重置 `alley`，删除存储的所有 `pattern` 信息。

#### tree.has

查询 `alley` 中是否已经存在指定的 `pattern`。

#### tree.size

输出 `alley` 中存储的 `pattern` 的数量。

#### tree.print

以字符串的形式输出内部结构。

```typescript
type print = (format?: (desc: NodeDescription) => string) => string;
```

## License

The License is [MIT](./LICENSE).
