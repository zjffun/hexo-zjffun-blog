---
title: Chrome 与套接字
date: 2021-08-07 19:05:00
tags:
---

# 什么是套接字？

“套接字”就像“句柄”和“鲁棒”等词语一样不容易根据其字面看出其意思。

百度百科是这么解释套接字的：

> 所谓套接字(Socket)，就是对网络中不同主机上的应用进程之间进行双向通信的端点的抽象。一个套接字就是网络上进程通信的一端，提供了应用层进程利用网络协议交换数据的机制。从所处的地位来讲，套接字上联应用进程，下联网络协议栈，是应用程序通过网络协议进行通信的接口，是应用程序与网络协议根进行交互的接口。

这个解释很明了，套接字是网络中端点的抽象。这个抽象具体包括又哪些内容呢？

从程序员的角度看套接字是一个对象，这个对象支持：

1. 绑定目标地址；
2. 发送数据给目标地址；
3. 接收目标地址发送来的数据，触发监听事件。

套接字提供一系列 API 隐藏了网络通信的内部细节，使人们可以非常方便地进行网络通信。

知道了什么是套接字下面我们来看下 Chrome 中可能遇到的和套接字相关的“问题”。

# 为什么修改 hosts 在 Chrome 中没有没有立即生效？

可能很多人都遇到过这个问题，并且整理出了答案：

1. 清除系统 DNS 缓存；
2. 不行就打开 `chrome://net-internals/#dns` 点 `Clear host cache` 按钮；
3. 还不行就打开 `chrome://net-internals/#sockets` 点 `Close idle sockets` 和 `Flush socket pools` 按钮。

其中第三步就是关闭套接字。因为修改 hosts 后发的请求，在有现成套接字的情况下，会通过现成的套接字发送。这种情况没有经过 DNS 这一步，所以修改后的 hosts 没有生效。

