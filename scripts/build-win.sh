#!/bin/bash

# Lume Windows 打包脚本
# 用法: ./build-win.sh

set -e

PROJECT_DIR="/Users/gejinghai/Lume/Lume"
RELEASE_DIR="$PROJECT_DIR/release"
# 从 package.json 读取版本号
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
WIN_NAME="Lume-${VERSION}-win"
ZIP_NAME="Lume-${VERSION}-win.zip"

echo "========== 开始打包 Windows 版本 =========="

# 1. 构建 Vite
echo "[1/4] 构建 Vite..."
cd "$PROJECT_DIR"
npm run build

# 2. 打包 Electron (Windows)
echo "[2/4] 打包 Electron 应用..."
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npx electron-builder --win

# 3. 清理旧文件
echo "[3/4] 清理旧文件..."
rm -f "$RELEASE_DIR/$ZIP_NAME"

# 4. 打包成 ZIP（包含 x64 和 arm64 架构）
echo "[4/4] 打包成 ZIP..."
cd "$RELEASE_DIR"
rm -f "$ZIP_NAME"
# 收集所有 Windows 产物
WIN_FILES=()
for dir in win-*-unpacked; do
  if [ -d "$dir" ]; then
    WIN_FILES+=("$dir")
  fi
done
WIN_FILES+=("Lume Setup ${VERSION}.exe" "Lume Setup ${VERSION}.exe.blockmap" "latest.yml")
zip -r "$ZIP_NAME" "${WIN_FILES[@]}"

echo "========== 打包完成 =========="
echo "输出目录: $RELEASE_DIR"
ls -lh "$RELEASE_DIR/Lume Setup ${VERSION}.exe" "$RELEASE_DIR/$ZIP_NAME" 2>/dev/null