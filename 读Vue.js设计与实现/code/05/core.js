let activeEffect = null
const effectStack = []
const bucket = new WeakMap() // data => new Map()
window.bucket = bucket
export function reactive(data) {
  return new Proxy(data, {
    get(target, key) {
      track(target, key)
      return target[key]
    },
    set(target, key, newVal) {
      target[key] = newVal
      trigger(target, key)
      return true // 定义Set时要返回true，不然会报错 'set' on proxy: trap returned falsish for property ‘xxx’
    }
  })
}
function track(target, key) {
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  if (!activeEffect) return
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set(effects)
  effectsToRun.forEach(effectFn => {
    // 与当前的activeEffect相同，为避免无限循环，不触发执行
    if (effectFn !== activeEffect) {
      if (effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
      } else {
        effectFn()
      }
    }
  })
}

// 用一个全局变量存储当前激活的 effect 函数
export function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数复制给 activeEffect
    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    // 弹出
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]

    return res
  }
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []

  // 非lazy时，才会立即执行
  if (!options.lazy) {
    // 执行副作用函数
    effectFn()
  }

  return effectFn
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

export function computed(getter) {
  let value // 缓存上次计算的值
  let dirty = true // 是否需要重新计算

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 添加一个调度器，当数据改变触发了trigger时，就会调用`scheduler`函数，此时我们就将dirty改为true，在下次获取值时重新执行函数。
      dirty = true
      trigger(obj, 'value')
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        // 将dirty设置为false, 那么下次取值时不会重新计算
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }

  return obj
}


function traverse(value, seen = new Set()) {
  // 不考虑原始值、null、已读取过的情况
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return
  }

  seen.add(value)

  // 先考虑对象，使用for...in遍历对象的所有属性
  for (const k in value) {
    traverse(value[k], seen)
  }

  return value
}

export function watch(source, cb) {
  let getter

  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }
  let oldValue, newValue;

  const effectFn = effect( // 将副作用函数返回出来
    () => getter(),
    {
      lazy: true, // 这里我们要用上lazy属性
      scheduler() {
        newValue = effectFn() // 得到新值
        cb(newValue, oldValue)
        oldValue = newValue // 赋给旧值
      }
    }
  )

  oldValue = effectFn() // 第一次执行， 得到的值赋给旧值
}