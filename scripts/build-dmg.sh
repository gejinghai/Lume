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

# 2.5 对 app 进行 ad-hoc 签名并清除隔离属性
# 避免未签名 app 被 macOS Gatekeeper 标记为"已损坏"
echo "[2.5/4] 修复 macOS 安全属性..."
APP_PATH="$RELEASE_DIR/mac-arm64/Lume.app"
if [ -d "$APP_PATH" ]; then
  # 清除所有扩展属性（包括 quarantine）
  xattr -cr "$APP_PATH" 2>/dev/null || true
  # ad-hoc 签名（使用 - 表示自签名，任何 Mac 都能识别）
  codesign --force --deep -s - "$APP_PATH" 2>/dev/null || true
  echo "  ✓ 已完成 ad-hoc 签名"
fi

# 3. 准备 DMG 内容
echo "[3/4] 准备 DMG 内容..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制 Lume.app
cp -R "$RELEASE_DIR/mac-arm64/Lume.app" "$TEMP_DIR/"

# 复制首次启动修复工具和安装说明
cp "$SCRIPTS_DIR/修复-首次启动.command" "$TEMP_DIR/"
chmod +x "$TEMP_DIR/修复-首次启动.command"
cp "$SCRIPTS_DIR/安装说明.txt" "$TEMP_DIR/"

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
