// 导入threejs
import * as THREE from "three";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// 导入lil.gui
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
// 导入hdr加载器
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// 导入gltf加载器
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
camera.position.z = 5;
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

let eventObj = {
  Fullscreen: function () {
    // 全屏
    document.body.requestFullscreen();
    console.log("全屏");
  },
  ExitFullscreen: function () {
    document.exitFullscreen();
    console.log("退出全屏");
  },
};

// 创建GUI
const gui = new GUI();
// 添加按钮
gui.add(eventObj, "Fullscreen").name("全屏");
gui.add(eventObj, "ExitFullscreen").name("退出全屏");
// 控制立方体的位置
// gui.add(cube.position, "x", -5, 5).name("立方体x轴位置");

// rgbeLoader 加载hdr贴图
let rgbeLoader = new RGBELoader();
rgbeLoader.load("./texture/Alex_Hart-Nature_Lab_Bones_2k.hdr", (envMap) => {
  // 设置球形贴图
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  // 设置环境贴图
  scene.background = envMap;
  // 设置环境贴图
  scene.environment = envMap;
});

// 实例化加载器gltf
const gltfLoader = new GLTFLoader();
// 加载模型
gltfLoader.load(
  // 模型路径
  "./model/Duck.glb",
  // 加载完成回调
  (gltf) => {
    console.log(gltf);
    scene.add(gltf.scene);
    // 获取模型mesh
    const duckMesh = gltf.scene.getObjectByName("LOD3spShape");
    console.log(duckMesh);
    // 获取模型几何体
    const duckGeometry = duckMesh.geometry;
    // 计算模型的包围盒
    duckGeometry.computeBoundingBox();
    const duckBox = duckGeometry.boundingBox;
    duckMesh.updateWorldMatrix(true,true)
    duckBox.applyMatrix4(duckMesh.matrixWorld);
    console.log(duckBox);
    const helper = new THREE.Box3Helper(duckBox, 0xff0000);
    scene.add(helper);

    // 这种方式计算时世界矩阵可能还没有刷新，所以包围盒可能不准确，需要延迟下，或者手动更新世界矩阵
    // setTimeout(()=>{
    //   // 使用 setFromObject 计算包围盒
    //   const boundingBox = new THREE.Box3().setFromObject(duckMesh);
    //   const size = new THREE.Vector3();
    //   boundingBox.getSize(size);
    //   console.log("包围盒的长宽高:", size);
    //   // 生成包围盒可视化对象
    //   const boxHelper = new THREE.Box3Helper(boundingBox, 0xff0000); // 红色包围盒

    //   // 添加包围盒到场景中
    //   scene.add(boxHelper);

    //   console.log(boundingBox);
    // },40)
    /**
     * 包围球逻辑上和包围盒处理方式一致，只是渲染方式不一样
     */
    const boundingSphere = duckGeometry.boundingSphere;
    boundingSphere.applyMatrix4(duckMesh.matrixWorld);
    console.log(boundingSphere);
    const sphereHelper = new THREE.SphereGeometry(boundingSphere.radius, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const sphereMesh = new THREE.Mesh(sphereHelper, sphereMaterial);
    sphereMesh.position.copy(boundingSphere.center);
    scene.add(sphereMesh);
  }
);