根据我的测试和 [这个回答](https://superuser.com/questions/203674/how-to-clear-flush-the-dns-cache-in-google-chrome) PC 版 Chrome 在修改 hosts 后缓存就已经更新了。所以是不需要上面步骤 1 和步骤 2 的。

可能很多人不知道有步骤 3。因为步骤 1，2 会花一些时间使套接字过了持续时间自动关闭，或者通过关闭打开浏览器从而关闭了套接字，然后在新打开的套接字期间会走 DNS ，使修改后的 hosts 生效。

本着不求甚解的原则看下源码，找找哪里监听的 hosts 文件的改变好放心不用步骤 2。根据注释来看就当这里监听的 hosts 文件的改变吧。

[net/dns/dns_config_service_posix.cc - chromium/src - Git at Google](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/dns/dns_config_service_posix.cc#146)

```c++
// Hosts file should never change on iOS, so don't watch it there.
#if !defined(OS_IOS)
    if (!hosts_watcher_.Watch(
            base::FilePath(kFilePathHosts),
            base::FilePathWatcher::Type::kNonRecursive,
            base::BindRepeating(&Watcher::OnHostsFilePathWatcherChange,
                                base::Unretained(this)))) {
      LOG(ERROR) << "DNS hosts watch failed to start.";
      success = false;
    }
#endif  // !defined(OS_IOS)
```

# 为什么我的页面一直挂起？

> 由于 HTTP 1.x 不支持多路复用，浏览器可以不假思索地在客户端排队所有 HTTP 请求，然后通过一个持久连接，一个接一个地发送这些请求。然而，这种方式在实践中太慢。实际上，浏览器开发商没有别的办法，只能允许我们并行打开多个 TCP 会话。多少个？现实中，大多数现代浏览器，包括桌面和移动浏览器，都支持每个主机打开 6 个连接。 ———— 《Web 性能权威指南》

上述的一个连接就对应一对客户端和服务器的套接字。

经测试这 6 个连接是标签页间共享的。如果我们在其他标签页有未结束的请求占用着这 6 个连接，那么新打卡的标签页的第一个文档的请求都会被挂起。

例如下面的例子，打开 `http://localhost:8080/script` 会向 localhost 发送 6 个请求，这些请求收不到响应一直挂起。然后打开 `http://localhost:8080/page`，page 页面会因为现有的连接都被占用而挂起，关闭 script 页面后连接释放 page 页面才开始获取数据展示“OK”。

```js
/**
 * open 6 pending req
 * http://localhost:8080/script
 *
 * page will pending
 * http://localhost:8080/page
 */

const http = require("http");

const requestListener = function (req, res) {
  if (req.url === "/page") {
    res.writeHead(200);
    res.end("OK");
  }

  if (req.url === "/script") {
    res.write(`
      <script src="http://localhost:8080?1"></script>
      <script src="http://localhost:8080?2"></script>
      <script src="http://localhost:8080?3"></script>
      <script src="http://localhost:8080?4"></script>
      <script src="http://localhost:8080?5"></script>
      <script src="http://localhost:8080?6"></script>
      `);
  }
};

const server = http.createServer(requestListener);

server.listen(8080);
```

怎么确定就是 6 个？继续本着不求甚解的原则看下源码。还发现个冷门知识 WebSocket 最多可以同时开 255 个连接。

[socket/client_socket_pool_manager.cc - chromium/src/net - Git at Google](https://chromium.googlesource.com/chromium/src/net/+/refs/heads/main/socket/client_socket_pool_manager.cc#43)

```c++
// Default to allow up to 6 connections per host. Experiment and tuning may
// try other values (greater than 0).  Too large may cause many problems, such
// as home routers blocking the connections!?!?  See http://crbug.com/12066.
//
// WebSocket connections are long-lived, and should be treated differently
// than normal other connections. Use a limit of 255, so the limit for wss will
// be the same as the limit for ws. Also note that Firefox uses a limit of 200.
// See http://crbug.com/486800
int g_max_sockets_per_group[] = {
    6,   // NORMAL_SOCKET_POOL
    255  // WEBSOCKET_SOCKET_POOL
};
```

# 如何优雅地关闭套接字？

关闭套接字操作对于需要经常切换 hosts 的开发人员还是挺有用的，但打开 `chrome://net-internals/#sockets` 点 `Close idle sockets` 和 `Flush socket pools` 按钮这三步操作确实麻烦，使用 [这个 Chrome 拓展程序](https://chrome.google.com/webstore/detail/close-sockets/jmdakhnnimjejdbaahglbcpnlidckjff) 可以只点击一下就关闭所有套接字。

其他拓展程序/工具：

- [CloverNet/chrome-dns-clear: chrome dns cache clear](https://github.com/CloverNet/chrome-dns-clear)：需要修改 Chrome 启动参数。
- [Flush DNS & close sockets - Chrome Web Store](https://chrome.google.com/webstore/detail/flush-dns-close-sockets/mlmlfmdmhdplgecgmiihhfjodokajeel)：需要修改 Chrome 启动参数。
- [boreas320/chrome_hosts_flush_util: applescript tools suite for web developer](https://github.com/boreas320/chrome_hosts_flush_util)：只能在 Mac 上用，经测试在最新的 Chrome 上没有效果。

## 关闭套接字拓展程序/工具的原理

### [CloverNet/chrome-dns-clear: chrome dns cache clear](https://github.com/CloverNet/chrome-dns-clear)

这是一个 CLI 工具，代码非常少，原理是使用 [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) 让 Chrome 执行三个方法：

- `chrome.benchmarking.clearHostResolverCache()`
- `chrome.benchmarking.clearCache();`
- `chrome.benchmarking.closeConnections();`

这个工具需要 Chrome 启动时要添加三个启动参数：

- `--enable-benchmarking` 和 `--enable-net-benchmarking` 用来让 Chrome 加上要执行的三个方法。
- `--remote-debugging-port=9222` 用来启动远程调试。

打开 `chrome://version/` 可以看到启动参数等信息。

{% asset_img "chrome-flags.webp" "chrome-flags" %}

代码：

```js
"use strict";

const Chrome = require("chrome-remote-interface");

function clearDNSCache() {
  Chrome(function (chrome) {
    const { Runtime } = chrome;
    Runtime.enable();
    Runtime.evaluate({
      expression: "chrome.benchmarking.clearHostResolverCache();",
    });
    Runtime.evaluate({ expression: "chrome.benchmarking.clearCache();" });
    Runtime.evaluate({ expression: "chrome.benchmarking.closeConnections();" });
    console.log("DNS Cache Clear");
  }).on("error", function (e) {
    console.error(e);
    console.error("Cannot connect to chrome");
  });
}

module.exports = exports = clearDNSCache;
```

### [Flush DNS & close sockets - Chrome Web Store](https://chrome.google.com/webstore/detail/flush-dns-close-sockets/mlmlfmdmhdplgecgmiihhfjodokajeel)

使用拓展程序提供的 API 在标签页上执行 JS `chrome.benchmarking.closeConnections();` 等方法。和上面一样需要添加启动参数。

### [boreas320/chrome_hosts_flush_util: applescript tools suite for web developer](https://github.com/boreas320/chrome_hosts_flush_util)

使用 applescript 打开 `chrome://net-internals/#sockets`，然后在标签页上执行 JS `g_browser.sendFlushSocketPools();g_browser.checkForUpdatedInfo(false);`。经测试在最新的 Chrome 上这种方式已经无法使用了。

### [Close Sockets - Chrome Web Store](https://chrome.google.com/webstore/detail/close-sockets/jmdakhnnimjejdbaahglbcpnlidckjff)

使用拓展程序提供的 API ：

1. 打开链接 `chrome://net-internals/#sockets`；
2. 点击 `Close idle sockets` （关闭空闲套接字）按钮；
3. 点击 `Flush socket pools` （刷新套接字池）按钮；
4. 关闭第一步打开的标签页。

因为拓展程序默认禁止在 `chrome:` 开头的 URL 上运行脚本。所以需要访问 `chrome://flags/#extensions-on-chrome-urls` 并设置为 `Enabled` 才能自动执行点击操作。

## 总结与思考

缓存和网络是前端世界里两个永恒的话题，很多复杂的技术综合起来才使得我们可以享受各种实时便利的服务。套接字只是这其中的冰山一角，我这篇文章也只是套接字的冰山一角。希望可以帮助后人解决一个开发中的实际问题————关闭套接字。同时也为 [Close Sockets](https://chrome.google.com/webstore/detail/close-sockets/jmdakhnnimjejdbaahglbcpnlidckjff) Chrome 拓展程序打个广告，它应该是现在市面上最好用的工具。

就在写这篇文章时想到了一个问题：在使用无痕浏览模式时也会出现套接字缓存，之前做过测试在建立的每个 TCP 链接上保存信息是可以实现的。那么理论上在无痕模式我看了很多网站里面有很多给 gugulu 广告公司发送了请求，gugulu 就可以通过套接字将这些信息关联。如果我这期间登录了 gugulu 的网站，或者其中某个网站将我的信息告诉 gugulu，那么我的所有浏览信息还是都泄露给 gugulu 了。只是临时想到的还没有仔细调查研究，欢迎大家评论区讨论。
