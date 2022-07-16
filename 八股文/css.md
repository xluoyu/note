## 垂直水平居中
* 已知宽高
  1. 使用定位，`top: 50%`， 再减去自身一半的高度
  2. 使用定位，`top: calc(50% - 自身一半的高度)`
  3. 使用table布局， 设置`vertical-align: middle;`
* 未知宽高
  1. 使用flex布局
  ```
    display: flex;
    justify-content: center;
    align-items: center;
  ```
  2. 使用定位 + transform translateY(-50%)
  ```
  position: absolute;
  top: 50%,
  left: 0,
  right: 0,
  margin: auto;
  transform: translateY(-50%);
  ```

## 1px 问题