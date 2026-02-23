import './style.css'
import * as THREE from "three"
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import jpg from '/texture/uv_grid_opengl.jpg'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
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

// 创建四边形   threejs内置的集合体默认自带了uv属性，所以可以直接显示
const pl = new THREE.PlaneGeometry(2, 2)
const material = new THREE.MeshBasicMaterial({ 
  map: new THREE.TextureLoader().load(jpg) 
})
const mesh = new THREE.Mesh(pl, material)
mesh.position.set(2,0,0)
scene.add(mesh)
// 创建四边形   通过BufferGeometry自定义顶点数据来创建四边形，默认没有uv属性，所以需要自己添加uv属性才能显示纹理
const geometry1 = new THREE.BufferGeometry()
const vertices = new Float32Array([
  -1,-1,0,
  1,-1,0,
  1,1,0,
  -1,1,0
])
geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
const indices = [
  0, 1, 2, 2,3,0
]
geometry1.setIndex(indices)
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 0
])
geometry1.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
const material1 = new THREE.MeshBasicMaterial({ 
  map: new THREE.TextureLoader().load(jpg) 
})
// 计算法向量
geometry1.computeVertexNormals()
// // 设置法向量
// const normals = new Float32Array([
//   0,
//   0,
//   1,
//   0,
//   0,
//   1,
//   0,
//   0,
//   1,
//   0,
//   0,
//   1, // 正面
// ]);
// // 创建法向量属性
// geometry1.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

const mesh2 = new THREE.Mesh(geometry1, material1)
mesh2.position.set(-2,0,0)
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

// 增加环境贴图
const rgbeLoader = new RGBELoader()
// 加载hdr文件
rgbeLoader.load('/texture/Alex_Hart-Nature_Lab_Bones_2k.hdr', (dataTexture) => {
  // 设置球形映射
  dataTexture.mapping = THREE.EquirectangularReflectionMapping
  // 添加环境贴图
  scene.background = dataTexture
  // 设置场景的环境贴图
  scene.environment = dataTexture
  // 材质设置环境贴图
  material1.envMap = dataTexture
  material.envMap = dataTexture
}) 