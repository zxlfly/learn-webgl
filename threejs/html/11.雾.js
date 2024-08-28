import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// 导入GUI
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
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
const cube = new THREE.BoxGeometry(1,1,50)
const cubeMaterial = new THREE.MeshBasicMaterial({
  color:0x00ff00
})
const box = new THREE.Mesh(cube, cubeMaterial)
box.position.set(2,0,0)
scene.add(box)
scene.background = new THREE.Color(0x999999)
// 线性雾
// const fog = new THREE.Fog(0x999999, .1, 50)
// 指数雾
const fog = new THREE.FogExp2(0x999999, .1)
scene.fog = fog
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
// 创建GUI
const gui = new GUI({
  title:'控制面板'
})
