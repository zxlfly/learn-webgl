# webgl
webgl 是在网页上绘制和渲染三维图形的技术，可以让用户与其进行交互。
## 基础用法
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