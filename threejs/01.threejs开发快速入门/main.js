// 导入threejs
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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


// 创建三个几何体
const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const material3 = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const box1 = new THREE.BoxGeometry(1, 1, 1);
const box2 = new THREE.BoxGeometry(2, 1, 1);
const box3 = new THREE.BoxGeometry(1, 3, 1);

const mesh1 = new THREE.Mesh(box1, material1);
const mesh2 = new THREE.Mesh(box2, material2);
const mesh3 = new THREE.Mesh(box3, material3);

mesh1.position.x = -2;
mesh2.position.x = 0;
mesh3.position.x = 2;

scene.add(mesh1);
scene.add(mesh2);
scene.add(mesh3);

let boxs= [mesh1, mesh2, mesh3];
let box = new THREE.Box3();
for(let i=0; i<boxs.length; i++){
  // const cur = boxs[i];
  // cur.geometry.computeBoundingBox();
  // let curBox = cur.geometry.boundingBox
  // cur.updateWorldMatrix(true,true);
  // curBox.applyMatrix4(cur.matrixWorld);
  // box.union(curBox);
  // 方式二
  let curBox = new THREE.Box3().setFromObject(boxs[i]);
  box.union(curBox);
}

const boxHelper = new THREE.Box3Helper(box, 0xff0000);
scene.add(boxHelper);