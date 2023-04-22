# webgl
webgl 是在网页上绘制和渲染三维图形的技术，可以让用户与其进行交互。
## 入门基础用法
- 在html中建立canvas 画布
- 在js中获取canvas画布
- 使用canvas 获取webgl 绘图上下文
- 在script中建立顶点着色器和片元着色器，glsl es
- 在js中获取顶点着色器和片元着色器的文本
- 初始化着色器
- 指定将要用来清空绘图区的颜色
- 使用之前指定的颜色，清空绘图区
- 绘制顶点
```
// 需要一个canvas
<canvas id="canvas"></canvas>
<!-- 顶点着色器 -->
<script id="vertexShader" type="x-shader/x-vertex">
    void main() {
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        gl_PointSize = 100.0;
    }
</script>
<!-- 片元着色器 -->
<script id="fragmentShader" type="x-shader/x-fragment">
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
</script>
<script>
    // canvas 画布
    const canvas = document.getElementById('canvas');
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    // webgl画笔
    const gl = canvas.getContext('webgl');
    // 顶点着色器
    const vsSource = document.getElementById('vertexShader').innerText;
    // 片元着色器
    const fsSource = document.getElementById('fragmentShader').innerText;
    // 初始化着色器
    initShaders(gl, vsSource, fsSource);
    // 指定将要用来清理绘图区的颜色
    gl.clearColor(0., 0.0, 0.0, 1.0);
    // 清理绘图区
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制顶点
    gl.drawArrays(gl.POINTS, 0, 1);

    function initShaders(gl,vsSource,fsSource){
        //创建程序对象
        const program = gl.createProgram();
        //建立着色对象
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        //把顶点着色对象装进程序对象中
        gl.attachShader(program, vertexShader);
        //把片元着色对象装进程序对象中
        gl.attachShader(program, fragmentShader);
        //连接webgl上下文对象和程序对象
        gl.linkProgram(program);
        //启动程序对象
        gl.useProgram(program);
        //将程序对象挂到上下文对象上
        gl.program = program;
        return true;
    }

    function loadShader(gl, type, source) {
        //根据着色类型，建立着色器对象
        const shader = gl.createShader(type);
        //将着色器源文件传入着色器对象中
        gl.shaderSource(shader, source);
        //编译着色器对象
        gl.compileShader(shader);
        //返回着色器对象
        return shader;
    }
</script>
```
- clearCol使用canvas 获取webgl 绘图上下文or(r,g,b,a) 中的参数是红、绿、蓝、透明度，其定义域是[0,1]
- css 中有一个“rgba(255,255,255,1)” 颜色，其中r、g、b的定义域是[0,255]，这里要和webgl里的颜色区分一下。

### webgl 绘图需要两种着色器
- 顶点着色器（Vertex shader）：描述顶点的特征，如位置、颜色等。
- 片元着色器（Fragment shader）：进行逐片元处理，如光照。

两点决定一条直线，顶点着色器里的顶点就是决定这一条直线的两个点，片元着色器里的片元就是把直线画到画布上后，这两个点之间构成直线的每个像素。

### 着色器语言
webgl 的着色器语言是GLSL ES语言
- 顶点着色程序，要写在type=“x-shader/x-vertex” 的script中。

```js
<script id="vertexShader" type="x-shader/x-vertex">
    void main() {
        //gl_Position 是顶点的位置，gl_PointSize 是顶点的尺寸，这种名称都是固定的
        //vec4()  是一个4维矢量对象。
        //将vec4() 赋值给顶点点位gl_Position 的时候，其中的前三个参数是x、y、z，第4个参数默认1.0，其含义我们后面会详解；
        gl_Position = vec4(0.3, 0.2, 0.1, 0.4);
        gl_PointSize = 100.0;
    }
</script>
```

- 片元着色程序，要写在type=“x-shader/x-fragment” 的script中。

