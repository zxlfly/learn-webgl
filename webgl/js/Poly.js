const defAttr = () => ({
  //webgl上下文对象
  gl: null,
  // vertices 顶点数据集合，在被赋值的时候会做两件事
  // 更新count 顶点数量，数据运算尽量不放渲染方法里
  // 向缓冲区内写入顶点数据
  vertices: [],
  // geoData 模型数据，对象数组，可解析出vertices 顶点数据
  geoData: [],
  // size 顶点分量的数目
  size: 2,
  // positionName 代表顶点位置的attribute 变量名
  attrName: 'a_Position',
  // count 顶点数量
  count: 0,
  // types 绘图方式，可以用多种方式绘图
  types: ['POINTS'],
  // 是否是圆点
  circleDot: false,
  // uniform变量
  u_IsPOINTS: null,
})
export default class Poly {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
    this.init()
  }
  //初始化方法，建立缓冲对象，并将其绑定到webgl 上下文对象上，然后向其中写入顶点数据。将缓冲对象交给attribute变量，并开启attribute 变量的批处理功能。
  init() {
    const { attrName, size, gl, circleDot } = this
    if (!gl) { return }
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    this.updateBuffer()
    const a_Position = gl.getAttribLocation(gl.program, attrName)
    gl.vertexAttribPointer(a_Position, size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(a_Position)
    if (circleDot) {
      this.u_IsPOINTS = gl.getUniformLocation(gl.program, "u_IsPOINTS");
    }
  }
  // 添加顶点
  addVertice(...params) {
    this.vertices.push(...params)
    this.updateBuffer()
  }
  //删除最后一个顶点
  popVertice() {
    const { vertices, size } = this
    const len = vertices.length
    vertices.splice(len - size, len)
    this.updateCount()
  }
  // 根据索引位置设置顶点
  setVertice(ind, ...params) {
    const { vertices, size } = this
    const i = ind * size
    params.forEach((param, paramInd) => {
      vertices[i + paramInd] = param
    })
  }
  //更新缓冲区数据，同时更新顶点数量
  updateBuffer() {
    const { gl, vertices } = this
    this.updateCount()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  }
  //更新顶点数量
  updateCount() {
    this.count = this.vertices.length / this.size
  }
  //基于geoData 解析出vetices 数据
  updateVertices(params) {
    const { geoData } = this
    const vertices = []
    geoData.forEach(data => {
      params.forEach(key => {
        vertices.push(data[key])
      })
    })
    this.vertices = vertices
  }
  // 绘图方法
  draw(types = this.types) {
    const { gl, count, u_IsPOINTS, circleDot } = this
    for (let type of types) {
      circleDot && gl.uniform1f(u_IsPOINTS, type === 'POINTS');
      gl.drawArrays(gl[type], 0, count);
    }
  }
}