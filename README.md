# Lume

[English](README.en.md) | [中文](README.md)

一款为 macOS和 windows 设计的极简沉浸式写作应用，基于 Electron 和 React 构建。

## 功能特性

- **沉浸式写作体验**：全屏写作模式，搭配动态背景效果
- **标签式文档管理**：支持多文档标签，可拖拽排序
- **侧边栏文档列表**：快速访问所有文档，支持搜索功能
- **动态背景效果**：可选雨、雪、星星、极光四种背景
- **自动保存**：文档自动保存到本地存储
- **背景更换**：支持用户自定义背景图片和音效


## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

1. 克隆仓库：

```bash
git clone https://github.com/gejinghai/Lume.git
```

2. 安装依赖：

```bash
cd Lume
npm install
```

3. 构建应用：

```bash
npm run build
```

### 运行

启动 Electron 应用：

```bash
npm run electron:start
```

### 打包

构建 macOS 应用：

```bash
npm run electron:build
```

使用国内镜像打包（适用于中国大陆网络环境）：

```bash
npm run electron:build:cn
```

Mac 一键打包脚本（推荐）：

```bash
cd scripts
./build-dmg.sh
```

Win 一键打包脚本（推荐）：

```bash
cd scripts
./build-win.sh
```


打包完成后，DMG 文件中会包含：
- **Lume.app** - 主应用程序
- **InitLume.app** - 首次启动助手，用于移除安全限制
- **安装说明.txt** - 安装步骤说明
- **Applications** - 快捷方式，指向系统应用程序文件夹

**安装步骤：**

1. 打开 DMG 文件
2. 将 Lume.app 拖入「应用程序」文件夹
3. 双击运行 **首次启动助手 (InitLume.app)** 移除安全限制
4. 然后即可正常打开 Lume

### 开发模式

热重载开发：

```bash
npm run dev
```

注意：这会启动 Vite 开发服务器。完整的 Electron 开发需要先构建，然后使用 `npm run electron:start` 运行。

## 项目结构

```
Lume/
├── electron/                 # Electron 主进程
│   ├── main.cjs             # 主进程入口，负责窗口管理、菜单、快捷键、文件读写
│   └── preload.cjs          # 预加载脚本，暴露安全的 API 给渲染进程
├── public/                  # 静态资源
│   ├── images/              # 图片资源
│   │   ├── logo.png         # 应用图标
│   │   ├── music.jpg        # 音乐封面图
│   │   ├── rain.jpg         # 雨天背景图
│   │   └── winter.jpg       # 冬季背景图
│   ├── music/              # 本地音乐资源
│   │   ├── piano1.mp3       # 背景钢琴曲1
│   │   ├── piano2.mp3       # 背景钢琴曲2
│   │   ├── piano3.mp3       # 背景钢琴曲3
│   │   ├── piano4.mp3       # 背景钢琴曲4
│   │   ├── piano5.mp3       # 背景钢琴曲5
│   │   └── playlist.json     # 播放列表配置
│   └── sounds/              # 音频资源
│       ├── cricket.mp3      # 蟋蟀声
│       ├── nightsound.mp3   # 夜晚环境音
│       ├── rain.mp3         # 雨声
│       ├── thunder.mp3      # 雷声
│       └── wind.mp3         # 风声
├── src/                     # React 源码
│   ├── components/          # UI 组件
│   │   ├── AmbientMusicPlayer.tsx  # 环境音乐播放器，管理背景音乐播放
│   │   ├── AuroraBackground.tsx    # 极光背景动画组件
│   │   ├── BottomBar.tsx           # 底部状态栏，显示字数统计
│   │   ├── Editor.tsx              # 文本编辑器，核心写作区域
│   │   ├── RainBackground.tsx       # 雨滴背景动画组件
│   │   ├── SettingsPanel.tsx       # 设置面板，配置背景、字体、音效等
│   │   ├── SideBar.tsx             # 侧边栏，文档列表管理
│   │   ├── SnowBackground.tsx      # 雪花背景动画组件
│   │   ├── StarsBackground.tsx     # 星星背景动画组件
│   │   ├── TopBar.tsx              # 顶部标签栏，管理文档标签
│   │   └── WelcomePage.tsx         # 欢迎页，新用户引导
│   ├── App.tsx               # 主应用组件，状态管理和组件协调
│   ├── config.json           # 配置文件，应用自定义设置
│   ├── electron.d.ts         # Electron API 类型定义
│   ├── index.css             # 全局样式，包含 Tailwind 和主题变量
│   └── main.tsx             # React 应用入口
├── index.html                # HTML 入口文件
├── metadata.json             # Electron 应用元数据
├── package.json              # 项目配置和依赖
├── scripts/                  # 打包脚本
│   ├── build-dmg.sh        # 一键打包脚本
│   └── create-init-app.sh   # 创建首次启动助手脚本
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts            # Vite 构建配置
└── .gitignore              # Git 忽略配置
```

