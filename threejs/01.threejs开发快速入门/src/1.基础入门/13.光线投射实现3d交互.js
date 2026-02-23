import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

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
  wireframe:false
})
// 重建3个长方体
const box1 = new THREE.Mesh(cube, cubeMaterial.clone())
box1.position.set(2,0,0)
scene.add(box1)

const box2 = new THREE.Mesh(cube, cubeMaterial.clone())
box2.position.set(0,0,0)
scene.add(box2)

const box3 = new THREE.Mesh(cube, cubeMaterial.clone())
box3.position.set(-2,0,0)
scene.add(box3)
// 光线投射实现3d交互
const mouse = new THREE.Vector2()
// 创建射线
const raycaster = new THREE.Raycaster()
window.addEventListener('click',(event)=>{
  // 1. 将屏幕坐标转换为标准化设备坐标（范围：x/y ∈ [-1, 1]）
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)
  // 2. 更新射线：从相机位置指向鼠标点击的方向
  raycaster.setFromCamera(mouse,camera)
  // 3. 检测射线与立方体的交集
  const intersects = raycaster.intersectObjects([box1, box2, box3])
  // 4. 处理击中逻辑
  if(intersects.length > 0) {
    const hitObject = intersects[0].object
    hitObject.material.color.setHex(Math.random() * 0xffffff)
    console.log('击中物体：', hitObject, '新颜色：', hitObject.material.color.getHexString())
    // intersects[0].object.material.color.setHex(Math.random() * 0xffffff)
  }
})

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