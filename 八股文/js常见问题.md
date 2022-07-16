## 数据类型
* 基本数据类型

String、Number、Boolean、Symbol、Undefined、Null、bigInt

* 引用类型
Object

## promise原理
promise有三种表示状态 pedding、resolved、rejected
当`new promise()`时，promise进入pending状态，传入一个运行函数，该函数有两个形参（resolve，reject），调用这两个参数都会改变promise的状态。
promise上有一个then方法，可以向其传递两个参数根据成功、失败状态来触发函数的函数。
当`new promise`时传入的函数中有异步函数时，方法执行到then时还是pedding状态，就将then中的两个表示不同状态的回调函数放入相应的数组中，异步操作结束后，触发resolve或reject函数，改变promise状态，并将成功或失败的数组中的回调函数传入结果值并依次触发。
catch方发表示reject触发

## async await
async 是异步函数的标识符，返回值是一个promise对象

await 表示等待异步函数调用

await 函数的值。如果函数时异步函数，返回值为resolve()中传递的值。如果是普通函数则返回值为普通的return，没有返回值时为undefind

## async await 错误处理
可以使用try..catch进行错误处理

如果需要处理多个，可封装成函数。由于await返回也是个promise，可以才.catch时打印错误

## 关于闭包
闭包就是函数套函数的形式，内部函数可以访问外部函数的变量。当使用return返回内部函数时，所使用的外部函数的变量让会保存，所以返回的函数并非孤立的函数，而是封闭的环境包。
```
function count(base) {
  return function(num) {
    return base + num
  }
}

const addNum = count(10)
addNum(2) // 12
```

## 原型 原型链
每个函数对象都有一个 propotype 属性，它就是这个函数对象的原型，我们可以在这个原型上创建一些功能函数。在这个函数对象被实例化之后，实例化的对象有一个_proto_属性，该属性就指向函数对象的原型，所以那些写在原型上的功能函数就通过原型，被实例化的对象继承了。

原型链：当获取一个实例对象的某个属性时，如果其本身没有这个属性，那么js就会去他的构造函数的原型上找，如果还没有就会继续往Object的原型上找，如果还没有就undefined


## new
1. 创建一个新对象
2. 新对象的_proto_ = 传入对象的原型
3. 调用原对象（this指向新对象）获取返回值
4. 判断返回值，如果是对象则返回结果，否则返回新对象

## null 与 undefined 的区别
null：
1. Number(null) // 0
2. 作为函数的参数，表是该函数的参数不是对象
3. 作为对象原型链的终点。Object.prototype._proto_ == null

undefined:
1. Number(undefined) // NaN
2. 变量被声明但是没有赋值 // undefined
3. 调用函数时，对应的参数没提供 // undefined
4. 对象没赋值 // undefined
5. 函数没有返回值 // undefined

## typeof 与 instanceof
* typeof: 只能判断基本类型，null除外，
* instanceof：主要检测某个构造函数的原型对象在不在原型链上

除了以上两个 还可以使用 Object.prototype.toString.call() 进行对象类型的判断

## 关于this

对于函数而言，指向最后调用函数的那个对象。

对于全局，this指向window

## 0.1 + 0.2 ！= 0.3
js 在做计算时，会先计算二进制数在把结果转成十进制。

所有 0.1 和 0.2 转成二进制时都是无限循环小数

js保存浮点小数的小数部分最多只能保留52位，所以遵从‘0舍1入’，对无效循环小数进行舍去

最后相加的结果在转成十进制 就是 3.0000000000004

## 浅拷贝 和 深拷贝

浅拷贝是创建一个新对象，这个对象有着原始对象属性值的一份拷贝。如果属性是基本类型，拷贝的就是基本类型的值，如果属性是引用类型，拷贝的就是内存地址，所以如果其中一个对象改变了这个地址，就会影响到另一个对象。

深拷贝会拷贝所有的属性，将一个对象从内从中完整拷贝一份出来，开辟新的内存空间存放新对象，与原对象互不影响。

浅拷贝的使用
* Object.assign()
* 展开运算符 ...
* Array.prototype.concat()
* Array.prototype.slice()
手写
```
function clone(obj) {
  let res = {}
  Object.keys(obj).forEach(key => {
    res[key] = obj[key]
  })
  return res
}
```

深拷贝
JSON.parse(JSON.stringify())

这种方法虽然可以实现深拷贝，但是不能处理函数、正则、自循环。
函数会变为 null

手写原理：递归遍历对象、数组直到里边都是基本数据类型，然后再去复制，就是深度拷贝。

## 防抖 & 节流
* 防抖就是在一段时间内不管触发多少次都只执行最后一次.
通常都是设置定时器，触发时判断定时器为true就清空定时器并重新设置，直到停止触发函数并在定时器走完时执行函数
```
debounce: (fn, time) =>{
  let timer
  return function (...arg) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => {
      fn.apply(this, arg)
      clearTimeout(timer)
    }, time)
  }
}
```
* 节流是第一次触发函数后开启计时器，忽略这段时间内的触发情况，在计时器走完后才可以再次触发

实现方式有定时器和时间戳

定时器版本: 延时触发，对于第一次也不能立即执行

时间戳版本：第一次立即执行。

* 混合。还有些需求呢需要将这两种方式做混合使用

比如：搜索框，对于输入时要有节流，输入结束后再次执行函数。单纯使用节流的话，在最后输入完成时不会再次调用。

实现方式：定时器和时间戳混合来用。当记录时间last为空或当前时间>=last + 延时时间时 执行函数，并把当前时间赋值给last。当当前时间小于last + 延时时间，也就是在节流的时间内，先清空计时器，再设置计时器延时一定时间后执行函数，目的就是做防抖的功能。
```
throttle: (fn, time) => {
  let last, timer
  return function (...args) {
    let now = Date.now()
    if (last && now < last + time) {      
        clearTimeout(timer)
        timer = setTimeout(() => {
            fn.apply(this, args)
            last = now
        }, time)
    } else {
        fn.apply(this, args)
        last = now
    }
  }
}
```

## 垃圾回收机制
浏览器周期性的运行回收机制，去释放那些不需要的内存，否则js的解释器将会耗尽全部系统内存。

通常有两个策略：标记清除和引用计数
1. 引用计数
核心思想是：设置引用数，如果引用数为0，那么就会被回收，当引用关系发生改变时就会修改引用计数器的数字，比如有一个对象，当一个变量指向它的，那么引用数加1.

优点： 发现垃圾时可以立即回收

缺点：时间复杂度较高，无法回收循环引用对象

2. 标记清除
  * 在垃圾收集器运行时 给内存中的所有变量加上标记
  * 然后去掉环境中的变量以及被环境中的变量引用的变量的标记
  * 此后再被加上标记的变量被视为准备删除的变量
  * 最后垃圾收集器完成内存清除，销毁那些被标记的值并回收占用的空间

优点： 可以解决循环引用问题

缺点： 不会立即回收