## 核心文件说明

### Electron 主进程 (electron/)

- **main.cjs**: 应用入口，负责创建窗口、处理菜单、注册快捷键、管理文件读写操作
- **preload.cjs**: 预加载脚本，在渲染进程和主进程之间建立安全的通信桥梁

### React 组件 (src/components/)

- **Editor.tsx**: 核心编辑器组件，支持标题、副标题和正文编辑
- **WelcomePage.tsx**: 欢迎页，当没有打开文档时显示
- **SideBar.tsx**: 侧边栏，显示所有文档列表，支持搜索和删除
- **TopBar.tsx**: 顶部标签栏，显示当前打开的文档标签
- **SettingsPanel.tsx**: 设置面板，调节背景效果、音量、字体等
- **BottomBar.tsx**: 底部状态栏，显示字数和字符数统计
- **AmbientMusicPlayer.tsx**: 环境音乐播放器，播放背景音乐
- **Background 组件**: Rain、Snow、Stars、Aurora 四种动态背景效果

### 配置文件

- **package.json**: 项目依赖和脚本命令，包含以下常用命令：
  - `npm run dev` - 启动开发服务器
  - `npm run build` - 构建生产版本
  - `npm run electron:start` - 运行 Electron 应用
  - `npm run electron:build` - 打包 macOS 应用
- **config.json**: 应用配置文件，可自定义音乐 CDN 地址
- **vite.config.ts**: Vite 构建配置，包含 base 路径和插件配置
- **tsconfig.json**: TypeScript 编译选项

## 配置文件

配置文件位于 `src/config.json`，用于自定义应用设置：

```json
{
  "app": {
    "name": "Lume",
    "version": "1.0.0"
  },
  "music": {
    "baseUrl": ""
  }
}
```

**配置说明：**

- `app.name`: 应用名称
- `app.version`: 应用版本号
- `music.baseUrl`: 音乐 CDN 地址（可选）
  - **留空或删除**: 使用本地音乐（`public/music` 目录）
  - **填写 CDN 地址**: 使用远程音乐（需要包含 `playlist.json` 和音乐文件）

### 音乐配置示例

本地音乐（默认）：
```json
"music": {
  "baseUrl": ""
}
```

远程 CDN 音乐：
```json
"music": {
  "baseUrl": "https://your-cdn.com/music"
}
```

本地音乐文件需放置在 `public/music/` 目录，包含：
- `playlist.json` - 播放列表
- `piano1.mp3`, `piano2.mp3` 等音乐文件

## 快捷键

- `Cmd+N` - 新建文档
- `Cmd+S` - 保存文档
- `Cmd+W` - 关闭标签
- `Cmd+Shift+S` - 切换侧边栏

## 技术栈

- Electron 33
- React 19
- Vite 6
- Tailwind CSS 4
- Framer Motion
- TypeScript

## 许可证

MIT