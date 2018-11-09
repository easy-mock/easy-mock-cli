## 简介

> Easy Mock 是一个可视化，并且能快速生成模拟数据的服务。以项目管理的方式组织 Mock List，能帮助我们更好的管理 Mock 数据，不怕丢失。

Easy Mock CLI 是一个基于 [Easy Mock](https://www.easy-mock.com) 快速生成 `API` 调用文件的命令行工具。

如果你正在使用 Easy Mock 伪造接口数据，那一定不要错过 `Easy Mock CLI`。

例如下面的代码：

```js
// api.js
import axios from 'axios';

const apiList = {
  getUser(id) {
    return axios({
      method: 'get',
      url: '/user/' + id
    })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  }
};

export default apiList;
```

像这样的接口定义文件我们完全不需要手写，因为通过 `Easy Mock CLI` 就能生成，非常高效。

## 快速开始

### 安装 CLI

> 使用 NPM 需要提前安装好 [Node.js](https://nodejs.org/en/)

```bash
npm install -g easy-mock-cli
```

### 创建配置文件

在你的项目根目录下创建一份名为 `.easymockrc` 的配置文件。

```json
{
  "output": "api",
  "template": "axios",
  "projects": [
    {
      "id": "你要创建的 Easy Mock 项目的 id",
      "name": "demo"
    }
  ]
}
```

以上配置参数的详细介绍在[这里](###配置项)可以找到。

### 生成 API 文件

在项目根目录下，执行如下命令将自动生成 API 文件。

```bash
easymock init .
```

## 配置文件

> 如果你通过上面的方式顺利的生成了 API，那么后面主要是介绍 Easy Mock CLI 的两大核心，`配置文件` 和 `API 模板`。

### 文件格式

支持以下文件格式：

- json
- yml
- ymal
- js

例如：

```
.easymockrc
.easymockrc.json
.easymockrc.yaml
.easymockrc.yml
.easymockrc.js
.easy-mock.js
easymock.config.js
```

### 配置项

属性名 | 描述 | 可空 | 类型 | 默认值
------|-----|---------|-----|------
host | 指定一个源，将在该源下获取接口数据 | true | String | https://www.easy-mock.com
output | 生成 API 的基础目录（基于项目目录，无需手动创建） | true | String | easy-mock-api
template | 指定一个 API 模板 | false | String |
projects | 项目列表 | false | Array |
projects[id] | Easy Mock 项目 id | false | String |
projects[name] | 项目名（开心就好，尽量简单，不用中文） | false | String |
projects[white] | 白名单（只生成白名单中的接口） | true | Array[String] |
projects[black] | 黑名单（不生成黑名单中的接口） | true | Array[String] |

### 模板说明

> 我们提供了一些官方的模板，可以在 [easy-mock-templates](https://github.com/easy-mock-templates) 查看。如果无法满足你的业务场景，可以自己创建模板，当然也欢迎参与贡献。

`template` 支持从多个地方读取模板。

```js
module.exports = {
  template: "axios", // 指定官方的 axios 模板
  template: "../../", // 指定本地的模板
  template: "owner/name", // 指定 github 上的模板
  template: "...", // 更多，如：内网 GitLab 等，配置方式见：https://github.com/flipxfx/download-git-repo
  ...
};
```

### 配置项例子

下面是一份完整的配置项例子。

```js
// .easymockrc.js
module.exports = {
  output: "api",
  template: "axios",
  projects: [
    {
      id: "58fef6ac5e43ae5dbea5eb52",
      name: "user", // 生成到 api/user 目录下。
      black: [
        "/query" // 排除 query 接口
      ]
    },
    {
      id: "58fef6ac5e43ae5dbea5eb51",
      name: "top", // 生成到 api/top 目录下。
      white: [
        "/proxy" // 只生成 proxy 接口
      ]
    }
  ]
};
```

## 自定义模板

除了使用 easy-mock-templates 提供的模板外，我们还可以自定义模板，以满足不同的需求。

### 模板示例

如果你需要开发一个自己的 API 模板，可以参考这个基于 [axios](https://github.com/easy-mock-templates/axios) 实现的例子，更快的学习如何创建模板。

### 模板基础目录

请按照下面的目录结构创建一个模板。

```
.
├── helper
│   └── index.js
└── template
    ├── common
    ├── cover
    └── init
```

### 基础目录说明

#### helper

Easy Mock CLI 默认会获取该目录下的 `index.js`，并将其注入到 `$$` 对象中。

这样我们便可以自定义方法，并在模板中使用。

#### template

> 模板语法参考 [lodash.template](https://lodash.com/docs/4.17.4#template)

template 为模板目录，下面包含了如下目录。

目录名 | 产出目录 | 规则
------|-----|---------
common | ${output} | 只创建一次
init | ${output}/${project.name} | 只创建一次
cover | ${output}/${project.name} | 每次覆盖式创建

### 接口数据源

在模板文件中，我们可以获取到如下的数据源。

对象 | 说明
------|-----
data | 接口数据
config | 配置参数
_ | [lodash](https://lodash.com)
$$ | 帮助函数

#### data 数据结构

> **注意：**在 `template/common` 目录下的模板文件中无法获取到 `data` 对象。

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

> **注意：**你可以 require Node.js 原生模块，但是不要试图引入第三方模块（模板被下载后不会安装你的模块）。

#### 内置函数
##### relative

获取相对于 `${output}` 目录下的文件地址。

> **注意：**在 `template/common` 目录下的模板文件中无法获取到该方法。
