## vue响应式原理
在vue2.x版本中只要使用Object.defineProperty进行数据劫持，再加上发布订阅的模式来做的。
在vue处于create阶段时会调用initState方法去对创建vue时传入的data、props、computed等去做一些初始化。对于data，会去进行一个遍历，使用Object.defineProperty对每个属性设置他的getter、setter， 并实例化Dep用于储存后续的观察者watcher。
之后vue进入mount阶段会实例化一个watcher对象然后渲染元素，当render过程中访问到动态数据时就会触发该属性的getter方法，该方法会进行依赖搜集将当前的watcher对象储存在Dep的sub数组中。
在后续当某个属性发生变化时就会触发setter方法，该方法会调用当前属性实例化的dep中的notify方法，遍历存放在sub数组中的所有watcher的update方法去更新dom

观察者模式：在实例化时，通过数据劫持吧数据变为响应式的

发布订阅：在访问数据时watcher订阅了dep的变化，当数据变化时dep会通知watcher进行更新

vue2响应式痛点：递归、新增/删除属性、数组API、数据类型的限制

vue3方案：
使用Proxy进行数据响应化，可解决所有痛点

## watch && computed
当组件在初始化data之后会对computed和watch进行初始化

computed： computed初始化时会进行遍历，为每个属性实例化一个watcher传入userDef就是我们传入的执行方法，实例化的这个watcher和普通的watcher有些差别，他是一个computedWatcher，不会立刻求值。之后使用defineProperty为属性设置getter和setter，setter一般是一个空对象，只有传入时设置了set方法时才有，而getter方法则是用于依赖搜集。

当render阶段访问到computed的属性时，就会触发getter方法，通过Dep.depend使得渲染watcher订阅这个computedWatcher的变化，然后执行userDef求值。在求值过程中会触发一些响应式数据的getter，这些数据就会进行依赖搜集，将当前的computedWatcher添加到自身的dep中。

当computed中的响应式数据发生改变时，会通知computedWatcher调用update，重新进行求值，新旧值进行对比，发生变化就会触发watcher的更新

watch: 初始化遍历，拿到每个属性最终的回调函数，然后调用vue.$watch方法。实例化watcher, 绑定他的依赖，当watch的数据发生变化是就执行watch的run方法，执行回调函数。

区别：
1. computed是用于模板中的一些复杂逻辑的计算，返回结果，它会把数据进行缓存，只有响应式数据发生改变才会重新求值
2. watch是用于监听一些数据变动，当数据改变时会执行回调函数。它有两个属性：immediate-在渲染时立即执行， deep-深层监听对象属性变化

## 关于watcher
watcher有4中类型

1. deep watcher： 用于做深度观测。在watcher执行get求值时会调用一个用于深层递归遍历的函数，遍历过程中会触发子对象的getter，这样就可以收集到依赖，对性能会有一定开销。

2. user watcher： 通过$watcher创建的就是userWatcher，会在求值和执行回调函数时返回错误信息

3. computed watcher： 为计算属性量身定制的

4. sync watcher： 同步执行。普通的响应式数据发生变化时，触发watcher.update，只是把watcher推送到队列中，在nextTick后才执行回调函数。设置sync为true则会在当前tick中执行回调

## 关于检测变化
vue2.x中，因为使用Object.defineProperty有一定问题
1. 对象：当为一个响应式对象A添加一个新属性时，不能够触发他的setter。
Vue定义了全局APi Vue.set(target：数组/对象， key：数组下标/对象的key， value：值)。通过手动触发dep.notify()来实现更新通知

2. 数组：
  * 通过索引设置值： `list[2] = 'asd'`, 解决方案： 使用vue.set
  * 修改数组长度： `list.length = 2`, 解决方案： 使用`list.splice(2)`
  在初始化数据时会判断数据类型，如果是数组则会通过defineProperty去截取一下数组方法。针对数组中能改变数组自身的方法，如：push、pop、splice等进行重写，先执行方法本身，并对能增加数组长度的3个方法：push、unshift、splice方法进行判断，把新添加的值变成响应式对象。最后执行dep.notify()手动触发更新依赖的通知。


