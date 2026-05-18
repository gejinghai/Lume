#!/bin/bash

# Lume 一键打包 DMG 脚本
# InitLume 功能已合并到 Lume 主应用，不再需要独立的 InitLume.app
# 用法: ./build-dmg.sh

set -e

# 从脚本所在目录推导项目根目录
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/release"
TEMP_DIR="/tmp/Lume_DMG"

# 读取版本号
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
DMG_NAME="Lume-${VERSION}-arm64.dmg"

echo "========== 开始打包 DMG =========="
echo "项目目录: $PROJECT_DIR"
echo "版本: $VERSION"

# 1. 构建 Vite
echo "[1/4] 构建 Vite..."
cd "$PROJECT_DIR"
npm run build

# 2. 打包 Electron
echo "[2/4] 打包 Electron 应用..."
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npx electron-builder --publish=never

# 3. 准备 DMG 内容
echo "[3/4] 准备 DMG 内容..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制 Lume.app
cp -R "$RELEASE_DIR/mac-arm64/Lume.app" "$TEMP_DIR/"

# 创建 Applications 快捷方式
ln -s /Applications "$TEMP_DIR/Applications"

# 4. 创建 DMG
echo "[4/4] 创建 DMG 文件..."
rm -f "$RELEASE_DIR/$DMG_NAME"
hdiutil create -srcfolder "$TEMP_DIR" -volname "Lume" -format UDZO -fs APFS "$RELEASE_DIR/$DMG_NAME"

# 验证 DMG
echo "验证 DMG 文件..."
hdiutil verify "$RELEASE_DIR/$DMG_NAME"

echo "========== 打包完成 =========="
echo "DMG 文件: $RELEASE_DIR/$DMG_NAME"
echo "文件大小: $(ls -lh "$RELEASE_DIR/$DMG_NAME" | awk '{print $5}')"
