// 导入threejs
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// 导入lil.gui
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
// 导入hdr加载器
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
// 导入gltf加载器
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// 导入draco解码器
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
// 导入tween
import * as TWEEN from "three/examples/jsm/libs/tween.module.js";

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
camera.position.z = 15;
camera.position.y = 2;
camera.position.x = 2;
camera.lookAt(0, 0, 0);

// 添加世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 设置带阻尼的惯性
controls.enableDamping = true;
// 设置阻尼系数
controls.dampingFactor = 0.05;
// 设置旋转速度
// controls.autoRotate = true;

// 渲染函数
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  // 渲染
  renderer.render(scene, camera);
  // 更新tween
  TWEEN.update();
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

// 创建GUI
const gui = new GUI();

// 创建1个球
const sphere1 = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x00ff00,
  })
);
sphere1.position.x = -4;
scene.add(sphere1);

const tween = new TWEEN.Tween(sphere1.position);
tween.to({ x: 4 }, 1000);
tween.onUpdate(() => {
  console.log(sphere1.position.x);
});
// 设置循环无数次
// tween.repeat(Infinity);
// 循环往复
// tween.yoyo(true);
// tween.repeat(2);
// tween.delay(3000);
// 设置缓动函数
tween.easing(TWEEN.Easing.Quadratic.InOut);

let tween2 = new TWEEN.Tween(sphere1.position);
tween2.to({ x: -4 }, 1000);

tween.chain(tween2);
tween2.chain(tween);
// 启动补间动画
tween.start();
tween.onStart(() => {
  console.log("开始");
});
tween.onComplete(() => {
  console.log("结束");
});
tween.onStop(() => {
  console.log("停止");
});
tween.onUpdate(() => {
  console.log("更新");
});
let params = {
  stop: function () {
    tween.stop();
  },
};

gui.add(params, "stop");
