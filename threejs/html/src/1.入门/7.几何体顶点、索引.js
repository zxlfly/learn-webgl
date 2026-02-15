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

// 创建正方形
const geometry = new THREE.BufferGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
// 创建三角形的顶点数据  逆时针顺序为正面，反之为背面，如果两面都要看到要设置材质
// 一个三角形需要三个顶点，threejs中所有的几何体都是由三角形组成的
// 一个正方形是有两个三角形组合而成的有6个顶点，其中有两个顶点式公用的
// 可以通过顶点索引的方式复用，从而减少顶点使用数量
// const vertices = new Float32Array([
//   -1.0, -1.0, 0.0,
//    1.0, -1.0, 0.0,
//    1.0,  1.0, 0.0 ,
//    1.0,  1.0, 0.0 ,
//    -1.0, 1.0, 0.0 ,
//    -1.0, -1.0, 0.0
// ]);
// 正方形的顶点数据
const vertices = new Float32Array([
  -1.0, -1.0, 0.0, // 顶点0
   1.0, -1.0, 0.0, // 顶点1
   1.0,  1.0, 0.0, // 顶点2
  -1.0,  1.0, 0.0, // 顶点3
]);
// 顶点式整数
const indices = new Uint16Array([
  0, 1, 2,
  2, 3, 0,
]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
// 设置索引
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
// 创建Mesh并添加到场景中 
const square = new THREE.Mesh(geometry, material);
scene.add(square);
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