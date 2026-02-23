import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// 创建场景
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
controls.autoRotate = true
// 创建几何体
const geometry = new THREE.BoxGeometry()
// 创建材质
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
// 创建网格模型
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );
camera.position.z = 7
camera.position.x = .5
camera.position.y = .5

function animate() {
  controls.update()
  requestAnimationFrame(animate)
  // cube.rotation.x += 0.01
  // cube.rotation.y += 0.01
  renderer.render(scene, camera)
}
animate()