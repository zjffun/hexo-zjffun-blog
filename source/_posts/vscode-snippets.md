---
title: VSCode 与代码片段
date: 2021-11-21 00:00:00
updated: 2021-11-21 00:00:00
tags:
---

> 片段（Snippet）是一个编程用语，指的是源代码、机器代码、文本中可重复使用的小区块。通常它们是有正式定义的运行单位，以纳入更大的编程模块。片段经常用来明晰其他“凌乱”函数的功用，或尽量减少使用与其他函数共享的重复代码。
>
> 片段管理是某些文本编辑器、程序源代码编辑器、IDE、与相关软件的其中一项功能。其使得用户能够在反复的编辑作业中保持和使用这些片段。 ———— [片段 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E7%89%87%E6%AE%B5)

大家平时应该已经用到了很多代码片段，有些是内置的，有些是拓展程序提供的。就像这些：

{% asset_img "snippets-demo.webp" "snippets-demo" %}

这篇文章主要讲如何方便地使用 VSCode 的代码片段功能管理自己的代码片段。

## 如何使用 VSCode 的代码片段功能

虽然比较老套，但“增删改查”确实可以很好地描述 VSCode 代码片段的全部功能。

### 增

下图是创建 Snippets 文件的入口：

{% asset_img "default-create-snippets.webp" "default-create-snippets" %}

[官方 Visual Studio Code 创建代码片段文档](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_create-your-own-snippets) 已经写的非常好了，我这里简单搬运一些：

Snippets 文件是用 JSON 编写的，支持 C 风格的注释，并且可以定义无限数量的代码段。代码片段会根据插入上下文智能地格式化，支持大多数用于动态行为的 TextMate 语法，并允许轻松进行多行编辑。

下面是 `for` 循环的 JavaScript 代码片段的示例：

```json
// in file 'Code/User/snippets/javascript.json'
{
  "For Loop": {
    "prefix": ["for", "for-const"],
    "body": ["for (const ${2:element} of ${1:array}) {", "\t$0", "}"],
    "description": "A for loop."
  }
}
```

在上面的例子中：

- “For Loop”是代码片段名称。如果 `description` 未提供，智能语法提示会显示这个名称。
- `prefix` 定义一个或多个在智能语法提示中显示代码段的触发词。子串匹配是在前缀上执行的，所以在这种情况下，“fc”可以匹配“for-const”。
- `body` 是一行或多行将插入的内容。换行符和缩进将根据插入代码片段的上下文进行格式化。
- `description` 是智能语法提示显示的片段的可选描述。

另外，上面例子中 `body` 具有三个占位符（按遍历顺序列出）： `${1:array}` ， `${2:element}` 和 `$0` 。您可以使用 Tab 快速跳转到下一个占位符，此时您可以编辑占位符或再次跳转到下一个。冒号后面的字符串（如果有）是默认文本，例如 `element` 是 `${2:element}` 的默认文本。占位符遍历顺序是按数字升序，从 1 开始；0 是一个可选的特殊情况，它总是最后出现，并在光标位于指定位置时退出代码片段模式。

#### 代码片段范围

代码片段范围有两个维度：语言维度和项目维度。

语言维度：

带有 `.code-snippets` 后缀的代码片段文件中，代码片段可以有一个附加 `scope` 属性，该属性可以设置一个或多个语言标识符，这使得代码段仅可用于那些指定的语言。如果未提供任何 `scope` 属性，则可用于所有语言。

项目维度：

项目维度的代码片段位于项目根目录 `.vscode` 文件夹中带有 `.code-snippets` 后缀的代码片段文件里。项目代码片段文件可用来让该项目中工作的所有用户共享代码片段。

#### 代码片段语法

上面例子已经看到 `body` 中可以使用特殊的结构来控制插入光标和文字。代码片段语法有很多，这里仅介绍最常用的制表位、占位符和选项的语法：

- 制表位：使用制表位可以使编辑器光标在代码片段内移动，例如：使用 `$1` ， `$2` 指定光标位置，数字是访问制表位的顺序。 `$0` 表示最终光标位置。同一制表位的多次出现会同步更新。

- 占位符：占位符是带有值的制表位，例如 `${1:foo}` 。占位符文本将被插入和选中以便修改。占位符可以嵌套，例如 `${1:another ${2:placeholder}}` 。

- 选项：占位符可以有选项作为值。语法是以逗号分隔的值枚举，用竖线字符括起来，例如 `${1|one,two,three|}` 。当插入代码片段并移动到占位符时将提示用户选择其中一个值。

### 删/改

修改和删除代码片段可以通过修改代码片段文件完成。

### 查

工作区输入代码片段的前缀可以查询并使用。

### 实战

下面是一段用来发送 post 请求的代码：

```js
axios
  .post("/user", {
    firstName: "Fred",
    lastName: "Flintstone",
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

根据上述教程，我们可以通过在代码片段文件中加上如下配置，来创建发送 post 请求的代码片段：

```json
{
  "post": {
    "prefix": "post",
    "description": "post",
    "scope": "javascript",
    "body": [
      "axios",
      "  .post(\"/user\", {",
      "    firstName: \"Fred\",",
      "    lastName: \"Flintstone\",",
      "  })",
      "  .then(function (response) {",
      "    console.log(response);",
      "  })",
      "  .catch(function (error) {",
      "    console.log(error);",
      "  });",
      ""
    ]
  }
}
```

然后我们就可以在工作区像使用其他代码片段一样使用它了：

{% asset_img "snippets-demo1.webp" "snippets-demo1" %}

修改一下可以让这个代码片段更通用：

```json
{
  "post": {
    "prefix": "post",
    "description": "post",
    "scope": "javascript",
    "body": [
      "axios",
      "  .post(\"$1\", {$2})",
      "  .then(function (response) {",
      "    $3",
      "  })",
      "  .catch(function (error) {",
      "    $4",
      "  });",
      "$0"
    ]
  }
}
```

现在再使用就可以像其他代码片段一样依次在 `$1` ， `$2` ， `$3` ， `$4` ， `$0` 处编辑了：

{% asset_img "snippets-demo2.webp" "snippets-demo2" %}

## 如何方便地使用 VSCode 的代码片段功能

怎样使用代码片段算是方便呢？

- 选中一段代码一键创建代码片段；
- 以更加友好的方式查看、编辑和删除代码片段；
- 对工作区代码片段、用户代码片段、拓展代码片段统一管理。

如何操作才能这样使用呢？

需要安装一个 VSCode 拓展。

### 安装 Snippets Manager

在 VSCode 的拓展市场搜索 `zjffun.snippetsmanager` 安装：

{% asset_img "install-snippetsmanager.webp" "install-snippetsmanager" %}

或通过 CLI 安装：

```bash
code --install-extension zjffun.snippetsmanager
```

### 增

选中一段代码一键创建代码片段：

{% asset_img "snippetsmanager-create1.webp" "snippetsmanager-create1" %}

### 删

点击删除按钮删除代码片段：

{% asset_img "snippetsmanager-delete.webp" "snippetsmanager-delete" %}

### 改/查

在表单中编辑代码片段，在工作区输入代码片段的前缀查询并使用：

{% asset_img "snippetsmanager-edit.webp" "snippetsmanager-edit" %}

### 统一管理

工作区代码片段、用户代码片段、拓展代码片段统一管理：

{% asset_img "snippetsmanager-manager.webp" "snippetsmanager-manager" %}
