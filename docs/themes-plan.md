# Lume 主题系统设计方案

> 本文档记录 Lume 主题系统的整体架构设计、实现路径与长期规划。
> 编写时间：2026-05-26

---

## 一、背景与动机

Lume 目前提供 4 个固定的场景（雨、雪、星、极光），每个场景包含：
- **WebGL 着色器** — 渲染动态视觉效果
- **氛围音效** — 背景白噪音
- **可调节参数** — 强度、密度等

这 4 个场景是**硬编码在组件内部**的。主题系统的目标是让场景变得可扩展——用户可以下载、安装、切换任意主题，就像 VS Code 的主题商城或 Wallpaper Engine 的壁纸工坊。

---

## 二、一个主题包包含什么

每个主题是一个自包含的 zip 包，目录结构如下：

```
theme-<id>/
├── theme.json          # 元数据
├── shader.glsl         # 片元着色器代码（核心）
├── background.jpg      # 备选背景图（当 WebGL 不支持或禁用时）
├── ambient.mp3         # 氛围音效
├── preview.png         # 商城展示预览图
└── preview.mp4         # [可选] 视频预览
```

### theme.json 元数据

```json
{
  "id": "forest-stream",
  "name": "森林溪流",
  "description": "坐在林间溪石上，听水流潺潺",
  "author": {
    "name": "Someone",
    "email": "someone@example.com"
  },
  "version": "1.0.0",
  "website": "https://example.com/forest-stream",
  "preview": "preview.png",
  "shader": {
    "source": "shader.glsl",
    "uniforms": {
      "iTime": "float",
      "iResolution": "vec3",
      "iMouse": "vec4",
      "iChannel0": "sampler2D"
    },
    "entry": "main() → fragColor"
  },
  "audio": {
    "source": "ambient.mp3",
    "loop": true,
    "volume": 0.5
  },
  "background": {
    "fallback": "background.jpg",
    "type": "image"
  },
  "settings": [
    {
      "key": "waterSpeed",
      "label": "水流速度",
      "type": "range",
      "min": 0,
      "max": 1,
      "step": 0.01,
      "default": 0.5
    },
    {
      "key": "particleCount",
      "label": "粒子数量",
      "type": "range",
      "min": 100,
      "max": 2000,
      "step": 50,
      "default": 500
    }
  ]
}
```

---

## 三、架构设计

### 3.1 总览

