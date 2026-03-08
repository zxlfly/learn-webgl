// 导入threejs
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  45, // 视角
  window.innerWidth / window.innerHeight, // 宽高比
  0.1, // 近平面
  1000 // 远平面
);

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 设置相机位置
camera.position.z = 10;
camera.position.y = 4;
camera.position.x = 5;
camera.lookAt(0, 0, 0);

// 添加世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 渲染函数
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  // 渲染
  renderer.render(scene, camera);
}
animate();

// 监听窗口变化
window.addEventListener("resize", () => {
  // 重置渲染器宽高比
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 重置相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  // 更新相机投影矩阵
  camera.updateProjectionMatrix();
});

// 增加光照
// const light = new THREE.AmbientLight(0xffffff, 1);
// scene.add(light);

// 加载glb模型
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "./model/Duck.glb",
  (gltf)=>{
    scene.add(gltf.scene);
    const mesh = gltf.scene.getObjectByName("LOD3spShape")
    let preMaterial = mesh.material
    const matcapTexture = new THREE.TextureLoader().load("/texture/matcaps/54584E_B1BAC5_818B91_A7ACA3-512px.png");
    mesh.material = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
      map : preMaterial.map
    })
  },
)
