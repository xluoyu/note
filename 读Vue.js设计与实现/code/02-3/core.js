let activeEffect = null
const bucket = new WeakMap() // data => new Map()

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
  if (!activeEffect) {
    return target[key]
  }
  // 根据target从“桶”中取得depsMap， 它是一个Map类型: key -> effects
  let depsMap = bucket.get(target)
  if (!depsMap) {
    // 如果不存在， 则创建一个新的Map与target关联
    bucket.set(target, (depsMap = new Map()))
  }
  // 根据key从depsMap中取得effects，它是一个Set类型: effects
  // 这里记录着当前key的所有副作用函数
  let deps = depsMap.get(key)
  if (!deps) {
    // 没有，则新建一个Set，并且将其与key关联
    depsMap.set(key, (deps = new Set()))
  }
  // 添加上当前存储的fn
  deps.add(activeEffect)
}

function trigger(target, key) {
  // 根据target从“桶”中取得depsMap， 它是一个Map类型: key -> effects
  const depsMap = bucket.get(target)
  if (!depsMap) return
  // 根据key从depsMap中取得effects，它是一个Set类型: effects
  const effects = depsMap.get(key)
  // 执行所有副作用函数
  effects && effects.forEach(fn => fn())
}

export function effect(fn) {
  activeEffect = fn
  fn()
}