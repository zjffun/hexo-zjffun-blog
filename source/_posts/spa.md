---
title: 单页应用（SPA）注意事项
date: 2020-09-07 19:23:57
tags:
---

# 在切换页面时取消未完成的请求

单页应用会使用 JS 做出一套路由系统模拟网页跳转，但这样切换页面时取消未完成的请求的操作就要码农们手动完成了。（这个操作一般放在路由改变事件里。）

{% details 试一试，太短也不看？ %}

首先搞个 HTTP 服务。

`cancel-request.js`

```js
/**
 * npm i koa
 * node cancel-request.js
 */

const Koa = require("koa");
const app = new Koa();

app.use(async (ctx) => {
  await new Promise((res) => setTimeout(res, 6000));
  console.log("response");
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.body = "Hello World";
});

app.listen(3000);
```

试试传统的切换页面：

`cancel-request1.html`

```html
<!DOCTYPE html>
<a href="./cancel-request2.html">goto page 2</a>
<script>
  fetch("http://localhost:3000")
    .then((response) => {
      console.log(`Request is complete!`);
    })
    .catch((e) => {
      console.warn(`Fetch error: ${e.message}`);
    });
</script>
```

`cancel-request2.html`

```html
<!DOCTYPE html>
<a href="./cancel-request1.html">goto page 1</a>
<script>
  fetch("http://localhost:3000")
    .then((response) => {
      console.log(`Request is complete!`);
    })
    .catch((e) => {
      console.warn(`Fetch error: ${e.message}`);
    });
</script>
```

完美的取消了请求：

{% asset_img "cancel-request.png" "cancel request" %}

随便写个 “SPA” 的：

```html
<!DOCTYPE html>
<div class="app">
  <div class="page page1">
    <button onclick="router.push('page2')">goto page 2</button>
  </div>
  <div class="page page2">
    <button onclick="router.push('page1')">goto page 1</button>
  </div>
</div>

<script>
  let controller = new AbortController();

  const router = {
    push(url) {
      this.beforeEach(url);

      Array.from(document.querySelectorAll(".page")).forEach((e) => {
        e.style.display = "none";
      });
      document.querySelector(`.${url}`).style.display = "block";

      mounted();
    },
    beforeEach(url) {
      // Abort request
      controller.abort();
      controller = new AbortController();
    },
  };

  function mounted() {
    const { signal } = controller;

    fetch(`http://localhost:3000`, { signal })
      .then((response) => {
        console.log(`Request is complete!`);
      })
      .catch((e) => {
        console.warn(`Fetch error: ${e.message}`);
      });
  }

  router.push("page1");
</script>
```

同样完美的取消了请求：

{% asset_img "cancel-request-spa.png" "cancel request spa" %}

{% enddetails %}