```
┌─────────────────────────────────────────────────────────────┐
│                      主题商店（API）                          │
│          https://download.bychato.org/themes.json            │
└──────────────┬──────────────────────────────────────────────┘
               │ fetch
┌──────────────▼──────────────────────────────────────────────┐
│                   ThemeManager（核心模块）                    │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ 下载 & 安装 │  │ 卸载 & 更新 │  │ 本地主题列表 & 缓存   │  │
│  └──────┬─────┘  └──────┬─────┘  └──────────┬───────────┘  │
│         │                │                   │              │
│  ┌──────▼────────────────▼───────────────────▼───────────┐  │
│  │              userData/themes/<theme-id>/                │  │
│  │            (解压后的主题文件 + 元数据)                   │  │
│  └──────┬───────────────────────────────────────────────┘  │
└─────────┼──────────────────────────────────────────────────┘
          │ 加载
┌─────────▼──────────────────────────────────────────────────┐
│                    ThemeRenderer                            │
│                                                             │
│  ┌──────────────────┐  ┌───────────────────┐               │
│  │  Shader 加载 & 编译 │  │  音频（useGaplessAudio）│               │
│  └──────────────────┘  └───────────────────┘               │
│                                                             │
│  ┌──────────────────────────────────────────────────┐       │
│  │  通用 WebGL 渲染器（替代现有 4 个独立组件）         │       │
│  │  从主题包读 shader → 编译 → 渲染（现有管线流程不变）│       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| `ThemeManager` | `src/lib/themeManager.ts` | 下载、安装、卸载、更新、本地列表管理 |
| `ThemeRenderer` | `src/components/ThemeBackground.tsx` | 通用渲染器，替代 RainBackground 等 4 个组件 |
| `ThemeStore` | `src/components/ThemeStorePanel.tsx` | 商城 UI：浏览、搜索、安装 |
| `ThemeEditor` | `(远期)` | 让用户在沙盒中测试自定义 shader |

---

## 四、实现步骤

### 第一阶段：场景数据化（MVP）

**目标**：将 4 个内置场景从硬编码重构为主题包结构，验证动态加载 shader 的可行性。

任务清单：
1. [ ] 将 `RainBackground.tsx`、`SnowBackground.tsx` 等 4 个组件中的 GLSL 代码抽取为独立的 `.glsl` 文件，放到 `src/themes/builtin/` 目录下
2. [ ] 为每个内置场景编写 `theme.json` 元数据
3. [ ] 实现 `ThemeBackground.tsx` 通用渲染器，从 `theme.json` + `.glsl` 动态加载
4. [ ] 加载失败时优雅降级（显示静态背景图）
5. [ ] 内置主题打包时通过 Vite 以 raw string 形式内联

**验证标准**：4 个场景功能不变，但底层改为从主题包读取。

### 第二阶段：导入与安装

**目标**：支持从本地 zip 文件安装主题。

任务清单：
1. [ ] 定义主题包 zip 格式规范（目录结构 + `theme.json`）
2. [ ] 实现 `ThemeManager.installFromZip(zipPath)` — 解压到 `userData/themes/<id>/`
3. [ ] 实现 `ThemeManager.uninstall(themeId)`
4. [ ] 实现 `ThemeManager.getInstalledThemes()`
5. [ ] 实现 `ThemeManager.getTheme(themeId)` — 读取 `theme.json`
6. [ ] IPC 通道：安装、卸载、列举本地主题
7. [ ] UI：设置面板中新增「已安装主题」列表，支持切换和卸载
8. [ ] UI：点击「导入主题」打开文件选择器（zip 文件）

**验证标准**：用户可以从本地选择一个主题 zip → 安装 → 切换生效。

### 第三阶段：主题商城

**目标**：从远程接口获取主题列表，一键下载安装。

任务清单：
1. [ ] 在 CDN 部署 `themes.json`，格式见下文
2. [ ] 实现 `ThemeManager.fetchStoreList()` — fetch 远程列表并缓存
3. [ ] 实现 `ThemeManager.downloadAndInstall(themeId)` — 下载 zip 并自动安装
4. [ ] 实现 `ThemeManager.checkForUpdates()` — 比对本地版本和远程版本
5. [ ] UI：新增「主题商城」面板，展示主题列表（带预览图、作者、版本、评分）
6. [ ] UI：安装按钮 → 下载进度条 → 安装 → 应用
7. [ ] UI：已安装主题显示「更新」按钮（远程版本 > 本地版本时）

**验证标准**：用户打开商城 → 浏览 → 点击安装 → 主题生效。

### 第四阶段：主题创作与分享

**目标**：降低主题创作门槛，构建社区生态。

任务清单：
1. [ ] 提供主题模板/脚手架工具（CLI）
2. [ ] 实现 `ThemeSandbox` — 本地预览自己的 shader 效果
3. [ ] 主题上传通道（通过 GitHub PR 或直接上传到 CDN）
4. [ ] 主题元数据中增加「兼容设备」字段（区分 GPU 性能等级）

---

## 五、主题商城 API 设计

### `themes.json` 远端列表

```json
{
  "updatedAt": "2026-05-26T00:00:00Z",
  "themes": [
    {
      "id": "forest-stream",
      "name": "森林溪流",
      "name_en": "Forest Stream",
      "author": "Someone",
      "version": "1.0.0",
      "preview": "https://cdn.xxx/themes/forest-stream/preview.png",
      "download": "https://cdn.xxx/themes/forest-stream/theme-1.0.0.zip",
      "size": "2.4 MB",
      "description": "坐在林间溪石上，听水流潺潺",
      "description_en": "Sit on a streamside rock, listening to the flowing water",
      "gpuLevel": "low",       // low | medium | high
      "tags": ["nature", "water", "calm"],
      "rating": 4.8
    }
  ]
}
```

### 本地主题索引 `userData/themes/index.json`

```json
{
  "installed": ["forest-stream", "aurora-borealis"],
  "activeTheme": "forest-stream"
}
```

---

## 六、渲染器实现要点

### 6.1 Shader 规范

所有主题的 shader 必须遵循同一套 uniform 约定，以便 `ThemeBackground.tsx` 通用渲染：

```glsl
#version 300 es
precision highp float;

