import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// 导入GUI
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
// 导入hdr加载器
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js"
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
// 创建平面
const planeGeomotry = new THREE.PlaneGeometry(3, 3)
const planeGeomotryMaterial = new THREE.MeshBasicMaterial({
  // color: 0x00ff00,
  // 运行透明
  transparent:true,
  // 透明贴图强度
  aoMapIntensity:.5,
})
const plane =  new THREE.Mesh(planeGeomotry, planeGeomotryMaterial)
// 添加 纹理贴图
  // 创建纹理加载器
const texturesLoader = new THREE.TextureLoader()
  // 加载纹理
const texture = texturesLoader.load('./public/texture/watercover/CityNewYork002_COL_VAR1_1K.png')
// 设置色彩
texture.colorSpace =THREE.SRGBColorSpace
  // 添加纹理贴图
plane.material.map = texture
  // 添加ao贴图  环境遮挡贴图
const aoTexure = texturesLoader.load('./public/texture/watercover/CityNewYork002_AO_1K.jpg')
plane.material.aoMap = aoTexure
// 透明图贴图
const alphaTexture = texturesLoader.load('./public/texture/door/height.jpg')
// plane.material.alphaMap = alphaTexture
// 光照贴图
const lightTexture = texturesLoader.load('./public/texture/colors.png')
// 下面两种设置方法都可以
// plane.material.lightMap = lightTexture
// planeGeomotryMaterial.lightMap = lightTexture
// 创建hdr加载器实例
const rgbeLoader = new RGBELoader()
// 加载hdr文件
rgbeLoader.load('./public/texture/Alex_Hart-Nature_Lab_Bones_2k.hdr', (dataTexture) => {
  // 添加环境贴图
  scene.background = dataTexture
  // 设置球形映射
  dataTexture.mapping = THREE.EquirectangularReflectionMapping
  // 设置场景的环境贴图
  scene.environment = dataTexture
  // 材质设置环境贴图
  planeGeomotryMaterial.envMap = dataTexture

})
// 高光贴图 反射强度控制
const specularMap = texturesLoader.load('./public/texture/watercover/CityNewYork002_GLOSS_1K.jpg')
planeGeomotryMaterial.specularMap = specularMap
scene.add(plane)
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );
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
gui.add(planeGeomotryMaterial,'aoMapIntensity').min(0).max(1).name('环境贴图')
gui.add(planeGeomotryMaterial,'aoMapIntensity').min(0).max(1).name('透明贴图强度')
gui.add(planeGeomotryMaterial,'reflectivity').min(0).max(1).name('反射强度')
gui.add(texture,'colorSpace',{
 sRGB:THREE.SRGBColorSpace,
 Linear:THREE.LinearSRGBColorSpace,
}).name('色彩空间').onChange(()=>{
  texture.needsUpdate = true
})