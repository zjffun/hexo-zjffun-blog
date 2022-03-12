---
title: 解决 UmiJS 的微前端项目中使用 RequireJS 报错
date: 2022-03-10 00:00:00
updated: 2022-03-10 00:00:00
tags:
---

首先介绍下这篇文章依赖的知识和背景：

- UmiJS: 插件化的企业级前端应用框架。
- qiankun: 基于 single-spa 的企业级微前端库。
- RequireJS: AMD 模块加载库。
- 这篇文章中 UmiJS 使用 `@umijs/plugin-qiankun` 插件来支持微前端。

# 报错内容

复现案例：[umi-qiankun-requirejs-issue](https://github.com/zjffun/umi-qiankun-requirejs-issue)

## 直接打开子项目

报错：`Mismatched anonymous define() module`

错误详细描述；https://requirejs.org/docs/errors.html#mismatch

## 在主项目中打开子项目

报错：`[qiankun]: You need to export lifecycle functions in slave entry`

错误详细描述；https://qiankun.umijs.org/zh/faq#application-died-in-status-loading_source_code-you-need-to-export-the-functional-lifecycles-in-xxx-entry

# 解决方案

在 `.umirc.ts` 中加上如下配置：

```js
chainWebpack(memo) {
  memo.output.libraryTarget('window');
},
```

PS：这个解决方案在 qiankun 的文档里也提到了。

# 原因

## webpack `output.libraryTarget` 配置

普通项目直接打开时没有报错，但改为微前端作为子项目直接打开时报错了，那一定是改为微前端后打包出来的代码变了。下面对比一下打包后的代码：

微前端项目打包的开头：

```js
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["umi-t-umi"] = factory();
	else
		root["umi-t-umi"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
// ...
```

普通项目打包的开头：

```js
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
```

容易看出它们的 [webpack 的 `output.libraryTarget`](https://webpack.js.org/configuration/output/#outputlibrarytarget) 配置不同。

通过查看`@umijs/plugin-qiankun` 的源码发现确实这个配置被修改：

```js
config.output
  .libraryTarget("umd")
  .library(
    shouldNotAddLibraryChunkName ? api.pkg.name : `${api.pkg.name}-[name]`
  );
```

只修改这个配置普通情况下不报错，引入 RequireJS 才报错，下面进一步研究下 RequireJS。

## RequireJS define

直接启动子项目的报错是因为不能在 script 标签引的 JS 里用匿名 `define` （RequireJS 虽然支持匿名 `define` 但必须通过 RequireJS 去引）。下面是一个例子：

`test-module.js`

```js
// test-module.js

define(function () {
  console.log("define");

  return {
    foo: "foo",
    bar: "bar",
  };
});
```

`test-define.html`

```html
<script src="https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"></script>

<!-- 不报错 -->

<script>
  require(["./test-module.js"], function (module) {
    console.log(module.foo);
  });
</script>

<script>
  require(["test-module"], function (module) {
    console.log(module.foo);
  });
</script>

<!-- 报错 -->

<script src="./test-module.js"></script>

<script>
  define(function () {
    console.log("define");

    return {
      foo: "foo",
      bar: "bar",
    };
  });
</script>
```

这里还有一个有趣的现象：

RequireJS 会在加载后 4ms (nextTick) 清一下队列，对于 4ms 后 define 的模块会在下次清队列时处理。

所以下面这段代码不会报错，但如果放开调用 require 函数的注释就会报错。

```html
<script src="https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js"></script>

<!-- 不报错 -->

<script>
  setTimeout(function () {
    define([], function () {
      console.log("define");

      return {
        foo: "foo",
        bar: "bar",
      };
    });

    // 放开下面这行调用 require 函数的注释会报错
    // require();
  }, 5);
</script>
```

在主项目中打开子项目，qiankun 是通过 fetch 拉下来子项目 JS 然后再执行的，这时已经过了 4ms，所以 define 的模块这时还并未执行，报错的原因要继续研究下 qiankun 生命周期。

## qiankun 生命周期

qiankun 在加载子项目时会去检查入口脚本是否暴露生命周期，没有检查到会报错。

检查顺序：

1. 入口脚本的导出（通过看 qiankun 内部使用的 import-html-entry 的源码， `scriptExports` 应该一直是 `undefined`）；
2. 入口脚本最后赋值的变量；
3. 入口脚本的全局上的 `${appName}` 属性。

qiankun 生命周期检查源码：

```ts
function getLifecyclesFromExports(
  scriptExports: LifeCycles<any>,
  appName: string,
  global: WindowProxy,
  globalLatestSetProp?: PropertyKey | null
) {
  if (validateExportLifecycle(scriptExports)) {
    return scriptExports;
  }

  // fallback to sandbox latest set property if it had
  if (globalLatestSetProp) {
    const lifecycles = (<any>global)[globalLatestSetProp];
    if (validateExportLifecycle(lifecycles)) {
      return lifecycles;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[qiankun] lifecycle not found from ${appName} entry exports, fallback to get from window['${appName}']`
    );
  }

  // fallback to global variable who named with ${appName} while module exports not found
  const globalVariableExports = (global as any)[appName];

  if (validateExportLifecycle(globalVariableExports)) {
    return globalVariableExports;
  }

  throw new Error(
    `[qiankun] You need to export lifecycle functions in ${appName} entry`
  );
}
```

主项目中打开子项目报错的原因也可以确定了：检查到入口脚本没有暴露生命周期。

# 总结

遇到报错首先还是要先看文档，这样可以快速解决问题。如果问题很难定位可以考虑二分法和控制变量法将问题范围缩小，定位到问题后就容易解决了。广泛被使用的库会包含处理各种复杂情况的逻辑，结合在一起使用可能会各种奇怪，为什么这样报错了真奇怪，为什么这样不报错真奇怪，想理清这些奇怪真不太容易。
