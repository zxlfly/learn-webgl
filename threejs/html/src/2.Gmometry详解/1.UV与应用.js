import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import jpg from '/texture/uv_grid_opengl.jpg'
const scene = new THREE.Scene()
// 创建相机
const camera = new THREE.PerspectiveCamera(
  45,//视角
  window.innerWidth / window.innerHeight,//宽高比
  0.1,//近裁剪面
  1000//远裁剪面
)
// 创建渲染器
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
// 创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = .05

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 创建四边形   threejs内置的集合体默认自带了uv属性，所以可以直接显示
const pl = new THREE.PlaneGeometry(2, 2)
const material = new THREE.MeshBasicMaterial({
  side: THREE.DoubleSide,
  map: new THREE.TextureLoader().load(jpg)
})
const mesh = new THREE.Mesh(pl, material)
mesh.position.set(2, 0, 0)
scene.add(mesh)

// 创建四边形   通过BufferGeometry自定义顶点数据来创建四边形，默认没有uv属性，所以需要自己添加uv属性才能显示纹理
const geometry1 = new THREE.BufferGeometry()
const vertices = new Float32Array([
  -1, -1, 0,
  1, -1, 0,
  1, 1, 0,
  -1, 1, 0
])
geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
const indices = [
  0, 1, 2, 2, 3, 0
]
geometry1.setIndex(indices)
// 默认使用了整张的纹理
// const uvs = new Float32Array([
  // 0, 0,
  // 1, 0,
  // 1, 1,
  // 0, 1
// ])
// 只使用纹理的一部分，左下左上直接使用底部0 0坐标，其他的不变
// 此时刚好使用的是纹理图片的右下部分的三角形区域，左下和右上的uv坐标连城的线就是分界的线，能够对应上的部分是对应纹理图的部分，
// 另外的部分会因为坐标点的重复导致插值使用了这条线的颜色，视觉上看着就像是拉伸了一样
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 0
])

geometry1.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
const material1 = new THREE.MeshBasicMaterial({
  side: THREE.DoubleSide,
  map: new THREE.TextureLoader().load(jpg)
})
const mesh2 = new THREE.Mesh(geometry1, material1)
mesh2.position.set(-2, 0, 0)
scene.add(mesh2)

camera.position.z = 7
camera.position.x = .5
camera.position.y = .5
function animate() {
  controls.update()
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
// 监听窗口变化动态适配画布宽高尺寸
window.addEventListener("resize", () => {
  // 重置渲染器宽高比
  renderer.setSize(window.innerWidth, window.innerHeight)
  // 重置相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight
  // 更新相机投影矩阵
  camera.updateProjectionMatrix()
})