```js
<script id="fragmentShader" type="x-shader/x-fragment">
    void main() {
        //gl_FragColor 是片元的颜色
        //将vec4() 赋值给片元颜色gl_FragColor 的时候，其中的参数是r,g,b,a。
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
</script>
```
### 初始化着色器的步骤
具体参考``06.webgl画一个点``
- 建立程序对象
- 建立顶点着色器对象和片元着色器对象
- 将顶点着色器对象和片元着色器对象装进程序对象中
- 连接webgl 上下文对象和程序对象
- 启动程序对象
### 动态设置
上面的这种用法是写死的，不可扩展。要让其可扩展，可以使用attribute变量。attribute 变量是只有顶点着色器才能使用它的。js 可以通过attribute 变量向顶点着色器传递与顶点相关的数据。
- 在顶点着色器中声明attribute 变量。
- 在js中获取attribute 变量
- 修改attribute 变量
```
<canvas id="canvas"></canvas>
<script id="vertexShader" type="x-shader/x-vertex">
    //attribute 是存储限定符，是专门用于向外部导出与点位相关的对象的，这类似于es6模板语法中export
    //vec4 是变量类型，vec4是4维矢量对象。
    //a_Position 是变量名，之后在js中会根据这个变量名导入变量。这个变量名是一个指针，指向实际数据的存储位置。也是说，我们如果在着色器外部改变了a_Position所指向的实际数据，那么在着色器中a_Position 所对应的数据也会修改。
    attribute vec4 a_Position;
    void main(){
        gl_Position = a_Position;
        gl_PointSize = 50.0;
    }
</script>
<script id="fragmentShader" type="x-shader/x-fragment">
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
</script>
<script type="module">
    // 上面抽离的方法
    import {initShaders} from '../jsm/Utils.js';
    const canvas = document.getElementById('canvas');
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    const gl = canvas.getContext('webgl');
    const vsSource = document.getElementById('vertexShader').innerText;
    const fsSource = document.getElementById('fragmentShader').innerText;
    initShaders(gl, vsSource, fsSource);
    //gl.getAttribLocation() 是获取着色器中attribute 变量的方法。
    //gl.program 是初始化着色器时，在上下文对象上挂载的程序对象。
    //'a_Position' 是着色器暴露出的变量名。
    const a_Position=gl.getAttribLocation(gl.program,'a_Position');
    // 我们得用特定的方法改变a_Position的值
    //gl.vertexAttrib3f() 是改变变量值的方法
    //gl.vertexAttrib3f() 方法的参数中：
      //a_Position 就是之前获取的着色器变量
      //后面的3个参数是顶点的x、y、z位置
    gl.vertexAttrib3f(a_Position,0.0,0.0,0.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //drawArrays() 方法只会同步绘图，走完了js 主线程后，再次绘图时，就会从头再来。也就说，异步执行的drawArrays() 方法会把画布上的图像都刷掉。
    // 例如在鼠标点击绘制点的例子中，想要保留之前绘制的点，就需要用个数组存起来，具体参考例子代码
    gl.drawArrays(gl.POINTS, 0, 1);
</script>
```
#### vertexAttrib3f()的同族函数
gl.vertexAttrib3f(location,v0,v1,v2) 方法是一系列修改着色器中的attribute 变量的方法之一，它还有许多同族方法
- gl.vertexAttrib1f(location,v0) 
- gl.vertexAttrib2f(location,v0,v1)
- gl.vertexAttrib3f(location,v0,v1,v2)
- gl.vertexAttrib4f(location,v0,v1,v2,v3)
- 它们都可以改变attribute 变量的前n 个值。
- 比如 vertexAttrib1f() 方法自定一个矢量对象的v0值，v1、v2 则默认为0.0，v3默认为1.0，其数值类型为float 浮点型。
#### webgl 函数的命名规律
GLSL ES里函数的命名结构是：<基础函数名><参数个数><参数类型>  
以vertexAttrib3f(location,v0,v1,v2,v3) 为例：  
- vertexAttrib：基础函数名
- 3：参数个数，这里的参数个数是要传给变量的参数个数，而不是当前函数的参数个数
- f：参数类型，f 代表float 浮点类型，除此之外还有i 代表整型，v代表数字……


