你需要为当前TDOS项目实现一个独立、可插拔的WebGL流体显影背景。

参考网站：
https://andrewcunliffe.ai/

目标不是复制参考网站的源代码、文字或图片素材，而是高保真复现以下视觉和交互规律：

1. 全屏深色粒子/星空背景。
2. 默认显示主背景图A，整体经过暗化、降低饱和度和半透明处理,并且循环播放。
3. 鼠标移动时，背景粒子和图像产生类似液体的局部排开、旋涡和惯性。
4. 鼠标扰动区域中逐渐显露副背景图B。
5. 副背景不能表现为边缘清晰的圆形遮罩，必须由具有速度、扩散、旋涡和衰减的流体遮罩控制。
6. 鼠标停止后，流体运动逐渐减弱，副背景在2～4秒内平滑消失。
7. 快速移动鼠标时应产生较长的流动尾迹，缓慢移动时产生柔和的局部扰动。
8. 背景上方的菜单、按钮和文字必须保持清晰，不参与WebGL扭曲。
(主背景图A是一个视频，位于："D:\Users\zty\微型项目\haruhi\射手座之日\temp\petal_20241215_012801.mp4",背景图B使用"D:\Users\zty\微型项目\haruhi\射手座之日\temp\B.png")
技术约束：

- 当前项目是Vite原生JavaScript项目。
- 使用three.js和自定义GLSL，不引入Next.js。
- 不使用particles.js模拟核心效果。
- 流体模拟采用GPU Ping-Pong RenderTarget。
- 至少实现velocity、density/mask、advection、splat和composite阶段。
- 鼠标速度必须影响splat方向与强度。
- WebGL画布使用pointer-events:none。
- 支持resize、devicePixelRatio上限、页面隐藏时暂停渲染。
- 支持prefers-reduced-motion。
- 移动端降低模拟分辨率和粒子数量。
- 所有事件监听、RAF、纹理、材质和RenderTarget必须可以彻底销毁。
- 不要修改shared/game-core.js和server/server.js。

首先不要接入现有主菜单。请先建立独立实验页面：

src/experiments/fluid-reveal/
或与当前项目路由结构一致的独立调试路由。

代码结构建议：

src/effects/fluid-reveal/
  FluidRevealBackground.js
  FluidSimulation.js
  PointerTracker.js
  presets.js
  shaders/
    fullscreen.vert
    advection.frag
    splat.frag
    divergence.frag
    pressure.frag
    composite.frag

对外接口：

const effect = createFluidRevealBackground(options);
effect.mount(container);
effect.setTextures(mainTexture, revealTexture);
effect.setEnabled(enabled);
effect.resize();
effect.destroy();

请同时创建调试参数面板，至少包含：

- simulationResolution
- particleCount
- pointerRadius
- splatForce
- velocityDissipation
- densityDissipation
- curlStrength
- distortionStrength
- revealStrength
- backgroundDarkness
- particleOpacity

执行顺序：

第一步：检查当前项目结构、路由、现有星空背景和依赖。
第二步：写一份简短的实现设计和将要新增/修改的文件列表。
第三步：实现独立原型，不立即替换现有背景。
第四步：运行项目，在桌面尺寸1440×900下测试。
第五步：分别测试鼠标静止、缓慢移动、快速划过、画圆和停止后的衰减。
第六步：检查控制台错误、内存释放、resize和移动端降级。
第七步：只有原型验证通过后，汇报接入TDOS菜单所需的最小改动，不要擅自接入。

验收标准：

- 视觉上不存在明显的圆形鼠标遮罩。
- 扰动具有连续性、方向性、惯性和自然衰减。
- 副背景只在流体扰动形成的区域内显露。
- 快速移动产生连续尾迹，不出现间断圆点。
- 1440×900桌面端尽量保持60fps。
- 离开路由后不存在继续运行的requestAnimationFrame和事件监听。
- 关闭WebGL效果后页面仍然可以正常使用。