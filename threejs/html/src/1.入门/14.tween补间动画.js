import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// 导入tween动画库
import * as TWEEN from "three/examples/jsm/libs/tween.module.js"
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

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

// 创建长方体
const cube = new THREE.BoxGeometry(1,1,1)
const cubeMaterial = new THREE.MeshBasicMaterial({
  color:0x00ff00,
  // 线框模式
  wireframe:true
})
const box = new THREE.Mesh(cube, cubeMaterial)
box.position.set(2,0,0)
scene.add(box)

// 设置动画  支持链式调用，下面实例没有使用链式调用
const tween1 = new TWEEN.Tween(box.position)
tween1.to({x:2,y:2,z:0}, 1000)
// 无限循环
// tween1.repeat(Infinity)
// 往返动画
// tween1.yoyo(true)
// 动画缓动函数
tween1.easing(TWEEN.Easing.Quadratic.InOut)
// 每一帧更新时输出当前坐标
// tween1.onUpdate(() => {
//   console.log(box.position)
// })
// tween1.start()

// 链式调用
const tween2 = new TWEEN.Tween(box.position)
tween2.to({x:0,y:2,z:2}, 1000)
tween2.easing(TWEEN.Easing.Quadratic.InOut)

tween1.chain(tween2)
tween1.start()


camera.position.z = 7
camera.position.x = .5
camera.position.y = .5
function animate() {
  controls.update()
  TWEEN.update()
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