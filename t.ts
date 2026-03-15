import * as THREE from "three";
import { ViewHelper } from "./ViewHelper";
// 封装了场景视角转动等事件
import { SimController } from "./SimController";
import { Label } from "./create-label";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { loaderData,testData } from "../composables/loaderData";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

/**
 * 导出初始化入口
 * @param emits 用于向父组件发送事件（例如模型属性）
 */
export const initialization = (
    emits,
    routes,
) => {
    // 基础场景/相机/渲染器相关
    let scene, camera, renderer, viewHelper, controls,css2dRenderer;
    let transformControls: TransformControls | null = null
    let transformLockedZ = 0
    let currentLockInPlane = true
    let isTransformDragging = false
    let ignoreNextCanvasClick = false
    // 当前操作的节点对象
    let currentSelectedObject = null 
    let _pointOfEdge = null
    let _edges = null
    let _space3d = null
    let _normalNodes = null
    const setTransformPlaneHandlesVisible = (visible: boolean) => {
        if (!transformControls) return
        const helper = (transformControls as any).getHelper?.() || (transformControls as any)
        if (!helper?.traverse) return
        const planeNames = new Set(["XY", "YZ", "XZ", "XYZ", "XYZE"])
        helper.traverse((child: any) => {
            const name = child?.name
            if (!name) return
            if (planeNames.has(name)) {
                child.visible = visible
            }
        })
    }
    const blockPlaneAxisWhenLocked = () => {
        // if (!transformControls || !currentLockInPlane) return
        // const axis = (transformControls as any).axis
        // if (axis === "XY" || axis === "YZ" || axis === "XZ" || axis === "XYZ" || axis === "XYZE") {
        //     ;(transformControls as any).axis = null
        // }
    }
    let sphereAnimationGroup;
    let cssLabel = new Label()
    let boxHelper,box3Group
    // 流程执行动画相关状态
    // flowSphere：表示流动的小球；flowPaths：节点顺序路径（按 BPMN）；
    // flowPointPaths：沿圆柱折线展开后的三维点路径；flowPointNodeMarkers：路径点对应的节点标记（用于到达节点时脉冲）
    // currentPathIndex/currentSegmentIndex/segmentProgress：当前使用的路径索引、段索引、以及段内进度（0~1）
    // isFlowAnimating/flowPaused：动画运行标记与暂停标记
    let flowSphere, flowPaths = [], currentPathIndex = 0, currentSegmentIndex = 0, segmentProgress = 0, isFlowAnimating = false
    let flowPointPaths: THREE.Vector3[][] = []
    let flowPointNodeMarkers: (string | null)[][] = []
    let flowPaused = false
    let idToMeshMap = new Map<string, THREE.Object3D>()
    // edge -> { cylinders: Mesh[], spheres?: Mesh[], handles?: Mesh[] }
    let edgeIdToSegmentsMap = new Map<string, { cylinders: THREE.Mesh[], spheres?: THREE.Mesh[] }>()
    // node -> Set(edgeIds)
    let nodeIdToEdgeIds = new Map<string, Set<string>>()
    // pending updates (scheduled via rAF)
    let pendingEdgeUpdates = new Set<string>()
    let pendingRaf: number | null = null
    const scheduleEdgeUpdate = (edgeId: string) => {
        if (!edgeId) return
        pendingEdgeUpdates.add(edgeId)
        if (pendingRaf == null) {
            pendingRaf = requestAnimationFrame(() => {
                pendingRaf = null
                const toUpdate = Array.from(pendingEdgeUpdates)
                pendingEdgeUpdates.clear()
                for (let i = 0; i < toUpdate.length; i++) {
                    try {
                        updateEdgeGeometry(toUpdate[i])
                    } catch (e) {
                        console.warn('updateEdgeGeometry error', e)
                    }
                }
            })
        }
    }

    const buildNodeEdgeIndex = (edges: any[]) => {
        nodeIdToEdgeIds = new Map()
        for (let i = 0; i < (edges?.length || 0); i++) {
            const e = edges[i]
            if (!e) continue
            const s = e.sourceNodeId
            const t = e.targetNodeId
            if (s) {
                if (!nodeIdToEdgeIds.has(s)) nodeIdToEdgeIds.set(s, new Set())
                nodeIdToEdgeIds.get(s)!.add(e.id)
            }
            if (t) {
                if (!nodeIdToEdgeIds.has(t)) nodeIdToEdgeIds.set(t, new Set())
                nodeIdToEdgeIds.get(t)!.add(e.id)
            }
        }
    }

    const updateEdgeGeometry = (edgeId: string) => {
        if (!edgeId) return
        // find edge record
        const edge = (_edges || []).find((x: any) => x.id === edgeId)
        if (!edge) return
        // collect point list: source node world pos, mids (from scene spheres), target node world pos
        const pts: THREE.Vector3[] = []
        const sNodeId = edge.sourceNodeId
        const tNodeId = edge.targetNodeId
        const sMesh = idToMeshMap.get(sNodeId) as any
        const tMesh = idToMeshMap.get(tNodeId) as any
        if (!sMesh || !tMesh) return
        const p0 = new THREE.Vector3(); sMesh.getWorldPosition(p0); pts.push(p0)
        // collect mids from sphereAnimationGroup children
        const mids: { ind: number, pos: THREE.Vector3, id?: string }[] = []
        for (let i = 0; i < sphereAnimationGroup.children.length; i++) {
            const child: any = sphereAnimationGroup.children[i]
            if (child.isMesh && child.userData && child.userData.isSphere && child.userData.id) {
                const pid = child.userData.id
                const belonging = _pointOfEdge?.get(pid)
                if (belonging === edgeId) {
                    const wp = new THREE.Vector3(); child.getWorldPosition(wp)
                    mids.push({ ind: child.userData.ind ?? 0, pos: wp, id: pid })
                }
            }
        }
        mids.sort((a,b)=> (a.ind||0) - (b.ind||0))
        for (let i = 0; i < mids.length; i++) pts.push(mids[i].pos.clone())
        const pn = new THREE.Vector3(); tMesh.getWorldPosition(pn); pts.push(pn)

        // now update or recreate cylinders
        const segs = edgeIdToSegmentsMap.get(edgeId)
        const expectedSegCount = Math.max(0, pts.length - 1)
        if (!segs || segs.cylinders.length !== expectedSegCount) {
            // recreate: remove existing
            if (segs) {
                segs.cylinders.forEach(c => {
                    sphereAnimationGroup.remove(c)
                    if (c.geometry) c.geometry.dispose()
                    const m: any = c.material
                    if (m) {
                        if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose && mm.dispose())
                        else if (m.dispose) m.dispose()
                    }
                })
            }
            // build fresh
            const newCylinders: THREE.Mesh[] = []
            for (let i = 0; i < pts.length - 1; i++) {
                const pa = pts[i]; const pb = pts[i+1]
                // create unit cylinder (height 1) and scale
                const radius = 2
                const cylGeo = new THREE.CylinderGeometry(radius, radius, 1, 8)
                const cylMat = new THREE.MeshStandardMaterial({ color: '#ff0000', metalness:0.5, roughness:0.5, emissive: new THREE.Color('#ff0000'), emissiveIntensity:0.5 })
                const cyl = new THREE.Mesh(cylGeo, cylMat)
                const center = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5)
                const dir = new THREE.Vector3().subVectors(pb, pa).normalize()
                const axis = new THREE.Vector3(0,1,0)
                const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir)
                const h = pa.distanceTo(pb)
                cyl.position.copy(center)
                cyl.setRotationFromQuaternion(quat)
                cyl.scale.set(1, h, 1)
                cyl.userData = { isCylinder: true, edgeId, segmentIndex: i }
                sphereAnimationGroup.add(cyl)
                newCylinders.push(cyl)
            }
            edgeIdToSegmentsMap.set(edgeId, { cylinders: newCylinders })
            return
        }

        // update existing cylinders in place
        for (let i = 0; i < segs.cylinders.length; i++) {
            const cyl = segs.cylinders[i]
            const pa = pts[i]
            const pb = pts[i+1]
            const center = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5)
            const dir = new THREE.Vector3().subVectors(pb, pa).normalize()
            const axis = new THREE.Vector3(0,1,0)
            const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir)
            const h = pa.distanceTo(pb)
            cyl.position.copy(center)
            cyl.setRotationFromQuaternion(quat)
            cyl.scale.set(1, h, 1)
            cyl.userData.segmentIndex = i
        }
    }
    // 流动速度（世界单位/秒），值越小越慢
    let flowSpeed = 120
    let lastTime = 0
    let pulseNode: THREE.Object3D | null = null
    let pulseTime = 0
    let pulseDuration = 0.5
    let pulseOriginalScale: THREE.Vector3 | null = null
    /**
     * 初始化场景容器/相机/渲染器/光照/控制器等，启动动画循环
     * @param id 容器 DOM 的 id
     */
    const init = (id) => {
        // 容器
        const container = document.getElementById(id) as HTMLElement;
        scene = new THREE.Scene();
        scene.background = new THREE.Color("#61778e"); // 设置场景背景色

        // css2d，要放在Renderer的前面加载
		css2dRenderer = new CSS2DRenderer();
		css2dRenderer.setSize(container.offsetWidth, container.offsetHeight);
		css2dRenderer.domElement.style.position = "absolute";
		css2dRenderer.domElement.style.pointerEvents = "none";
		container.appendChild(css2dRenderer.domElement);

        // 3. 创建相机（Camera）- 决定观察视角
        // 透视相机参数：视场角(FOV)、宽高比、近裁剪面、远裁剪面
        camera = new THREE.PerspectiveCamera(
            45, // 视场角
            container.offsetWidth / container.offsetHeight, // 宽高比
            0.1, // 近裁剪面（距离相机最近的可见距离）
            10000000, // 远裁剪面（距离相机最远的可见距离）
        );
        camera.up = new THREE.Vector3(0, 0, 1); // 设置相机的上方向为 z 轴（默认是 y 轴），适合地理空间场景
        camera.position.set(10, -30, 0); // 设置相机在 z 轴的位置（远离原点）
        scene.add(camera); // 将相机添加到场景中

        // 4. 创建渲染器（Renderer）- 将场景渲染到页面
        renderer = new THREE.WebGLRenderer({
            antialias: true, // 开启抗锯齿，让边缘更平滑
            powerPreference: "high-performance",
            logarithmicDepthBuffer: false,
            precision: "lowp",
            preserveDrawingBuffer: true,
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 200);
        scene.add(directionalLight);

        renderer.setSize(container.offsetWidth, container.offsetHeight); // 设置渲染尺寸
        renderer.setClearColor(0xffffff);
        renderer.setPixelRatio(window.devicePixelRatio); // 适配高清屏幕
        renderer.autoClear = false;
        container.appendChild(renderer.domElement); // 添加到页面

        // 7. 窗口自适应处理
        window.addEventListener("resize", () => {
            // 更新相机宽高比
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix(); // 更新相机投影矩阵
            // 更新渲染器尺寸
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 方位指示器
        viewHelper = new ViewHelper(camera, container);

        controls = new SimController(camera, renderer.domElement);
        controls.update();

        transformControls = new TransformControls(camera, renderer.domElement)
        transformControls.setMode("translate")
        transformControls.showX = true
        transformControls.showY = true
        transformControls.showZ = false
        transformControls.addEventListener("dragging-changed", (event: any) => {
            controls.enabled = !event.value
            isTransformDragging = !!event.value
            if (!event.value) {
                ignoreNextCanvasClick = true
                renderBox(currentSelectedObject)
                // 拖拽结束后导出当前三维为二维数据（可用于持久化）
                try {
                    const data2d = getSpace3dTo2d()
                    // TODO: 这里可以 emits 到上层进行持久化
                    console.log('bpmn snapshot', data2d)
                } catch (e) {
                    // getSpace3dTo2d may not be ready yet
                }
            }
        })

        transformControls.addEventListener("mouseDown", () => {
            blockPlaneAxisWhenLocked()
        })
        transformControls.addEventListener("objectChange", () => {
            blockPlaneAxisWhenLocked()
            if (!transformControls?.object || !currentLockInPlane) return
            transformControls.object.position.z = transformLockedZ
            // 当对象位置在变化时，调度相关边的更新（节点或拐点）
            const obj = transformControls.object as any
            try {
                if (obj?.userData) {
                    // 节点
                    if (obj.userData.isNode && obj.userData.id) {
                        const nid = obj.userData.id
                        const set = nodeIdToEdgeIds.get(nid)
                        if (set) {
                            set.forEach(eid => scheduleEdgeUpdate(eid))
                        }
                    }
                    // 拐点（球体）
                    else if (obj.userData.isSphere && obj.userData.id) {
                        const pid = obj.userData.id
                        const eid = _pointOfEdge?.get(pid)
                        if (eid) scheduleEdgeUpdate(eid)
                    }
                }
            } catch (e) {
                console.warn('schedule edge update failed', e)
            }
        })
        const transformHelper = (transformControls as any).getHelper?.()
        if (transformHelper?.isObject3D) {
            scene.add(transformHelper)
        } else if ((transformControls as any).isObject3D) {
            scene.add(transformControls as unknown as THREE.Object3D)
        }

        // 添加改变事件
        // controls.addEventListener("change", (target) => {
        // 	animateRes();
        // });

        sphereAnimationGroup = new THREE.Group();
        sphereAnimationGroup.name = "sphereAnimationGroup";
        scene.add(sphereAnimationGroup);

        box3Group = new THREE.Group();
        box3Group.name = "box3Group";
        scene.add(box3Group);
        selectComp()
        animateRes();
    };
    // 选中组件
    /**
     * 启用鼠标拾取：点击 BoomBox 模型时显示包围盒并回传 userData
     */
    const selectComp =()=> {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
    
        let canvas = document.getElementById("sim-lib-canvas-box")
        const attachTranslateControl = (obj: THREE.Object3D | null, lockInPlane: boolean = true) => {
            if (!transformControls) return
            if (!obj) {
                transformControls.detach()
                return
            }
            currentSelectedObject = obj
            currentLockInPlane = lockInPlane
            transformLockedZ = obj.position.z
            transformControls.setMode("translate")
            transformControls.showX = true
            transformControls.showY = true
            transformControls.showZ = !lockInPlane
            transformControls.attach(obj)
            setTransformPlaneHandlesVisible(!lockInPlane)
        }

        const onMouseClick = (event) => {
            if(!canvas) return
            if (isTransformDragging || ignoreNextCanvasClick) {
                ignoreNextCanvasClick = false
                return
            }
            // 将鼠标点击位置转换为标准化设备坐标（-1 到 +1）

            // 将鼠标点击位置转换为标准化设备坐标（-1 到 +1）
            const rect = canvas.getBoundingClientRect(); // 获取canvas在视口的实际位置
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
            // 使用 Raycaster 从相机位置发出射线
            raycaster.setFromCamera(mouse, camera);
    
            // 计算射线与场景中对象的交点
            const intersects = raycaster.intersectObjects(
                sphereAnimationGroup.children,
                true,
            );
    
            if (intersects.length > 0) {
                const selectedObject = intersects[0].object;
                console.log(selectedObject)
                // 在这里可以执行进一步的操作，例如高亮显示选中的对象
                if(selectedObject.userData.isNode){
                    // 添加包围盒
                    renderBox(selectedObject)
                    attachTranslateControl(selectedObject)
                    // 传递选中对象的属性到父组件
                    emits("getProperties",selectedObject.userData)
                }else if(selectedObject.userData.isSphere){
                    // 拐点（球）
                    // if(boxHelper){
                    //     boxHelper.visible = false
                    // }
                    // cssLabel.clearCss2d(scene)
                    renderBox(selectedObject)
                    attachTranslateControl(selectedObject, true)
                    emits("getProperties",selectedObject.userData)
                }
                else if(selectedObject.userData.isCylinder){
                    // 线（圆柱）
                    // 先不考虑这个功能
                }
                    
            }else{
                // 没有选中对象，隐藏包围盒
                if(boxHelper){
                    boxHelper.visible = false
                }
                cssLabel.clearCss2d(scene)
                attachTranslateControl(null)
                // 传递选中对象的属性到父组件
                emits("getProperties", {})
            }
        };
    
        canvas.addEventListener("click", onMouseClick, false);
    }
    /**
     * 设置/更新包围盒与 CSS2D 标签
     * @param mesh 目标网格
     * @param type 可选：若传入则默认隐藏包围盒（用于内部调用）
     */
    const renderBox = (mesh,type?) => {
        if (boxHelper) {
            box3Group.remove(boxHelper)
        }
        boxHelper = new THREE.BoxHelper(mesh, 0xffff00)

        if(type){
            boxHelper.visible = false
        }

        box3Group.add(boxHelper)

        // 渲染css2d文字
        cssLabel.createCss2dText(scene,mesh)
    }
    // 清除场景中已有的对象
    /**
     * 清空 sphereAnimationGroup 下的所有子对象
     */
    const clearSphereGeometry = () => {
        for (
            let index = sphereAnimationGroup.children.length - 1;
            index >= 0;
            index--
        ) {
            const child = sphereAnimationGroup.children[index];
            sphereAnimationGroup.remove(child);
        }
    };
    // 根据传入的坐标数据，初始化圆柱体连成线段
    /**
     * 按点列绘制一组相连的圆柱线段（可选绘制端点球体）
     * @param morphingData 点列 [[x,y,z],...]
     * @param radius 圆柱半径
     * @param color 颜色
     * @param sphereAnimationGroup 容器组
     * @param isSphere 是否显示端点球体
     */
    const initSphereGeometry = (
        morphingData: any, // 坐标数据
        radius: number, // 球体和圆柱体的半径
        color: string, // 圆柱颜色
        sphereAnimationGroup: THREE.Group, // 场景中用于存放几何体的组
        isSphere: boolean = false, // 是否显示球体
        edgeId?: string,
    ) => {
        const positions = morphingData; // 获取当前帧的顶点位置
        const cylinders: THREE.Mesh[] = []
        const spheres: THREE.Mesh[] = []

        for (let i = 0; i < positions.length-1; i++) {
            let indexA = positions[i].position;
            let indexB = positions[i + 1].position;
            
            // 获取 A 点和 B 点的坐标
            const pointA = new THREE.Vector3(indexA[0], indexA[1], indexA[2]);
            const pointB = new THREE.Vector3(indexB[0], indexB[1], indexB[2]);
            let isFirstEnd = i ==0 || i == positions.length-1
            // 加载数据（球体和圆柱体）
            const { cylinder, sphere } = loadData(
                pointA,
                pointB,
                radius,
                color,
                sphereAnimationGroup,
                isFirstEnd,
                positions[i],
                isSphere,
                edgeId,
                i,
            );
            if (cylinder) cylinders.push(cylinder)
            if (sphere) spheres.push(sphere)
        }
        if (edgeId) {
            edgeIdToSegmentsMap.set(edgeId, { cylinders, spheres })
        }
        // 居中显示
        // const box = new THREE.Box3().setFromObject(sphereAnimationGroup);
        // const center = new THREE.Vector3();
        // box.getCenter(center);
        // sphereAnimationGroup.position.sub(center);
    };
    // 根据两个点坐标生成圆柱体连接
    /**
     * 由两端点生成一根圆柱体，并旋转对齐两点方向
     */
    const loadData = (
        pointA: THREE.Vector3,
        pointB: THREE.Vector3,
        radius: number, // 球体和圆柱体的半径
        color: string, // 颜色
        sphereAnimationGroup: THREE.Group, // 场景中用于存放几何体的组
        isFirstEnd,
        edgeData,
        isSphere: boolean = false,
        edgeId?: string,
        segmentIndex?: number,
    ) => {
        let createdSphere: THREE.Mesh | undefined = undefined
        if(!isFirstEnd){
            if (isSphere) {
                const geometry = new THREE.SphereGeometry(radius, 16, 8);
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.copy(pointA);
                sphere.userData = edgeData
                sphere.userData['isSphere'] = true
                if (edgeId) sphere.userData.edgeId = edgeId
                sphereAnimationGroup.add(sphere);
                createdSphere = sphere
            }
        }

        // 计算圆柱体的高度
        const height = pointA.distanceTo(pointB);

        // 创建圆柱体（unit height, 使用 scale.y 调整）
        const radiusTop = radius; // 圆柱体顶部半径
        const radiusBottom = radius; // 圆柱体底部半径
        const radialSegments = 8; // 降低细分数以节省性能
        const cylinderGeometry = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            1,
            radialSegments,
        );
        const cylinderMaterial = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.5,
            roughness: 0.5,
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.5,
        });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

        // 计算圆柱体的中心点
        const center = new THREE.Vector3()
            .addVectors(pointA, pointB)
            .multiplyScalar(0.5);

        // 设置圆柱体的位置
        cylinder.position.copy(center);

        // 计算圆柱体的旋转（法向量）
        const direction = new THREE.Vector3()
            .subVectors(pointB, pointA)
            .normalize();
        const axis = new THREE.Vector3(0, 1, 0); // 默认圆柱体的方向是沿着Y轴
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            axis,
            direction,
        );
        cylinder.setRotationFromQuaternion(quaternion);
        cylinder.userData['isCylinder'] = true
        if (edgeId) cylinder.userData.edgeId = edgeId
        if (typeof segmentIndex === 'number') cylinder.userData.segmentIndex = segmentIndex
        // 使用 scale.y 表示长度
        cylinder.scale.set(1, height, 1)
        sphereAnimationGroup.add(cylinder);
        return { cylinder, sphere: createdSphere }
    };
    // 实时更新
    /**
     * 动画循环：推进时间、更新流程动画与渲染
     */
    const animateRes = () => {
        requestAnimationFrame(animateRes);
        const now = performance.now()
        const dt = lastTime ? (now - lastTime) / 1000 : 0
        lastTime = now
        updateFlowAnimation(dt)
        // css2d渲染
		css2dRenderer.render(scene, camera);
        renderer.render(scene, camera);
        viewHelper.render(renderer, 10);
    };
    // 渲染线
    /**
     * 批量渲染折线路径对应的圆柱
     */
    const renderLines = (lines, edges?) => {
        if (!Array.isArray(lines)) return
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const eid = edges && edges[i] ? edges[i].id : undefined
            initSphereGeometry(
                line,
                2,
                "#ff0000",
                sphereAnimationGroup,
                true,
                eid,
            );
        }
    };
    // 渲染模型
    /**
     * 按传入模型列表异步加载 GLTF 模型，并缩放/定位后加入场景
     */
    const renderModels = async (models) => {
        const loader = new GLTFLoader();
        const tasks = [];
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            let modelCenter = model.position;
            let modelFile = model.modelUrl;
            modelFile = "/models/BoomBox.glb"
            if (modelFile) {
                const task = new Promise((resolve, reject) => {
                    loader.load(
                        modelFile,
                        (gltf) => {
                            const mesh = gltf.scene.children[0];
                            // 测试发现模型尺寸太小导致看不见，目前是固定大小
                            const box = new THREE.Box3().setFromObject(mesh);
                            const size = new THREE.Vector3();
                            box.getSize(size);
                            const maxDim = Math.max(size.x, size.y, size.z);
                            if (maxDim > 0) {
                                // 假设我们希望模型的最大边长为 20 个单位
                                const targetSize = 20;
                                const scale = targetSize / maxDim;
                                mesh.scale.setScalar(scale);
                            }

                            mesh.position.copy(
                                new THREE.Vector3(
                                    modelCenter[0],
                                    modelCenter[1],
                                    modelCenter[2],
                                ),
                            );
                            mesh.userData = {
                                ...model,
                                isNode:true //用于点击的拾取的时候判断是否是节点
                            }
                            sphereAnimationGroup.add(mesh);
                            resolve(true)
                        },
                        undefined,
                        function (error) {
                            reject(error);
                        },
                    );
                });
                tasks.push(task);
                // 后需要需要从后端获取模型文件路径
                // loader.load(
                //     modelFile,
                //     function (gltf) {
                //         const model = gltf.scene;
                //         // 测试发现模型尺寸太小导致看不见，目前是固定大小
                //         const box = new THREE.Box3().setFromObject(model);
                //         const size = new THREE.Vector3();
                //         box.getSize(size);
                //         console.log('模型原始尺寸:', size);
                //         const maxDim = Math.max(size.x, size.y, size.z);
                //         if (maxDim > 0) {
                //             // 假设我们希望模型的最大边长为 20 个单位
                //             const targetSize = 20;
                //             const scale = targetSize / maxDim;
                //             model.scale.setScalar(scale);
                //             console.log('模型已缩放倍数:', scale);
                //         }

                //         model.position.copy(
                //             new THREE.Vector3(
                //                 modelCenter[0],
                //                 modelCenter[1],
                //                 modelCenter[2],
                //             ),
                //         );
                //         sphereAnimationGroup.add(model);
                //     },
                //     undefined,
                //     function (error) {
                //         console.error(error);
                //     },
                // );
            } else {
                // 如果模型文件不存在渲染一个球代替
                const geometry = new THREE.SphereGeometry(10, 32, 16);
                const material = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.copy(
                    new THREE.Vector3(
                        modelCenter[0],
                        modelCenter[1],
                        modelCenter[2],
                    ),
                );
                sphere.userData = {
                    ...model
                }
                sphereAnimationGroup.add(sphere);
            }
        }
        await Promise.all(tasks);
    };
    /**
     * 视图自动框选并调整相机距离，确保完整显示当前组
     */
    const fitGroupToView = () => {
        if (!sphereAnimationGroup || sphereAnimationGroup.children.length === 0)
            return;

        const box = new THREE.Box3().setFromObject(sphereAnimationGroup);

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);

        let distance = maxDim / (2 * Math.tan(fov / 2));
        distance *= 1.5; // 留边距

        // 保持当前视角方向
        const offset = new THREE.Vector3().subVectors(
            camera.position,
            controls.target,
        );

        const currentDistance = offset.length();

        // 只缩放距离，不改变方向
        offset.multiplyScalar(distance / currentDistance);

        // 设置新的 target 为模型中心
        controls.target.copy(center);

        // 相机位置 = 中心 + 原方向 * 新距离
        camera.position.copy(center).add(offset);

        controls.update();

        // 更新裁剪面
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
    };
    /**
     * 对外：解析 BPMN 数据、渲染三维内容并启动流程动画
     */
    const analysisBpmn =async(testData)=> {
        const filtered = filterOutCustomCircle(testData)
        let {lines,models,space3d,pointOfEdge,edges,normalNodes,} = loaderData(testData)
        await renderBpmn(lines,models,space3d,pointOfEdge,edges,normalNodes)
        if(routes.path == '/process-details'){
            startBpmnAnimation(filtered)
        }
    }
    /**
     * 按 lines 与 models 渲染，并进行视图适配
     * space3d为层级数据，用来渲染辅助面
     */
    const renderBpmn = async (lines, models,space3d,pointOfEdge,edges,normalNodes,) => {
        _pointOfEdge = pointOfEdge
        _edges = edges
        _space3d = space3d
        _normalNodes = normalNodes
        clearSphereGeometry();
        // 建立边索引并渲染折线（将 edges 传入以便关联 edgeId）
        buildNodeEdgeIndex(edges)
        renderLines(lines, edges);
    await renderModels(models);
    // 索引节点 mesh 以便后续更新可以使用 idToMeshMap
    indexNodeMeshes()
        renderSpace3d(space3d)
        fitGroupToView();
    };
    /**
     * 建立节点 id 到对应 Mesh 的映射，便于查找世界坐标
     */
    const indexNodeMeshes = () => {
        idToMeshMap = new Map()
        for (let i = 0; i < sphereAnimationGroup.children.length; i++) {
            const obj: any = sphereAnimationGroup.children[i]
            const nid = obj?.userData?.id
            if (nid) {
                idToMeshMap.set(nid, obj)
            }
        }
    }
    // 从边列表构建节点顺序路径（根据有向边拓扑，支持多起点）
    const buildPathsFromEdges = (data) => {
        const edges = Array.isArray(data?.edges) ? data.edges : []
        const nodes = Array.isArray(data?.nodes) ? data.nodes : []
        const adj = new Map<string, string[]>()
        const indeg = new Map<string, number>()
        for (let i = 0; i < edges.length; i++) {
            const e = edges[i]
            const s = e.sourceNodeId
            const t = e.targetNodeId
            if (!adj.has(s)) adj.set(s, [])
            adj.get(s)!.push(t)
            indeg.set(t, (indeg.get(t) || 0) + 1)
            if (!indeg.has(s)) indeg.set(s, indeg.get(s) || 0)
        }
        let starts: string[] = []
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i]?.type === "start") starts.push(nodes[i].id)
        }
        if (starts.length === 0) {
            const sources = Array.from(adj.keys())
            const targets = new Set(Array.from(indeg.keys()).filter(k => (indeg.get(k) || 0) > 0))
            for (let i = 0; i < sources.length; i++) {
                const s = sources[i]
                if (!targets.has(s)) starts.push(s)
            }
        }
        const paths: string[][] = []
        const dfs = (curr: string, path: string[]) => {
            const nexts = adj.get(curr) || []
            if (nexts.length === 0) {
                paths.push([...path])
                return
            }
            for (let i = 0; i < nexts.length; i++) {
                const n = nexts[i]
                if (path.includes(n)) continue
                dfs(n, [...path, n])
            }
        }
        for (let i = 0; i < starts.length; i++) {
            const s = starts[i]
            dfs(s, [s])
        }
        return paths
    }
    // 将每条边转换为三维折线路径：起点 → 中间点(pointsList) → 终点
    // 若无中间点则为直线段
    const buildEdgePolylineMap = (data) => {
        const nodes = Array.isArray(data?.nodes) ? data.nodes : []
        const edges = Array.isArray(data?.edges) ? data.edges : []
        const pos = new Map<string, THREE.Vector3>()
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i]
            const z = (n?.properties && typeof n.properties?.z === "number") ? n.properties.z : 0
            pos.set(n.id, new THREE.Vector3(n.x, n.y, z))
        }
        const map = new Map<string, THREE.Vector3[]>()
        for (let i = 0; i < edges.length; i++) {
            const e = edges[i]
            const s = e?.sourceNodeId
            const t = e?.targetNodeId
            if (!pos.has(s) || !pos.has(t)) continue
            const start = pos.get(s)!.clone()
            const end = pos.get(t)!.clone()
            const pts = [start]
            const mids: any[] = Array.isArray(e?.properties?.pointsList) ? e.properties.pointsList : []
            for (let j = 0; j < mids.length; j++) {
                const p = mids[j]
                const vx = Array.isArray(p) ? p[0] : p?.x
                const vy = Array.isArray(p) ? p[1] : p?.y
                const vz = Array.isArray(p) ? (p[2] ?? 0) : (p?.z ?? 0)
                pts.push(new THREE.Vector3(vx, vy, vz))
            }
            pts.push(end)
            map.set(`${s}->${t}`, pts)
        }
        return map
    }
    const filterOutCustomCircle = (data) => {
        const nodes = Array.isArray(data?.nodes) ? data.nodes : []
        const edges = Array.isArray(data?.edges) ? data.edges : []
        const keptNodes = nodes.filter(n => n?.type !== "custom-circle")
        const removedIds = new Set(nodes.filter(n => n?.type === "custom-circle").map(n => n.id))
        const keptEdges = edges.filter(e => !removedIds.has(e?.sourceNodeId) && !removedIds.has(e?.targetNodeId))
        return { nodes: keptNodes, edges: keptEdges }
    }
    /**
     * 构建“并行按顺序执行”的边序列：
     * - 在分叉节点（出度>1）逐个展开后继，先走到下一个“门”（分叉/汇聚/终点）再处理其他分支
     * - 在汇聚节点（入度>1）等待所有前驱到齐后再展开其后继
     * 返回边序列 [[sourceId,targetId], ...]
     */
    const buildSequentialEdgeOrder = (data): string[][] => {
        const edges = Array.isArray(data?.edges) ? data.edges : []
        const nodes = Array.isArray(data?.nodes) ? data.nodes : []
        const out = new Map<string, string[]>()
        const indeg = new Map<string, number>()
        const origIn = new Map<string, number>()
        for (let i = 0; i < nodes.length; i++) {
            indeg.set(nodes[i].id, 0)
            origIn.set(nodes[i].id, 0)
            if (!out.has(nodes[i].id)) out.set(nodes[i].id, [])
        }
        for (let i = 0; i < edges.length; i++) {
            const s = edges[i].sourceNodeId
            const t = edges[i].targetNodeId
            if (!out.has(s)) out.set(s, [])
            out.get(s)!.push(t)
            indeg.set(t, (indeg.get(t) || 0) + 1)
            origIn.set(t, (origIn.get(t) || 0) + 1)
            if (!origIn.has(s)) origIn.set(s, origIn.get(s) || 0)
            if (!indeg.has(s)) indeg.set(s, indeg.get(s) || 0)
        }
        // 起点：从第一个节点开始执行
        let starts: string[] = []
        if (nodes.length > 0) {
            starts = [nodes[0].id]
        } else {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i]?.type === "start") starts.push(nodes[i].id)
            }
            if (starts.length === 0) {
                for (let i = 0; i < nodes.length; i++) {
                    const nid = nodes[i].id
                    if ((indeg.get(nid) || 0) === 0 && (out.get(nid)?.length || 0) > 0) {
                        starts.push(nid)
                    }
                }
            }
        }
        const remainIn = new Map<string, number>()
        indeg.forEach((v, k) => remainIn.set(k, v))
        const order: string[][] = []
        const gateQueue: string[] = [...starts]
        const expanded = new Set<string>()
        const pushGate = (nid: string) => {
            if (!nid) return
            gateQueue.push(nid)
        }
        const processChain = (u: string, v: string) => {
            order.push([u, v])
            remainIn.set(v, (remainIn.get(v) || 0) - 1)
            const isJoin = (origIn.get(v) || 0) > 1
            if (isJoin) {
                if ((remainIn.get(v) || 0) <= 0) pushGate(v)
                return
            }
            let curr = v
            while (true) {
                const outs = out.get(curr) || []
                const inV = origIn.get(curr) || 0
                if (inV > 1) {
                    if ((remainIn.get(curr) || 0) <= 0) pushGate(curr)
                    break
                }
                if (outs.length !== 1) {
                    if (outs.length >= 1) pushGate(curr)
                    break
                }
                const next = outs[0]
                order.push([curr, next])
                remainIn.set(next, (remainIn.get(next) || 0) - 1)
                const joinNext = (origIn.get(next) || 0) > 1
                if (joinNext) {
                    if ((remainIn.get(next) || 0) <= 0) pushGate(next)
                    break
                }
                curr = next
            }
        }
        while (gateQueue.length > 0) {
            const g = gateQueue.shift()!
            if (!g || expanded.has(g)) continue
            const outs = out.get(g) || []
            if (outs.length === 0) {
                expanded.add(g)
                continue
            }
            for (let i = 0; i < outs.length; i++) {
                processChain(g, outs[i])
            }
            expanded.add(g)
        }
        return order
    }
    /**
     * 将边序列转换为点路径与节点标记
     */
    const convertEdgeOrderToPointPaths = (edgeOrder: string[][], data) => {
        const edgeMap = buildEdgePolylineMap(data)
        const paths: THREE.Vector3[][] = []
        const markers: (string | null)[][] = []
        for (let i = 0; i < edgeOrder.length; i++) {
            const [s, t] = edgeOrder[i]
            let poly = edgeMap.get(`${s}->${t}`)
            if (!poly || poly.length < 2) continue
            const pts: THREE.Vector3[] = []
            const mks: (string | null)[] = []
            for (let k = 0; k < poly.length; k++) {
                pts.push(poly[k].clone())
                mks.push(null)
            }
            if (pts.length > 0) {
                mks[0] = s
                mks[mks.length - 1] = t
            }
            paths.push(pts)
            markers.push(mks)
        }
        return { paths, markers }
    }
    // 将节点顺序路径展开为沿圆柱折线的点路径
    // 并记录关键路径点是否对应节点，用于播放脉冲效果
    const buildFlowPointPathsFromNodeSeqs = (seqs: string[][], data) => {
        const edgeMap = buildEdgePolylineMap(data)
        const paths: THREE.Vector3[][] = []
        const markers: (string | null)[][] = []
        for (let i = 0; i < seqs.length; i++) {
            const seq = seqs[i]
            if (!seq || seq.length < 2) continue
            const pts: THREE.Vector3[] = []
            const mks: (string | null)[] = []
            for (let j = 0; j < seq.length - 1; j++) {
                const a = seq[j]
                const b = seq[j + 1]
                const key = `${a}->${b}`
                let poly = edgeMap.get(key)
                if (!poly || poly.length < 2) {
                    const amesh = idToMeshMap.get(a) as any
                    const bmesh = idToMeshMap.get(b) as any
                    if (amesh && bmesh) {
                        const pa = new THREE.Vector3()
                        const pb = new THREE.Vector3()
                        amesh.getWorldPosition(pa)
                        bmesh.getWorldPosition(pb)
                        poly = [pa, pb]
                    } else {
                        continue
                    }
                }
                if (j === 0) {
                    for (let k = 0; k < poly.length; k++) {
                        pts.push(poly[k].clone())
                        mks.push(null)
                    }
                    if (pts.length > 0) mks[0] = a
                    mks[mks.length - 1] = b
                } else {
                    for (let k = 1; k < poly.length; k++) {
                        pts.push(poly[k].clone())
                        mks.push(null)
                    }
                    mks[mks.length - 1] = b
                }
            }
            if (pts.length >= 2) {
                paths.push(pts)
                markers.push(mks)
            }
        }
        return { paths, markers }
    }
    // 创建表示“流动”的小球（带自发光材质）
    const createFlowSphere = () => {
        const g = new THREE.SphereGeometry(6, 16, 12)
        const m = new THREE.MeshStandardMaterial({ color: "#00ff88", emissive: new THREE.Color("#00ff88"), emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.3 })
        flowSphere = new THREE.Mesh(g, m)
        sphereAnimationGroup.add(flowSphere)
    }
    // 触发某个节点的脉冲动画（缩放轻微弹跳）
    const setPulse = (obj: THREE.Object3D | null, duration = 0.5) => {
        if (!obj) return
        pulseNode = obj
        pulseDuration = duration
        pulseTime = 0
        pulseOriginalScale = obj.scale.clone()
    }
    // 更新脉冲动画（基于时间推进）
    const updatePulse = (dt: number) => {
        if (!pulseNode || !pulseOriginalScale) return
        pulseTime += dt
        const p = Math.min(1, pulseTime / pulseDuration)
        const factor = 1 + 0.25 * Math.sin(p * Math.PI)
        pulseNode.scale.set(pulseOriginalScale.x * factor, pulseOriginalScale.y * factor, pulseOriginalScale.z * factor)
        if (p >= 1) {
            pulseNode.scale.copy(pulseOriginalScale)
            pulseNode = null
            pulseOriginalScale = null
        }
    }
    // 启动流程执行动画：索引模型、生成节点顺序路径与折线点路径，重置进度并定位到起点
    const startBpmnAnimation = (data) => {
        indexNodeMeshes()
        const edgeOrder = buildSequentialEdgeOrder(data)
        const fp = convertEdgeOrderToPointPaths(edgeOrder, data)
        flowPointPaths = fp.paths
        flowPointNodeMarkers = fp.markers
        if (!flowSphere) createFlowSphere()
        currentPathIndex = 0
        currentSegmentIndex = 0
        segmentProgress = 0
        if (flowPointPaths.length > 0 && flowPointPaths[0].length > 0) {
            flowSphere.position.copy(flowPointPaths[0][0])
        }
        if (edgeOrder.length > 0) {
            const firstId = edgeOrder[0][0]
            const firstMesh = idToMeshMap.get(firstId) as any
            if (firstMesh) {
                setPulse(firstMesh, 0.6)
            }
        }
    }
    // 每帧更新：若未暂停，则沿当前折线段以 flowSpeed 匀速插值前进
    // 到达段末切换下一段；到达节点触发脉冲；到达路径末尾切换下一条路径
    const updateFlowAnimation = (dt: number) => {
        if (!isFlowAnimating || flowPointPaths.length === 0 || !flowSphere) {
            return
        }
        if (flowPaused) {
            return
        }
        updatePulse(dt)
        if (currentPathIndex >= flowPointPaths.length) {
            currentPathIndex = 0
            currentSegmentIndex = 0
            segmentProgress = 0
        }
        const pts = flowPointPaths[currentPathIndex]
        if (!pts || pts.length < 2) return
        if (currentSegmentIndex >= pts.length - 1) {
            // 如果即将从最后一条路径回到第一条路径，先还原最后一个节点的脉冲缩放
            const willWrap = (currentPathIndex + 1) >= flowPointPaths.length
            currentPathIndex++
            currentSegmentIndex = 0
            segmentProgress = 0
            if (currentPathIndex >= flowPointPaths.length) {
                if (willWrap && pulseNode && pulseOriginalScale) {
                    pulseNode.scale.copy(pulseOriginalScale)
                    pulseNode = null
                    pulseOriginalScale = null
                }
                currentPathIndex = 0
            }
            const nextPts = flowPointPaths[currentPathIndex]
            if (nextPts && nextPts.length > 0) {
                flowSphere.position.copy(nextPts[0])
            }
            const mk0 = flowPointNodeMarkers[currentPathIndex]?.[0]
            if (mk0) {
                const nmesh = idToMeshMap.get(mk0) as any
                if (nmesh) {
                    setPulse(nmesh, 0.6)
                }
            }
            return
        }
        const pa = pts[currentSegmentIndex]
        const pb = pts[currentSegmentIndex + 1]
        const dist = pa.distanceTo(pb)
        if (dist <= 1e-6) {
            currentSegmentIndex++
            segmentProgress = 0
            const mk = flowPointNodeMarkers[currentPathIndex]?.[currentSegmentIndex]
            if (mk) {
                const nmesh = idToMeshMap.get(mk) as any
                if (nmesh) setPulse(nmesh, 0.4)
            }
            return
        }
        segmentProgress += (flowSpeed * dt) / dist
        if (segmentProgress >= 1) {
            segmentProgress = 0
            currentSegmentIndex++
            flowSphere.position.copy(pb.clone())
            const mk = flowPointNodeMarkers[currentPathIndex]?.[currentSegmentIndex]
            if (mk) {
                const nmesh = idToMeshMap.get(mk) as any
                if (nmesh) setPulse(nmesh, 0.4)
            }
        } else {
            const pos = new THREE.Vector3().lerpVectors(pa, pb, segmentProgress)
            flowSphere.position.copy(pos)
        }
    }
    // 开始动画（从当前或起点继续）
    const startFlow = () => {
        if (!flowSphere && flowPointPaths.length > 0 && flowPointPaths[0].length > 0) {
            createFlowSphere()
            flowSphere.position.copy(flowPointPaths[0][0])
        }
        isFlowAnimating = true
        flowPaused = false
    }
    // 停止动画并复位到路径起点
    const stopFlow = () => {
        isFlowAnimating = false
        flowPaused = false
        currentPathIndex = 0
        currentSegmentIndex = 0
        segmentProgress = 0
        if (flowSphere && flowPointPaths.length > 0 && flowPointPaths[0].length > 0) {
            flowSphere.position.copy(flowPointPaths[0][0])
        }
    }
    // 暂停动画（保持当前位置与进度）
    const pauseFlow = () => {
        flowPaused = true
    }
    // 恢复动画
    const resumeFlow = () => {
        flowPaused = false
    }
    // 切换开/关
    const toggleFlow = (enable: boolean) => {
        if (enable) startFlow()
        else stopFlow()
    }
    // 渲染辅助面
    const renderSpace3d = (data) => {
        const layers = Array.isArray(data?.layers) ? data.layers : []
        const groupName = "space3dFaceGroup"
        let faceGroup = scene.getObjectByName(groupName) as THREE.Group
        if (!faceGroup) {
            faceGroup = new THREE.Group()
            faceGroup.name = groupName
            scene.add(faceGroup)
        }

        for (let i = faceGroup.children.length - 1; i >= 0; i--) {
            const child: any = faceGroup.children[i]
            faceGroup.remove(child)
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((m: THREE.Material) => m.dispose())
                } else {
                    child.material.dispose()
                }
            }
        }

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i]
            const polygon = Array.isArray(layer?.polygon) ? layer.polygon : []
            if (polygon.length < 3) continue

            const points2d: THREE.Vector2[] = []
            for (let j = 0; j < polygon.length; j++) {
                const p = polygon[j]
                const x = Array.isArray(p) ? Number(p[0]) : Number(p?.x)
                const y = Array.isArray(p) ? Number(p[1]) : Number(p?.y)
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue
                points2d.push(new THREE.Vector2(x, y))
            }
            if (points2d.length < 3) continue

            const shape = new THREE.Shape(points2d)
            const geometry = new THREE.ShapeGeometry(shape)
            const color = new THREE.Color().setHSL(((layer?.zIndex ?? i) * 0.12 + 0.58) % 1, 0.2, 0.36)
            const material = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
            const mesh = new THREE.Mesh(geometry, material)
            const z = Number(layer?.z) || 0
            mesh.position.set(0, 0, z)
            mesh.userData = {
                isSpace3dFace: true,
                zIndex: layer?.zIndex,
                name: layer?.name,
            }
            faceGroup.add(mesh)

            const wireGeometry = new THREE.WireframeGeometry(geometry)
            const wireMaterial = new THREE.LineBasicMaterial({ color: 0x3a4a59, transparent: true, opacity: 0.18, depthWrite: false })
            const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial)
            wireframe.position.set(0, 0, z + 0.03)
            wireframe.userData = {
                isSpace3dFace: true,
                zIndex: layer?.zIndex,
                name: layer?.name,
            }
            faceGroup.add(wireframe)

            const borderPoints = points2d.map(p => new THREE.Vector3(p.x, p.y, z + 0.05))
            borderPoints.push(new THREE.Vector3(points2d[0].x, points2d[0].y, z + 0.05))
            const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints)
            const borderMaterial = new THREE.LineBasicMaterial({ color: 0x90a4b8, transparent: true, opacity: 0.95 })
            const border = new THREE.Line(borderGeometry, borderMaterial)
            border.userData = {
                isSpace3dFace: true,
                zIndex: layer?.zIndex,
                name: layer?.name,
            }
            faceGroup.add(border)


        }
    }
    // 三维数据转换为二维
    const getSpace3dTo2d = () => {
        const nodes = JSON.parse(JSON.stringify(_normalNodes));
        const edges = JSON.parse(JSON.stringify(_edges));
        const space3d = JSON.parse(JSON.stringify(_space3d));
        sphereAnimationGroup.traverse((child) => {
            if (child.isMesh && child.userData) {
                if(child.userData.isSphere||child.userData.isNode){
                    const worldPosition = new THREE.Vector3();
                    child.getWorldPosition(worldPosition);
                    if(child.userData.isSphere&&child.userData.type=='point'){
                        const id = child.userData.id;
                        const ind = child.userData.ind
                        const edgeId = _pointOfEdge.get(id)
                        for (let index = 0; index < edges.length; index++) {
                            const element = edges[index];
                            if(element.id==edgeId){
                                element.properties.pointsList[ind].x = worldPosition.x;
                                element.properties.pointsList[ind].y = worldPosition.y;
                            }
                        }
                    }else{
                        const temp = JSON.parse(JSON.stringify(child.userData.nodeData));
                        temp.x = worldPosition.x;
                        temp.y = worldPosition.y;
                        nodes.push(temp);
                    }
                }
            }
        });
        return {
            nodes,
            edges,
            space3d
        };        
    }
    return {
        init,
        analysisBpmn,
        startFlow,
        stopFlow,
        pauseFlow,
        resumeFlow,
        toggleFlow,
        getSpace3dTo2d
    };
};
