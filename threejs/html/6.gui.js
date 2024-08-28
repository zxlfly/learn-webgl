import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// 导入GUI
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
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
// controls.autoRotate = true
// 创建几何体
const geometry = new THREE.BoxGeometry()
// 创建材质
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
// 创建网格模型
const parMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// 线框模式
parMaterial.wireframe = true
const parCube = new THREE.Mesh(geometry, parMaterial)
const cube = new THREE.Mesh(geometry, material)
parCube.add(cube)
// 位移
// 元素的坐标系和当前所处的环境有关，如果存在父元素，则以父元素的坐标系为基准，如果是顶层元素，则以世界坐标系为基准
// 父元素沿x轴移动-2，父元素内的所有子元素也会跟着移动，因为他们是一个整体
parCube.position.set(-2,0,0)
// 子元素沿x轴位移2，只影响子元素自身，最终看到的效果是和父元素位移效果叠加在一起后的效果
cube.position.set(2,0,0)
// 缩放  坐标系规则同位移
cube.scale.set(2,2,2)
// 旋转使用的欧拉角，值是弧度制  坐标系规则同位移
// parCube.rotation.x = Math.PI/8
// cube.rotation.x = Math.PI/8
parCube.rotation.set(Math.PI/4,0,0)
cube.rotation.set(Math.PI/4,0,0)
// 添加到场景中
scene.add(parCube)
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
  // parCube.rotation.x += 0.01
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
// 
let eventList = {
  FullScreen:function(){
    document.body.requestFullscreen()
  },
  ExitFullScreen:function(){
    document.exitFullscreen()
  },
}
// 创建GUI
const gui = new GUI({
  title:'控制面板'
})
// 添加按钮
gui.add(eventList,"FullScreen").name('全屏')
gui.add(eventList,"ExitFullScreen").name('退出全屏')



// 添加立方体控制
let folder2 = gui.addFolder('父元素')
// 父元素线框模式
folder2.add(parMaterial,"wireframe").name('父元素线框模式')
// 添加立方体控制
folder2.add(parCube.position,"x").name('x').min(-5).max(5).step(0.1).name('x轴位移').onChange()
folder2.add(parCube.position,"y").name('y').min(-5).max(5).step(0.1).name('立方体y轴位移').onFinishChange()
folder2.add(parCube.position,"z").name('z').min(-5).max(5).step(0.1).name('立方体z轴位移').onFinishChange()
folder2.addColor(parMaterial,"color").name('颜色').onChange()

// 添加立方体控制
// gui.add(cube.position,"x").name('x').min(-5).max(5).step(0.1).name('立方体x轴位置')
let folder = gui.addFolder('子元素')
folder.add(cube.position,"x").name('x').min(-5).max(5).step(0.1).name('x轴位置').onChange()
folder.add(cube.position,"y").name('y').min(-5).max(5).step(0.1).name('y轴位置').onFinishChange()
folder.add(cube.position,"z").name('z').min(-5).max(5).step(0.1).name('z轴位置')
// 线框模式
folder.add(material,"wireframe").name('线框模式')
// 设置颜色
// 这种方式注意命名必须有对应上元素
folder.addColor({cubeColor:"#00ff00"},'cubeColor').name('颜色').onChange((val)=>{
  cube.material.color.set(val)
})
folder.add(cube.scale,"x").name('x').min(-5).max(5).step(0.1).name('x轴缩放').onChange()
folder.add(cube.scale,"y").name('y').min(-5).max(5).step(0.1).name('y轴缩放').onFinishChange()
folder.add(cube.scale,"z").name('z').min(-5).max(5).step(0.1).name('z轴缩放')
folder.add(cube.rotation,"x").name('x').min(-Math.PI).max(Math.PI).step(0.1).name('x轴旋转').onChange()
folder.add(cube.rotation,"y").name('y').min(-Math.PI).max(Math.PI).step(0.1).name('y轴旋转').onFinishChange()
folder.add(cube.rotation,"z").name('z').min(-Math.PI).max(Math.PI).step(0.1).name('z轴旋转')



