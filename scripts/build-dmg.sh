#!/bin/bash

# Lume 一键打包脚本
# 用法: ./build-dmg.sh          # 默认 arm64（Apple 芯片）
#       ./build-dmg.sh x64      # Intel 芯片
#       ./build-dmg.sh arm64    # Apple 芯片

set -e

# 架构参数
ARCH="${1:-arm64}"
if [ "$ARCH" != "arm64" ] && [ "$ARCH" != "x64" ]; then
  echo "用法: $0 [arm64|x64]"
  exit 1
fi

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/release"
TEMP_DIR="/tmp/Lume_DMG_${ARCH}"

VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
DMG_NAME="Lume-${VERSION}-${ARCH}.dmg"

echo "========== 开始打包 =========="
echo "版本: $VERSION"
echo "架构: $ARCH"

# 1. 构建前端
echo "[1/4] 构建前端..."
cd "$PROJECT_DIR"
npm run build

# 2. 生成 .app 包（不生成 DMG）
echo "[2/4] 打包 .app..."
rm -rf "$RELEASE_DIR"
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npx electron-builder --mac --"$ARCH" --dir --publish=never

# 找到生成的 .app
APP_DIR=$(find "$RELEASE_DIR" -maxdepth 2 -name "*.app" -type d | head -1)
if [ -z "$APP_DIR" ]; then
  echo "错误: 未找到 .app 包"
  exit 1
fi
echo "  .app 路径: $APP_DIR"

# 3. 准备 DMG 内容
echo "[3/4] 准备 DMG 内容..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制 Lume.app
cp -R "$APP_DIR" "$TEMP_DIR/"

# 复制首次启动修复工具和安装说明
cp "$SCRIPTS_DIR/修复-首次启动.command" "$TEMP_DIR/"
chmod +x "$TEMP_DIR/修复-首次启动.command"
cp "$SCRIPTS_DIR/安装说明.txt" "$TEMP_DIR/"

# 创建 Applications 快捷方式
ln -s /Applications "$TEMP_DIR/Applications"

# 清除隔离属性
xattr -cr "$TEMP_DIR" 2>/dev/null || true

# 4. 创建 DMG
echo "[4/4] 创建 DMG..."
rm -f "$RELEASE_DIR/$DMG_NAME"
hdiutil create -srcfolder "$TEMP_DIR" -volname "Lume" -format UDZO -fs APFS "$RELEASE_DIR/$DMG_NAME"
hdiutil verify "$RELEASE_DIR/$DMG_NAME"

# 清理临时目录和 electron-builder 中间产物
rm -rf "$TEMP_DIR"
rm -f "$RELEASE_DIR"/*.dmg.blockmap "$RELEASE_DIR"/*.zip "$RELEASE_DIR"/*.zip.blockmap "$RELEASE_DIR"/latest-mac.yml 2>/dev/null || true
rm -rf "$RELEASE_DIR"/mac "$RELEASE_DIR"/mac-arm64 "$RELEASE_DIR"/builder-debug.yml "$RELEASE_DIR"/builder-effective-config.yaml 2>/dev/null || true

echo "========== 打包完成 =========="
echo "DMG 文件: $RELEASE_DIR/$DMG_NAME ($(ls -lh "$RELEASE_DIR/$DMG_NAME" | awk '{print $5}'))"