uniform vec3 iResolution;     // 画布分辨率（px）
uniform float iTime;          // 运行时间（秒）
uniform vec4 iMouse;          // 鼠标位置 (x,y) 和参数 (z,w)
uniform sampler2D iChannel0;  // 输入纹理

out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // 主题作者在此实现视觉效果
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
```

即 [Shadertoy](https://www.shadertoy.com/) 兼容的输入规范。这意味着大多数 Shadertoy 作品只需微调即可作为 Lume 主题使用。

### 6.2 安全保护

```typescript
// ThemeBackground.tsx
const RENDER_TIMEOUT_MS = 3000;  // 单帧渲染超时

const render = (time: number) => {
  const timeoutId = setTimeout(() => {
    console.warn(`[Theme] Shader render timeout for "${themeId}"`);
    fallbackToImage();  // 降级到静态背景图
  }, RENDER_TIMEOUT_MS);

  try {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    fallbackToImage();
  }
};
```

### 6.3 内置主题

4 个内置主题打包时通过 Vite 的 `?raw` 后缀将 `.glsl` 文件内联为字符串，确保离线可用：

```typescript
import rainShader from '../themes/builtin/rain/shader.glsl?raw';
import rainMeta from '../themes/builtin/rain/theme.json';
```

---

## 七、与现有架构的兼容

### 7.1 可以复用的现有能力

| 现有模块 | 复用方式 |
|---------|---------|
| `RainBackground.tsx` 的 WebGL 管线 | 提取为通用 `ThemeBackground.tsx` |
| `useGaplessAudio` | 主题包中的音效直接接入 |
| `assetResolver.ts` / `resolveCustomImage` | 主题资源加载可复用 |
| `importResource` IPC | 主题 zip 安装可复用此通道 |
| `settings.ts` | `activeTheme` 作为新设置项加入 |
| `SettingsPanel.tsx` | 主题切换 UI 可集成到设置面板 |

### 7.2 需要修改的地方

| 模块 | 改动 |
|------|------|
| `App.tsx` | `scene` 状态扩展为 `scene`（决定布局类型）+ `theme`（决定视觉效果） |
| 场景组件 x4 | 合并为 `ThemeBackground.tsx`，4 个内置主题作为初始数据 |
| 场景选择器 | 从 4 个固定选项变为「内置主题 + 已安装主题」的动态列表 |
| 设置持久化 | 新增 `activeThemeId` 字段 |

---

## 八、长期展望

| 阶段 | 功能 | 时间参考 |
|------|------|---------|
| v1 | 场景数据化，4 个内置主题重构 | ~1 周 |
| v2 | 本地 zip 导入/安装/切换 | ~1 周 |
| v3 | 主题商城浏览 + 一键下载安装 | ~1 周 |
| v4 | 主题沙盒（本地预览/调试 shader） | ~2 周 |
| v5 | 社区上传、评分、排行榜 | 待定 |

---

## 九、主题开发模板（供创作者参考）

```bash
theme-my-creation/
├── theme.json
├── shader.glsl
├── background.jpg    # fallback
├── ambient.mp3       # 音效
└── preview.png       # 商城预览
```

开发者只需编写一个 GLSL shader 和准备一张预览图，即可打包为 Lume 主题。入门门槛远低于开发一个完整的 Electron 应用。
