## 简介

如果你正在使用 [Easy Mock](https://www.easy-mock.com)，那么借助于该工具可以为我们自动生成 `API-JS`。

简单来讲就是我们再也不需要手动创建 `api.js` 这类的文件了。

例如：

```js
// api.js
import instance from './instance';
function user(opts) {
  return instance({
    method: 'get',
    url: '/user',
    opts: opts
  });
}

export {
  user
};
```

像这样的文件我们只需通过 `easy-mock-cli` 就能生成，非常高效。

## 快速开始

1.安装。

```bash
npm install -g easy-mock-cli
# or
npm install --save easy-mock-cli
```

2.在项目下创建配置文件。

```js
// .easy-mock.js
module.exports = {
  output: "api",
  template: "axios",
  projects: [
    {
      id: "easy mock 项目 id",
      name: "demo"
    }
  ]
};
```

3.生成 API-JS。

```bash
easymock init .
```

`easy-mock-cli` 会读取指定目录（默认为当前目录）下的 `.easy-mock.js` 配置文件并完成创建工作。

## 配置文件

`easy-mock-cli` 的配置文件为 `.easy-mock.js`，它包含如下配置项。

### 配置项

属性名 | 描述 | 可空 | 类型 | 默认值
------|-----|---------|-----|------
host | 指定一个源 | true | String | https://www.easy-mock.com
output | 产出目录 | true | String | easy-mock-api
template | 模板 | false | String |
projects | 项目列表 | false | Array |
projects.id | 项目 id | false | String |
projects.name | 项目名，可以是任意名字 | false | String |
projects.white | 白名单，只生成出现在白名单中的接口 | true | Array |
projects.black | 黑名单，不生成出现在黑名单中的接口 | true | Array |

### template

我们提供了一些官方的模板，可以在 [easy-mock-templates](https://github.com/easy-mock-templates) 查看。

`template` 支持从 3 个地方读取模板。

```js
module.exports = {
  template: "axios", // 指定官方的 axios 模板
  template: "../../", // 指定本地的模板
  template: "owner/name", // 指定 github 上的模板
  ...
};
```

### 例子

```js
// .easy-mock.js
module.exports = {
  output: "api",
  template: "axios",
  projects: [
    {
      id: "58fef6ac5e43ae5dbea5eb52",
      name: "user",
      black: [
        "/query"
      ]
    },
    {
      id: "58fef6ac5e43ae5dbea5eb51",
      name: "top",
      white: [
        "/proxy"
      ]
    }
  ]
};
```

## 自定义模板

我们可以自定义模板，以满足不同的需求。

### 例子

可以参考官方提供的一个基于 [axios](https://github.com/easy-mock-templates/axios) 创建 api 的模板例子，学习如何创建自定义模板。

### 目录规范

```
.
├── helper
│   └── index.js
└── template
    ├── common
    ├── cover
    └── init
```

#### helper

`easy-mock-cli` 默认会获取该目录下的 `index.js`，并将其注入到 `$$` 对象中。

这样我们便可以自定义方法，并在模板中使用。

#### template

模板目录，该目录下包含 3 个目录。分别是 `common` `init` `cover`。

模板文件语法参考 [lodash.template](https://lodash.com/docs/4.17.4#template)

##### common

该目录下的所有文件会经过编译产出到 `配置项-output` 下。

**更新规则：**文件不存在时创建（如果存在就不会再次创建）。

##### init

该目录下的所有文件会经过编译产出到 `项目目录` 下。

**更新规则：**文件不存在时创建（如果存在就不会再次创建）。

##### cover

该目录下的所有文件会经过编译产出到 `项目目录` 下。

**更新规则：**每次执行 `easymock init` 都会创建（已经存在的文件会被覆盖）。

### 模板数据源

在模板文件中，我们可以获取到如下的数据源。

#### data

接口数据，它包含了该项目下所有的接口信息。

**注意：**在 `template/common` 目录下的模板文件中无法获取到该对象。

```json
{
  "project": {
    "_id": "项目id",
    "name": "项目名",
    "url": "/example",
    "description": "项目描述",
    "...": "..."
  },
  "mocks": [{
    "_id": "接口id",
    "url": "/swagger",
    "method": "get",
    "description": "接口描述",
    "mode": "数据模型",
    "parameters": "请求参数",
    "response_model": "响应参数"
  }]
}
```

#### config

参考 `配置项`。

#### _

参考 [lodash](https://lodash.com)。

#### $$

帮助函数。

### 帮助函数

在一些场景下，我们需要通过 `帮助函数` 做一些特殊处理。

比如，我们可以通过创建帮助函数，在模板中轻松转换 url。

```js
// helper/index.js
exports.convertUrl = function (url) {
  // /restful/:id/:list/{id} -> restful_id_list_id
  // /restful/:id/:list/{id}.json -> restful_id_list_id
  var _url = url
    .replace(/:|{|}/g, '')
    .split('/')
    .filter(value => !!value).join('_');
  return _url.split('.')[0];
};

```

```js
// template/cover/index.js
...
export {<% _.forEach(data.mocks, function(mock, i){ %>
  <%- $$.convertUrl(mock.url) %><% if(data.mocks.length - 1 !== i) { %>,<% } %><% }) %>
};
```

**注意：**帮助函数中不要引用第三方模块，因为在模板下载后并不会执行 `npm install`

#### 内置
##### relative

获取相对于 `配置项-output` 目录下的文件地址。

**注意：**在 `template/common` 目录下的模板文件中无法获取到该方法。