## keep-alive，需求：从入口进入列表页，不需要缓存，从详情页返回列表页需要缓存
使用keep-alive的include属性，结合Vuex做数据存储

在列表页添加`beforeRouteLeave`组件内的路由守卫, 离开路由时判断`to.name`, 如果是去详情页就在vuex上添加列表页的name, 保持缓存状态。 如果是去其他页面，就删除列表页的name，实现再次进入时初始化列表页


## 实现弹框组件，可用`this.$alert.show('这是弹框')`调用
首先写一个普通的alert组件，通过props传入title和isShow来控制内容和显隐

创建一个alert.js, 引入alert组件，通过`Vue.extend`将组件导出成构造函数`Alert`，然后文件导出一个带有`install`属性的对象，用来使用`Vue.use`获取vue实例，在`install`中在vue的原型上绑定上`$alert`赋值为带有show和hide两个方法的对象，然后就是实现show和hide。

在实现方法前先在js文件中创建一个`A`的变量为null。

1. show. 如果A为null，就使`A = new alert()`, new时传入对象`el: document.creatElement('div')`, 然后判断show方法中是否有传参数title， 有的话就A.title = title, 然后就是在document.body.append(A)， 将A插入到dom中，使用`Vue.nextTick`在回调中设置A.isShow = true。 完成。

2. hide. 判断A是否为null，不为null开始执行。首先A.isShow = false，然后再dom中移除A: `A.$el.parentNode.removeChild(A.$el)`, A.$destroy() 进行组件销毁， 最后A = null

## vuex 模块懒加载
针对vuex含有多个模块，并且数据庞大而造成的性能问题，解决方案。

主要依靠`vuex.registerModule` Api 去在运行时动态注册vuex模块。

一般使用vue插件的形式，创建对象并添加install方法获取vue实例，通过vue.mixin进行全局混入beforeCreated，判断组件上是否有添加isVuex的标识决定是否继续运行，通过当前组件的name去获取vuex的module文件名，所以在module命名时要和使用的组件name一致。通过`$store._modules.root._children`获取已注册的模块，然后遍历模块名确认是否已注册过该模块，如果没注册则使用`require()`配合名为name的文件名加载module，使用`vuex.registerModule`完成注册。

这种方案也减少了第一次运行时的性能，使用懒加载的方式在需要用的时候采取加载

