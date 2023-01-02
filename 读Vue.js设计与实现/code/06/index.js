const defaultApi = {
  createElement: (tag) => {
    return document.createElement(tag);
  },
  setElementText: (el, text) => {
    el.textContent = text
  },
  insert(el, parent) {
    parent.appendChild(el)
  }
}



// 传入一个自定义的挂在平台API
function createRenderer(options = defaultApi) {
  function patch(n1, n2, container) {
    if (!n1) {
      // n1不存在直接挂载n2
      mountElement(n2, container);
    } else {
      // diff 挂载

    }
  }

  const {
    createElement,
    setElementText,
    insert
  } = options

  // 挂载
  function mountElement(vnode, container) {
    const el = createElement(vnode.type)

    if (typeof vnode.children === 'string') {
      // 文本格式，直接挂载内容
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 数组
      vnode.children.forEach((child => {
        patch(null, child, el)
      }))
    }

    insert(el, container)
  }

  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        container.innerHTML = ''
      }
    }

    container._vnode = vnode
  }

  return {
    render
  }
}