### 将css颜色解析为webgl 颜色
```
const rgbaCSS = "rgba(255,100,0,1)";
const reg = RegExp(/\((.*)\)/);
const rgbaStr = reg.exec(rgbaCSS)[1];
const rgb = rgbaStr.split(",").map((ele) => parseInt(ele));
const r = rgb[0] / 255;
const g = rgb[1] / 255;
const b = rgb[2] / 255;
const a = rgb[3];
gl.clearColor(r, g, b, a);
gl.clear(gl.COLOR_BUFFER_BIT);
```
可以使用threejs中的Color方法来处理颜色
```
const color = new Color("rgba(255,0,0,1)");
gl.clearColor(color.r, color.g, color.b, 1)
gl.clear(gl.COLOR_BUFFER_BIT);
```
### 坐标系
canvas 2d 画布和webgl 画布使用的坐标系都是二维直角坐标系，只不过它们坐标原点、y 轴的坐标方向，坐标基底都不一样了。
#### canvas 2d画布的坐标系
canvas 2d 坐标系的原点在左上角。
canvas 2d 坐标系的y 轴方向是朝下的。
canvas 2d 坐标系的坐标基底有两个分量，分别是一个像素的宽和一个像素的高，即1个单位的宽便是1个像素的宽，1个单位的高便是一个像素的高。

#### webgl的坐标系
webgl坐标系的坐标原点在画布中心。
webgl坐标系的y 轴方向是朝上的。
webgl坐标基底中的两个分量分别是半个canvas的宽和canvas的高，即1个单位的宽便是半个个canvas的宽，1个单位的高便是半个canvas的高。

### canvas 2d和webgl绘图的差异
- webgl 的绘图逻辑和canvas 2d 的绘图逻辑有一个本质的差别。
- 浏览器有三大线程： js 引擎线程、GUI 渲染线程、浏览器事件触发线程。
- 其中GUI 渲染线程就是用于渲图的，在这个渲染线程里，渲染二维图形和渲染三维图形的语言不一样。
- 渲染二维图形的是js语言。
- 渲染三维图形的是GLSL ES 语言。
- 而我们在做web项目时，业务逻辑、交互操作都是用js 写的。
- 在用js 绘制webgl图形时，通过“程序对象”来处理这个问题。

### 同步绘图
webgl 的同步绘图的现象，其实是由webgl 底层内置的颜色缓冲区导致的。  
这个颜色缓冲区会在电脑里占用一块内存。在我们使用webgl 绘图的时候，是先在颜色缓冲区中画出来。  
在我们想要将图像显示出来的时候，那就照着颜色缓冲区中的图像去画，这个步骤是webgl 内部自动完成的，我们只要执行绘图命令即可。  
颜色缓冲区中存储的图像，只在当前线程有效。比如我们先在js 主线程中绘图，主线程结束后，会再去执行信息队列里的异步线程。在执行异步线程时，颜色缓冲区就会被webgl 系统重置。

### 绘制圆形的顶点
webgl绘制的时候，是一个一个像素点绘制出来的，在绘制圆的时候，我们需要根据，每个点距离圆心的距离判断，在园内就绘制，不在的就不绘制。这样就可以得到一个圆。  
需要用到的
- distance(p1,p2) 计算两个点位的距离
- gl_PointCoord 片元在一个点中的位置，此位置是被归一化的
  - 所以这个片元的中心点位置就是0.5,0.5
- discard 丢弃，即不会进行渲染

### 绘制星星中的补间动画
- 合成：多个时间轨的集合
- 时间轨：通过关键帧，对其中目标对象的状态进行插值计算
- 补间动画：通过两个关键帧，对一个对象在这两个关键帧之间的状态进行插值计算，从而实现这个对象在两个关键帧间的平滑过渡
- Compose：建立合成对象
  - 属性
    - parent 父对象，合成对象可以相互嵌套
    - children 子对象集合，其集合元素可以是时间轨，也可以是合成对象
  - 方法
    - add(obj) 添加子对象方法
    - update(t) 基于当前时间更新子对象状态的方法