## vue 优化方案
1. 代码层面
  * 使用v-if还是v-show

    * v-if为false时，初始渲染时不会渲染该模块，可以实现组件的按需渲染
    * v-if的值在切换时，会对组件进行销毁和重新渲染，对性能有一定影响
    * v-show不管值时ture还是false，在初始渲染时，都会渲染。
    * v-show的值在切换时，不会销毁和重新渲染，只是使用`display:none`来控制显示隐藏
  * v-if 与 v-for

    由于vue处理指令时，v-for比v-if的优先级高，所以在v-for完成之后v-if再去对每个子模块进行判断。

    可以通过computed提前处理v-for的数据。

    > 为什么v-for比v-if优先级高？  答：在vue进行模板解析生成AST树后，会调用genElement方法会去判断用到的指令，在这个方法中有if(el.once)、if(el.for)、if(el.if)这些判断模块，而if的判断是写在for的判断模块之后的，所以el.for会比el.if优先执行
  * v-for的key

    在v-for时添加:key可以提高diff的计算速度
    > 为什么加key会提高计算速度？

    答： 加入key主要是使用就地复用的原则。当列表数据修改时，他会根据key值去判断每个值是否修改，如果修改就重新渲染，否则就复用之前的元素。如果没有key就要通过循环就节点来和新节点比较。有时为了图方便就直接使用index作为key，这种方法并不推荐。因为如果时在数据列表最后添加一条数据，这是没问题的。但如果在中间插入数据，那么除了之前的数据复用旧节点，后面的数据都会重新渲染，所以最好的方法就是使用这条数据的唯一值来为key，比如id

    > diff算法
    在更新dom触发watcher的update时，会先去判断新旧节点是否值得比较，不值得就新节点覆盖就节点，值得就开始进行diff比较。主要处理的情况就是比较新旧节点的文本节点，如果都有则新节点覆盖旧节点、如果新节点有子节点，旧节点没有子节点，那么就直接把新节点的子节点插入到旧节点中、如果新节点没有子节点旧节点有，那么就删除旧节点的子节点、如果新旧都有子节点，那么就进入子节点的比较。就这么将新旧节点进行一层层的比对，完成diff计算。

    diff计算就是比较新旧虚拟DOM，说白了就是两个对象进行对比。

  * 利用v-once处理只会渲染一次的组件

    只渲染元素和组件一次，之后就把元素/组件及其所有子节点是为静态内容。

    比如服务协议，从服务端拿到内容后，只有姓名会变动，这是就可以把v-once添加到固定内容的元素上，下次修改只渲染姓名即可

    和v-if一起使用时 v-once不生效

    > 原理

    在判断到元素使用了v-once指令时会调用genOnce方法，回去判断含有v-if或v-for的情况，然后再渲染时会渲染出的虚拟DOM节点存在`cached`数组中，再下次更新时直接从`cached`数组获取DOM节点。
  * 使用Object.freeze冻结不需要响应式变化的数据

  使用Object.freeze就是将数据的`configurable`属性(可配置)设为false，再vue去做数据处理时会先判断`configurable`属性，如果为false就不继续配置getter/setter属性。提高渲染速度

  * 减少data中的非必须数据

  * 防抖&节流

  * 图片大小优化 & 懒加载

    图片大小可以使用 image-webpack-loader 进行压缩

    懒加载则可以使用vue-lazyload实现

  * 利用挂在节点会被替换优化白屏问题

    在vue render选然后会替换`<div id="app"></div>`的内容，我们可以在根节点中添加些内容，等首屏加载完后就会被替换掉，给人造成误差。

  * 组件库的按需引入

  比如element 推荐使用 babel-plugin-component 和 一般库使用的 babel-plugin-import

  * 局部变量

  在写computed计算属性时，可以使用
  ```
  computed: {
    test ({list}) {
      return list.length
    }
  }
  ```
  的形式去获取this.list。因为每次使用this.list都会触发getter方法去做依赖搜集，而使用变量只需要在第一次时执行依赖搜集，后续就不会再走getter了，性能自然得到了提升。

  * 组件延时分批次渲染

  主要思想：把一个组件的一次渲染拆成多次
  原理： 编写一个mixin，维护变量step，通过requestAnimationFrame在每一帧渲染的时候自增，设置个最大值比如10，自增最多不超过10。添加defer方法，传入参数num，返回step >= num。
  使用时，在一个区块上写入v-if="defer(2)", 那么该区块会在step增加到2时才会渲染


2. 项目打包优化
  * 使用import来实现组件/路由的懒加载
  * 使用externals配置，提取第三方依赖如：element、jquery这些，使用CDN引入。虽然打出的包会减小，但会增加请求数，需要进行权衡
  * 利用SplitChunks插件提取公共js代码和分割js代码
  * 利用OptimizeCssnanoPlugin插件压缩和去重css样式文件
  * 其他方面使用webpack-bundle-analyzer，可视化分析打包后的各个包的资源大小，做些优化。在import加载文件时 使用webpackChunkName可以配置解析后的文件名

3. 部署优化
  * 开启Gzip

## vuex
vuex是专为vue开发的状态管理插件，采用集中式存储管理应用的所有组件状态，更改状态的唯一方法是提交mutation。