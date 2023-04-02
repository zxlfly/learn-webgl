// 建立一个Sky 对象，作为承载多边形的容器。
export default class Sky {
  constructor(gl) {
    this.gl = gl
    this.children = []
  }
  add(obj) {
    obj.gl = this.gl
    this.children.push(obj)
  }
  //更新子对象的顶点数据
  updateVertices(params) {
    this.children.forEach(ele => {
      ele.updateVertices(params)
    })
  }
  //遍历子对象绘图，每个子对象对应一个buffer 对象，所以在子对象绘图之前要先初始化。
  draw() {
    this.children.forEach(ele => {
      ele.init()
      ele.draw()
    })
  }
}