- Track：建立时间轨
  - 属性
    - target 时间轨上的目标对象
    - parent 父对象，只能是合成对象
    - start 起始时间，即时间轨的建立时间
    - timeLen 时间轨总时长
    - loop 是否循环
    - keyMap 关键帧集合，结构如下
    - ```[    [        '对象属性1',        [            [时间1,属性值], //关键帧
            [时间2,属性值], //关键帧
        ]
    ],
    [        '对象属性2',        [            [时间1,属性值], //关键帧
            [时间2,属性值], //关键帧
        ]
    ],
]```
  - 方法
    - update(t) 基于当前时间更新目标对象的状态。
      - 先计算本地时间，即世界时间相对于时间轨起始时间的的时间。
      - 若时间轨循环播放，则本地时间基于时间轨长度取余。
      - 遍历关键帧集合：
      - 若本地时间小于第一个关键帧的时间，目标对象的状态等于第一个关键帧的状态
      - 若本地时间大于最后一个关键帧的时间，目标对象的状态等于最后一个关键帧的状态
      - 否则，计算本地时间在左右两个关键帧之间对应的补间状态

## 绘制方式
在webgl 里所有的图形都是由顶点连接而成的。这种用来绘制线、面的点，和之前的点不一样。
### 绘制多点
- 建立顶点数据
  - 这些数据存储在js中
  - 需要传递给着色器
- webgl 系统建立了一个能翻译双方语言的缓冲区，来处理数据沟通问题
  - createBuffer：建立缓冲对象
  - bindBuffer(target,buffer) ：绑定缓冲对象，让其和着色器建立连接
    - target 要把缓冲区放在webgl 系统中的什么位置
    - buffer 缓冲区
  - bufferData(target, data, usage)：往缓冲区对象中写入数据
    - target 要把缓冲区放在webgl 系统中的什么位置
    - data 数据
    - usage 向缓冲区写入数据的方式，这里先使用 gl.STATIC_DRAW 方式，它是向缓冲区中一次性写入数据，着色器会绘制多次。
  - vertexAttribPointer(local,size,type,normalized,stride,offset)：将缓冲区对象分配给attribute 变量
    - local：attribute变量
    - size：顶点分量的个数，例如vertices 数组中，两个数据表示一个顶点，就写2
    - type：数据类型，比如 gl.FLOAT 浮点型
    - normalized：是否将顶点数据归一
    - stride：相邻两个顶点间的字节数，我的例子里写的是0，那就是顶点之间是紧挨着的
    - offset：从缓冲区的什么位置开始存储变量，我的例子里写的是0，那就是从头开始存储变量
  - enableVertexAttribArray(a_Position)：开启顶点数据的批处理功能。
    - location：attribute变量
  - 绘图
    - drawArrays(mode,first,count)
      - mode：绘图模式，比如 gl.POINTS 画点
      - first：从哪个顶点开始绘制
      - count：要画多少个顶点
### 绘制三角形
三个点可以确定一个唯一的三角面。在上面的例子上去掉顶点着色器中的gl_PointSize，因为这个属性是控制顶点大小的，已经不需要显示顶点了。然后修改绘制的方法，使用gl.drawArrays(gl.TRIANGLES, 0, 3);
### 基本图形（gl.drawArrays(mode,first,count) 方法可以绘制以下图形）
- POINTS：可视的点
- LINES：单独线段
- LINE_STRIP：线条
- LINE_LOOP：闭合线条
- TRIANGLES：单独三角形
- TRIANGLE_STRIP：三角带
- TRIANGLE_FAN：三角扇
### 面的绘制
绘制原理
- 面有正反两面。
- 面向我们的面，如果是正面，那它必然是逆时针绘制的；
- 面向我们的面，如果是反面，那它必然是顺时针绘制的；

#### TRIANGLE_STRIP 三角带
v0>v1>v2>v3>v4>v5 六个顶点，绘制顺序是：
- v0>v1>v2
  - 以上一个三角形的第二条边+下一个点为基础，以和第二条边相反的方向绘制三角形
- v2>v1>v3
  - 以上一个三角形的第三条边+下一个点为基础，以和第二条边相反的方向绘制三角形
- v2>v3>v4
  - 以上一个三角形的第二条边+下一个点为基础，以和第二条边相反的方向绘制三角形
