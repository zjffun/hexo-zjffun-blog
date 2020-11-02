---
title: 循环依赖
date: 2020-11-02 18:54:12
tags:
---

循环导入（import）依赖是完全可以的，关键是看**使用**依赖时它是否“导入完毕”。

没“导入完毕”就使用会报：`ReferenceError: Cannot access 'XXX' before initialization` 这种错误。

# 一个例子

在父类使用一个子类。

circular-dependence-index.html

```html
<!DOCTYPE html>

<script type="module">
  import "./circular-dependence-index.js";
</script>

<!-- <script src="./circular-dependence-index-webpack.js"></script> -->
<!-- <script src="./circular-dependence-index-rollup.js"></script> -->
```

circular-dependence-index.js

```js
// 1. use ParentClass (error)

import ParentClass from "./circular-dependence-parent-class.js";
console.log(new ParentClass());

// 2. use SubClass (no error)

// import SubClass from "./circular-dependence-sub-class.js";
// console.log(new SubClass().SubClass);
```

circular-dependence-parent-class.js

```js
import SubClass from "./circular-dependence-sub-class.js";

export default class ParentClass {
  get SubClass() {
    return SubClass;
  }
}
```

circular-dependence-sub-class.js

```js
import ParentClass from "./circular-dependence-parent-class.js";

export default class SubClass extends ParentClass {}
```

# rollup 打包看看

报“`ParentClass`还未初始化你就使用了”的错。

```bash
npx rollup ./circular-dependence-index.js -o circular-dependence-index-rollup.js
```

```js
// circular-dependence-sub-class.js

class SubClass extends ParentClass {}

// circular-dependence-parent-class.js

class ParentClass {
  get SubClass() {
    return SubClass;
  }
}

// circular-dependence-index.js
console.log(new ParentClass());
```

# webpack 打包看看

只保留了需要关注的代码，同样报“`ParentClass`还未初始化你就使用了”的错。

```bash
npx webpack-cli --entry ./circular-dependence-index.js --output circular-dependence-index-webpack.js --mode=development --devtool=
```

```js
/******/ (function (modules) {
  // webpackBootstrap
  /******/ // Load entry module and return exports
  /******/ return __webpack_require__(
    (__webpack_require__.s = "./circular-dependence-index.js")
  );
  /******/
})(
  /************************************************************************/
  /******/ {
    /***/ "./circular-dependence-index.js":
      /*!**************************************!*\
  !*** ./circular-dependence-index.js ***!
  \**************************************/
      /*! no exports provided */
      /***/ function (module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony import */ var _circular_dependence_parent_class_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
          /*! ./circular-dependence-parent-class.js */ "./circular-dependence-parent-class.js"
        );
        // circular-dependence-index.js

        console.log(
          new _circular_dependence_parent_class_js__WEBPACK_IMPORTED_MODULE_0__[
            "default"
          ]()
        );

        /***/
      },

    /***/ "./circular-dependence-parent-class.js":
      /*!*********************************************!*\
  !*** ./circular-dependence-parent-class.js ***!
  \*********************************************/
      /*! exports provided: default */
      /***/ function (module, __webpack_exports__, __webpack_require__) {
        /* harmony export (binding) */ __webpack_require__.d(
          __webpack_exports__,
          "default",
          function () {
            return ParentClass;
          }
        );
        /* harmony import */ var _circular_dependence_sub_class_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
          /*! ./circular-dependence-sub-class.js */ "./circular-dependence-sub-class.js"
        );

        class ParentClass {
          get SubClass() {
            return _circular_dependence_sub_class_js__WEBPACK_IMPORTED_MODULE_0__[
              "default"
            ];
          }
        }

        /***/
      },

    /***/ "./circular-dependence-sub-class.js":
      /*!******************************************!*\
  !*** ./circular-dependence-sub-class.js ***!
  \******************************************/
      /*! exports provided: default */
      /***/ function (module, __webpack_exports__, __webpack_require__) {
        /* harmony export (binding) */ __webpack_require__.d(
          __webpack_exports__,
          "default",
          function () {
            return SubClass;
          }
        );
        /* harmony import */ var _circular_dependence_parent_class_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
          /*! ./circular-dependence-parent-class.js */ "./circular-dependence-parent-class.js"
        );

        class SubClass extends _circular_dependence_parent_class_js__WEBPACK_IMPORTED_MODULE_0__[
          "default"
        ] {}

        /***/
      },

    /******/
  }
);
```
