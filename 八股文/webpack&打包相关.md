## 关于webpack
webpack就是个模块打包工具，编译、管理项目中用到的HTML、js、css、静态文件等。构建过程：从entry配置的入口module开始，递归解析她所依赖的所有module，根据解析规则去找到对应的loader进行编译。编译之后以entry为单位分组，将一个entry和他的所有依赖module分到一个chunk中。最后webpack把所有chunk转换成文件输出。在整个构建过程中会暴露出不同时机的钩子，可以配置一些plugin在不同时机做一些影响。

## loader && plugins
loader 用于加载和解析文件。比如常用的babel-loader(解析js，ES6转为ES5)、css-loader(压缩、模块化操作)、eslint-loader(检查js)、less-loader/sass-loader(编译less/scss)

plugins 用于扩展webpack的功能。常用的：html-webpack-plugin(生成html文件)、clean-webpack-plugin(去掉没用的模块)

## 提高构建速度
1. 使用externals配置来提取常用的库
2. 使用Happypack 实现多线程加速编译