- v4>v3>v5
规律：
  - 第一个三角形：v0>v1>v2
  - 第偶数个三角形：以上一个三角形的第二条边+下一个点为基础，以和第二条边相反的方向绘制三角形
  - 第奇数个三角形：以上一个三角形的第三条边+下一个点为基础，以和第二条边相反的方向绘制三角形
#### TRIANGLE_FAN 三角扇
- v0>v1>v2
  - 以上一个三角形的第三条边+下一个点为基础，按照和第三条边相反的顺序，绘制三角形
- v0>v2>v3
  - 以上一个三角形的第三条边+下一个点为基础，按照和第三条边相反的顺序，绘制三角形
- v0>v3>v4
  - 以上一个三角形的第三条边+下一个点为基础，按照和第三条边相反的顺序，绘制三角形
- v0>v4>v5
### 绘制矩形
webgl 可以绘制的面只有三角面，所以要绘制矩形面的话，只能用两个三角形去拼。
### 平移图形
对图形的平移就是对图形所有顶点的平移。顶点的位移就是向量的加法。
### 旋转图形
三维物体的旋转需要知道以下条件：
- 旋转轴
- 旋转方向
- 旋转角度
#### 旋转方向的正负
在webgl 中，除裁剪空间之外的大部分功能都使用了右手坐标系。  
大拇指X轴，食指Y轴，中指Z轴
- 当物体绕z 轴，从x轴正半轴向y轴正半轴逆时针旋转时，是正向旋转，反之为负。
- 当物体绕x 轴，从y轴正半轴向z轴正半轴逆时针旋转时，是正向旋转，反之为负。
- 当物体绕y 轴，从z轴正半轴向x轴正半轴逆时针旋转时，是正向旋转，反之为负。
可以简单理解为，以某一个轴为轴心旋转，"xyz"靠前的正半轴，转向靠后的正半轴，就是正向旋转，否者就是负向旋转。
绕哪个轴旋转，哪个轴对应的坐标不变
#### 旋转公式
例如让一个顶点A（ax,ay,az）以Z轴为旋转轴，正向旋转β°，到B（bx,by,bz）点，求B的位置。原点为O
- 因为A点已知，所以原点到A和x轴的夹角α，是可以求出来的
- 旋转之后的原点到B和x轴的夹角γ就等于α+β
- 通过三角函数就可以推出bx、by
- bx=cosγ*|OA|
- by=sinγ*|OA|
- 利用和角公式求cosγ和sinγ的值
  - cosγ=cos(α+β)
  - cosγ=cosα*cosβ-sinα*sinβ
  - sinγ=sin(α+β)
  - sinγ=cosβ*sinα+sinβ*cosα
- bx=cosγ*|OA|
- bx=(cosα*cosβ-sinα*sinβ)*|OA|
- bx=cosα*cosβ*|OA|-sinα*sinβ*|OA|
- by=sinγ*|OA|
- by=(cosβ*sinα+sinβ*cosα)*|OA|
- by=cosβ*sinα*|OA|+sinβ*cosα*|OA|
- 因为
  - cosα*|OA|=ax
  - sinα*|OA|=ay
- 所以可以简化bx、by的公式
  - bx=ax*cosβ-ay*sinβ
  - by=ay*cosβ+ax*sinβ
#### 缩放图形
缩放可以理解为对向量长度的改变，或者对向量坐标分量的同步缩放

## 矩阵
按照矩形纵横排列的复数集合。
### 向量
向量，又叫矢量，它是一个用于表示方向和量的对象。在webgl 里的向量有1维向量、2维向量、3维向量和4维向量。
- 1维向量中有1个数字，对应的是单轴坐标系里的点位。
- 2维向量中有2个数字，对应的是2维坐标系里的点位。
- 3维向量中有3个数字，对应的是3维坐标系里的点位。
- 4维向量中有4个数字，对应的是3维坐标系里的点位，外加一个附加数据，至于这个数据是什么，要看我们的项目需求。

