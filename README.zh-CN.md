# Lume

一款为 macOS 设计的极简沉浸式写作应用，基于 Electron 和 React 构建。

## 功能特性

- **沉浸式写作体验**：全屏写作模式，搭配动态背景效果
- **标签式文档管理**：支持多文档标签，可拖拽排序
- **侧边栏文档列表**：快速访问所有文档，支持搜索功能
- **动态背景效果**：可选雨、雪、星星、极光四种背景
- **黑暗模式**：精美的暗色主题，带有玻璃态效果
- **自动保存**：文档自动保存到本地存储

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

一键打包脚本（推荐）：

```bash
cd scripts
./build-dmg.sh
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
│   ├── main.cjs             # 主进程入口
│   └── preload.cjs          # 预加载脚本
├── public/                  # 静态资源
│   ├── images/              # 图片资源
│   └── sounds/              # 音频资源
├── src/                     # React 源码
│   ├── components/          # UI 组件
│   ├── App.tsx             # 主应用组件
│   ├── index.css           # 全局样式
│   └── main.tsx           # React 入口
├── index.html              # HTML 入口
├── package.json            # 项目配置
├── scripts/                 # 打包脚本
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── .gitignore              # Git 忽略配置
```

## 核心文件说明

### Electron

- **main.cjs**: 应用入口，负责创建窗口、处理菜单、注册快捷键、管理文件读写操作
- **preload.cjs**: 预加载脚本，在渲染进程和主进程之间建立安全的通信桥梁

### React 组件

- **Editor.tsx**: 核心编辑器组件，支持标题、副标题和正文编辑
- **WelcomePage.tsx**: 欢迎页，当没有打开文档时显示
- **SideBar.tsx**: 侧边栏，显示所有文档列表，支持搜索和删除
- **TopBar.tsx**: 顶部标签栏，显示当前打开的文档标签
- **SettingsPanel.tsx**: 设置面板，调节背景效果、音量、字体等
- **BottomBar.tsx**: 底部状态栏，显示字数统计

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