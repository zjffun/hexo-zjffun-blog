---
title: 为什么后端收到 POST 请求的数据还是报跨域？
date: 2020-10-27 20:20:07
tags:
---

这个问题做前端的基本都懂，因为预查请求的响应头没问题，然后真正的请求发出去收到的响应头少东西就会出现这种情况。

那么怎么能给做后端的同学解释清楚呢？还是直接上代码吧==!

preflight-request-server.js:

```js
const Koa = require("koa");
const app = new Koa();

function setCORSHeaders(ctx) {
  ctx.set("Access-Control-Allow-Origin", ctx.get("Origin"));
  ctx.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH");
  ctx.set(
    "Access-Control-Allow-Headers",
    ctx.get("Access-Control-Request-Headers")
  );
}

app.use(async (ctx) => {
  if (ctx.method !== "OPTIONS") {
    ctx.body = "request success";

    // do something

    // throw "error T_T";

    setCORSHeaders(ctx);
  } else {
    setCORSHeaders(ctx);
    ctx.status = 204;
  }
});

app.listen(3000);
```

preflight-request-client.html:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script>
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      fetch("http://127.0.0.1:3000", {
        method: "POST",
        headers,
        body: "{}",
      }).then(console.log);
    </script>
  </body>
</html>
```

可以看到如果打开 `// throw "error T_T";` 这个注释，OPTIONS 请求的响应头是正常的，但正式请求的响应头少东西就跨域了。

一般 OPTIONS 请求的响应头应该和正式请求的响应头一样，所以会给人一种请求数据能过来就不会跨域的误解。

顺便一提 [简单请求](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests) 是不用发送预查请求的。上面的例子要发送 JSON 数据所以有预查请求。