### 矩阵和向量的乘法
矩阵乘以向量时，向量是几维的，那矩阵中就应该有几个向量。
- 横着的两组遵循的规则是行主序，即将矩阵中的一行数据视之为一个向量。
- 竖着的两组遵循的规则是列主序，即将矩阵中的一列数据视之为一个向量。
至于我们是使用行主序，还是列主序，这就得看规则的定制者了。  
**在webgl 里，矩阵元素的排列规则是列主序。**  
**数学中常用的写法是行主序**  
**矩阵和向量相乘的规则就是让矩阵中的每个向量和向量v相乘。**  
**向量和向量相乘，就是在求向量的点积，其结果是一个实数，而不再是向量。**
以行主序为例：矩阵乘以向量的运算是将矩阵的每一行与向量对应位置相乘，并将得到的结果相加，**即矩阵的第一行与向量逐个元素相乘并相加，得到向量的第一个元素；矩阵的第二行同样与向量逐个元素相乘并相加，得到向量的第二个元素；以此类推**。
### 二维矩阵旋转公式
例如让一个顶点A（ax,ay,az）以Z轴为旋转轴，正向旋转β°，到B（bx,by,bz）点，求B的位置。原点为O
- 矩阵m乘以向量OA等于向量OB，也就是旋转β之后的向量
- 需要注意webgl中是列主序
- 因为A是已知的，根据前面推导得来的公式
  - bx=ax*cosβ-ay*sinβ
  - by=ay*cosβ+ax*sinβ
- 将其带入可推导出矩阵m

```
// 列主序  矩阵m 未知
(
  a,e,
  b,f
)
// OA向量已知
（ax,ay）
//m * OA 结果
a*ax+b*by,
e*ax+f*by
// 根据前面通过三角函数推导的公司带入 得出结果
//bx=ax*cosβ-ay*sinβ
//by=ay*cosβ+ax*sinβ
(
  cosβ,sinβ,
  -sinβ,cosβ
)
```
### 四维矩阵旋转公式
基本逻辑同上，区别在于需要保留除了x，y之外的数据，因为这里是以Z轴为轴心，其他轴同理
```
// 列主序  矩阵m 未知
(
  a,  e,  0.0,0.0,
  b,  f,  0.0,0.0,
  0.0,0.0,1.0,0.0,
  0.0,0.0,0.0,1.0
)
// OA向量已知
（ax,ay）
//m * OA 结果
a*ax+b*by+0+0,
e*ax+f*by+0+0,
0+0+z+0,
0+0+0+w
// 根据前面通过三角函数推导的公司带入 得出结果
//bx=ax*cosβ-ay*sinβ
//by=ay*cosβ+ax*sinβ
(
  cosβ,sinβ,0.0,0.0,
  -sinβ,cosβ,0.0,0.0,
  0.0,0.0,1.0,0.0,
  0.0,0.0,0.0,1.0,
)
```
### 矩阵平移
假设位移距离为tx、ty、tz
```
// 列主序  矩阵m 未知
(
  1.0, 0.0, 0.0,0.0,
  0.0, 1.0, 0.0,0.0,
  0.0, 0.0, 1.0,0.0,
  tx, ty, yz,1.0
)
// OA向量已知
（ax,ay）
//m * OA 结果
ax+tx,
ay+ty,
az+tz,
w
```
### 矩阵缩放
假设缩放为sx、sy、sz
```
// 列主序  矩阵m 未知
(
  sx, 0.0, 0.0,0.0,
  0.0, sy, 0.0,0.0,
  0.0, 0.0, sz,0.0,
  0.0, 0.0, 0.0,1.0
)
// OA向量已知
（ax,ay）
//m * OA 结果
ax*sx,
ay*sy,
az*sz,
w
```
### 矩阵库
手写矩阵，其实是很麻烦的，我们可以将其模块化。  

现在市面上已经有许多开源的矩阵库了，比如《WebGL 编程指南》里的cuon-matrix.j  
three.js 的Matrix3和Matrix4对象。
#### three.js的Matrix4对象为例
- 引入Matrix4对象
  - ``import {Matrix4} from 'https://unpkg.com/three/build/three.module.js';``
