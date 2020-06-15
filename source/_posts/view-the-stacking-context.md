---
title: 用 3D 方式查看层叠上下文（CSS `z-index` 属性）
date: 2020-05-30 22:13:43
updated: 2020-06-15 19:32:00
tags:
---

# 结果

巨硬（Microsoft）流批，2020 年 1 月 23 日巨硬发了篇博客说 Microsoft Edge DevTools 可以通过 3D 方式查看层叠上下文。

问：把层叠上下文用 Edge 通过 3D 方式查看一共分几步？
答：分 3 步

1. 打开 Edge 浏览器
2. `F12`打开开发者工具
3. `Ctrl-Shift-P` 输入 `3D` 选择“3D 视图”即可（或者点开发者工具右边的三个点 -> 更多工具 -> 3D 视图）

强行 3 步。。具体看这里[Debug z-index stacking content with 3D View in the Microsoft Edge DevTools - Microsoft Edge Blog](https://blogs.windows.com/msedgedev/2020/01/23/debug-z-index-3d-view-edge-devtools/)

![demo1](https://46c4ts1tskv22sdav81j9c69-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/33/2020/01/3df1d9825e67cdccaa766b3bcd1e204d.png)

![demo2](https://46c4ts1tskv22sdav81j9c69-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/33/2020/01/5c0afb86f465cda7d0f76cc98c591455.png)

# 太长不看

## 层叠上下文介绍

层叠上下文与元素在 Z 轴展现的前后顺序有关。通常一个层叠上下文的里面的层叠上下文按`z-index`的大小决定前后顺序（注意：`z-index`只会控制当前层叠上下文在其父层叠上下文中的先后顺序，不会跨层控制。），未创建层叠上下文的元素会合并到最近祖先元素的层叠上下文。

- 文档根元素
- 元素 `position` 为 `fixed` 或 `sticky`
- 元素 `position` 为 `absolute` 或 `relative`，并且 `z-index` 不为 `auto`
- flex 或 grid 容器，并且 `z-index` 不为 `auto`
- 元素 `opacity` 小于 1
- 元素 `transform`、 `filter`、 `perspective`、 `clip-path` 其中之一不为`none`

等很多情况会创建层叠上下文。详细的层叠上下文介绍可以看 [The stacking context - CSS: Cascading Style Sheets | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)

其实如果所有涉及到遮挡的元素都在根元素下，那么根据`z-index`就可以很直观的控制。但具体场景都是复杂的，经常因为层叠上下文嵌套出现`z-index`超级大却还是有元素在它上面，`z-index`都设置为负数了还无法到下面的情况。有时候还会因为添加删除`opacity`、`transform`等看上去和 Z 轴无关的样式导致层叠上下文变化，进而出现 bug。

## 其他查看层叠上下文的方式

1. [gwwar/z-context: A Chrome DevTools Extension that finds stacking contexts and z-index values in the elements panel](https://github.com/gwwar/z-context)
2. Chrome DevTools -> 更多工具 -> 层（Layers）虽然不是专门显示层叠上下文用的，但也能对查看元素 Z 轴的顺序起到一些帮助。[Layers - Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference#layers)
3. ~~[3D view - Firefox Developer Tools | MDN](https://developer.mozilla.org/en-US/docs/Tools/3D_View)~~很帅气对吧，但已经不能用了

参见：[z index - Is there a way to see the stacking context, in IE/Firefox/Chrome/etc.? - Stack Overflow](https://stackoverflow.com/questions/6800511/is-there-a-way-to-see-the-stacking-context-in-ie-firefox-chrome-etc)

# 处理层叠上下文的技巧

使用 Sass 数组管理层叠上下文的 `z-index` 属性，数组元素的先后表示层级高低。例如：

```scss
// project-covers 在最下层，navigation 在最上层
$elements: project-covers, sorting-bar, modals, navigation;

.project-cover {
  z-index: index($elements, project-covers);
}
```

参见：[Sassy Z-Index Management For Complex Layouts — Smashing Magazine](https://www.smashingmagazine.com/2014/06/sassy-z-index-management-for-complex-layouts/)

# 其他想法

感觉用 CSS 3D transform 能搞点事情。

<iframe width="100%" height="500px" src="/demo/view-the-stacking-context/index.html"></iframe>
