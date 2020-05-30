---
title: 用 3D 方式查看层叠上下文（CSS `z-index` 属性）
date: 2020-05-30 22:13:43
tags:
---

# 结果

巨硬（Microsoft）流批，2020 年 1 月 23 日巨硬发了博客说 Microsoft Edge DevTools 可以通过 3D 方式查看层叠上下文。

问：把层叠上下文用 Edge 通过 3D 方式查看一共分几步？
答：分三步

1. 打开 Edge 浏览器
2. `F12`打开开发者工具
3. `Ctrl-Shift-P` 输入 `3D` 选择“3D 视图”即可（或者点开发者工具右边的三个点 -> 更多工具 -> 3D 视图）

强行 3 步。。具体看这里[Debug z-index stacking content with 3D View in the Microsoft Edge DevTools - Microsoft Edge Blog](https://blogs.windows.com/msedgedev/2020/01/23/debug-z-index-3d-view-edge-devtools/)

效果：
TODO： 图

# 太长不看

## 层叠上下文介绍

众所周知：

- 文档根元素
- 元素 `position` 为 `fixed` 或 `sticky`
- 元素 `position` 为 `absolute` 或 `relative`，并且 `z-index` 不为 `auto`
- flex 或 grid 容器，并且 `z-index` 不为 `auto`
- 元素 `opacity` 小于 1
- 元素 `transform`、 `filter`、 `perspective`、 `clip-path` 其中之一不为`none`

等很多情况会创建层叠上下文，浏览器根据层叠上下文决定元素在 Z 轴上如何展现。具体层叠上下文如何工作可以看 [The stacking context - CSS: Cascading Style Sheets | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)

其实如果所有涉及到遮挡的元素都在根元素下根据`z-index`就可以很直观的控制。但真到具体场景都是复杂的，经常因为层叠上下文嵌套出现`z-index`超级大却还是有元素在它上面，`z-index`都设置为负数了还无法到下面的情况。有时候还会因为加减`opacity`、`transform`等看上去无关样式造成导致层叠上下文变化造成 bug。

## 其他查看层叠上下文的方式

1. [gwwar/z-context: A Chrome DevTools Extension that finds stacking contexts and z-index values in the elements panel](https://github.com/gwwar/z-context)
2. Chrome DevTools -> 更多工具 -> 层（Layers）也能看出一部分层叠结构
3. ~~[3D view - Firefox Developer Tools | MDN](https://developer.mozilla.org/en-US/docs/Tools/3D_View)~~很帅气对吧，但已经不能用了

参见：[z index - Is there a way to see the stacking context, in IE/Firefox/Chrome/etc.? - Stack Overflow](https://stackoverflow.com/questions/6800511/is-there-a-way-to-see-the-stacking-context-in-ie-firefox-chrome-etc)

## 其他想法

感觉用 CSS 3D transform 能搞点事情

TODO：搞事情