- 实例化矩阵对象，在其中写入旋转信息
  - ``const matrix=new Matrix4()``
  - ``matrix.makeRotationZ(Math.PI/6)``

- 基于matrix 对象的elements 属性，修改uniform 变量
  - ``const u_Matrix=gl.getUniformLocation(gl.program,'u_Matrix')``
  - ``gl.uniformMatrix4fv(u_Matrix,false,matrix.elements)``

## 复合变换
### 矩阵相乘
矩阵相乘可以实现复合变换，就比如先位移再旋转(旋转的时候基于原始位置，这样如果位移不为0，就会导致顺序不一样呢的情况下结果不一样)、先旋转在位移，或着连续位移。  
矩阵乘以矩阵的结果还是矩阵  
需要注意的是，**矩阵的乘法不满足结合律**

## 视图矩阵
视图矩阵是用于确定相机角度和位置的矩阵。
### 相机的定义
- 视点：相机的位置
- 视线方向：相机所看的方向
- 上方向：相机绕视线转动的方向

### 相对运动
相机移动的方向和视图变化的方向是相反的。如果是同时运动，且相机和场景视图相对静止，画面是不会发生变化的。 
因此，我们可以默认相机的视点就在零点，相机看向-z方向，其上方向就是y轴。  
当我们改变的相机的视点、视线和上方向的时候，只要相对的去改变场景中的物体即可。  
**而这个相对的去改变场景中的物体的矩阵，就是视图矩阵**。  
通过上面原理，我们可以知道，想要计算视图矩阵，只要让其满足以下条件即可：
- 把视点对齐到原点
- 把视线对齐到-z轴
- 把上方向对齐到y轴
- 把视线和上方向的垂线对齐到x轴

### 正交矩阵的旋转
已知：点A(1,0,0)  
求：把点A绕z 轴逆时针旋转30°，旋转到B点的行主序矩阵m1  
相当于B=m1*A，通过旋转公式，可以求出点B  
继题1的已知条件  
求：把点B绕z 轴逆时针旋转-30°，旋转到A点的列行序矩阵m2  
同样的条件下，只需要将矩阵逆转  
由此我们可以得到一个结论：**正交旋转矩阵的逆矩阵（两个矩阵相乘，它们的乘积为单位矩阵）就是其转置矩阵**。
同样的如果是不同的坐标系，也可以通过这种方式，将一个坐标系中的单位向量，通过转置矩阵的方式转换到另一个坐标系中。无论正旋转还是负旋转都可以。  

### 计算视图矩阵
#### 在已知坐标系基向量的情况下，如何将一个单位矩阵旋转到一个任意的坐标系当中去。  
例如世界坐标系的基向量为m1
- x(1,0,0)
- y(0,1,0)
- z(0,0,1)
相机的坐标系的基向量为m2
- x(cos30°, sin30°,0)
- y(-sin30°,cos30°,0)
- z(0, 0, 1)
求：将m1中的基向量对齐到m2的行主序矩阵m3  
解：
- 将m2的基向量x,y,z 中的x 分量写入m3第1行;
- 将m2的基向量x,y,z 中的y 分量写入m3第2行;
- 将m2的基向量x,y,z 中的z 分量写入m3第3行。
- **在不知旋转轴，旋转角度的时候就使用这种方法**
- 前面的几种方式都是已知旋转轴和角度的方式推导出来的
```
m3=[
    cos30°,-sin30°,0,0,
    sin30°,cos30°, 0,0,
    0,     0,      1,0,
    0,     0,      0,1,
]
``` 
#### 上面是m1转换到m2，那么如果将m2转换到m1
继上面的条件，求将m2中的基向量对齐到m1的行主序矩阵m4  
前面已知：将m1中的基向量对齐到m2的行主序矩阵是m3  
因为：正交旋转矩阵的逆矩阵就是其转置矩阵  
所以：m4就是m3的逆矩阵
```
m3=[
    cos30°,-sin30°,0,0,
    sin30°,cos30°, 0,0,
    0,     0,      1,0,
    0,     0,      0,1,
]
m4=[
    cos30°,sin30°,0,0,
    -sin30°,cos30°,0,0,
    0,0,1,0,
    0,0,0,1
]
```
#### 同通用计算方式
##### 先位移：写出把视点e(ex,ey,ez) 对齐到 O(世界坐标系原点)点上的行主序位移矩阵mt
前面的计算方式视点和原点是在一起的，所以这里需要先位移下
```
mt=[
  1,0,0,-ex,
  0,1,0,-ey,
  0,0,1,-ez,
  0,0,0,1,
]
```
##### 写出把{O;x,y,-z} 对齐到{e;a,b,c} 的行主序旋转矩阵mr1
就使用上面推导出来的通用公式,也就是将原点对齐到视点的矩阵
```
mr1=[
     ax, bx, -cx, 0,
     ay, by, -cy, 0,
     az, bz, -cz, 0,
     0,  0,   0,  1
]
```
##### 计算mr1的逆矩阵mr2。
因为正交旋转矩阵的逆矩阵就是其转置矩阵，所以mr2就是mr1的转置矩阵。  
将视点对齐到原点的矩阵
```
mr2=[
     ax, ay, az, 0,
     bx, by, bz, 0,
    -cx,-cy,-cz, 0,
     0,  0,   0, 1
]
```
##### 视图矩阵=mr2*mt（先位移，再旋转）
**视图矩阵用于将场景中的物体从世界坐标系转换到相机坐标系。**它是一个4x4的矩阵，可以表示相机的位置、方向和旋转等信息。
- 先将视点对齐到原点
- 计算相机的平移矩阵。这个矩阵用于将相机从原点平移到指定位置
  - 上面的推理方式都是视点和原点在一起
  - 求位移矩阵MT
- 构造相机坐标系到世界坐标系的变换矩阵。这个矩阵可以用相机坐标系的基向量来构造
  - 推理过程：
  - 为了方便计算，先求出将原点坐标系对齐到相机坐标系的矩阵
  - 然后求出相机坐标系对齐到原点坐标系的矩阵
    - 这么绕的原因是我们一开始知道的就是原点坐标系和他的单位向量
    - 在不知旋转轴，旋转角度的时候，通过前面推导的公式
      - 分别将视点基向量x,y,z 中的x,y,z的分量写入行主序矩阵的每一行
      - 也就是将原点中的基向量对齐到视点的行主序矩阵M1
      - 再求将视点中的基向量对齐到原点基向量的行主序矩阵M2
        - 因为正交旋转矩阵的逆矩阵就是其转置矩阵
        - 所以M2就是M1的转置矩阵
- 这里就求得了将视点坐标系转换到原点坐标系的矩阵M2 
- 计算视图矩阵。
  - 视图矩阵可以通过将**相机坐标系到世界坐标系的变换矩阵**和**相机的平移矩阵**相乘得到
  - **这个矩阵将场景中的物体从世界坐标系变换到相机坐标系。**
  - 如果要将一个物体从相机坐标系变换到世界坐标系，则可以用其逆矩阵来进行变换

### 代码实现
基于视点、目标点、上方向生成视图矩阵。通过向量的叉乘（叉积）来计算
```
// e视点  t目标点  u上方向
//subVectors(e, t) 向量e减向量t
//normalize() 向量的归一化
//crossVectors(u, d) 向量u 和向量d的叉乘
function getViewMatrix(e, t, u) {
  //基向量c，视线
  //视线c 之所以是视点e减目标点t，是为了取一个正向的基向量。
  const c = new Vector3().subVectors(e, t).normalize()
  //基向量a，视线和上方向的垂线
  const a = new Vector3().crossVectors(u, c).normalize()
  //基向量b，修正上方向
  const b = new Vector3().crossVectors(c, a).normalize()
  //正交旋转矩阵
  const mr = new Matrix4().set(
    ...a, 0,
    ...b, 0,
    -c.x, -c.y, -c.z, 0,
    0, 0, 0, 1
  )
  //位移矩阵
  const mt = new Matrix4().set(
    1, 0, 0, -e.x,
    0, 1, 0, -e.y,
    0, 0, 1, -e.z,
    0, 0, 0, 1
  )
  return mr.multiply(mt).elements
}
```