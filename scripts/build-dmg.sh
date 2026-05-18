#!/bin/bash

# Lume 一键打包 DMG + ZIP 脚本
# 生成 DMG（手动安装用）和 ZIP（自动更新用，含签名）
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
# electron-builder 生成的 ZIP 文件名（自动更新用）
AUTO_ZIP_NAME="Lume-${VERSION}-arm64-mac.zip"

echo "========== 开始打包 =========="
echo "项目目录: $PROJECT_DIR"
echo "版本: $VERSION"

# 1. 构建 Vite
echo "[1/5] 构建 Vite..."
cd "$PROJECT_DIR"
npm run build

# 2. 打包 Electron（生成 .app + DMG + ZIP + latest-mac.yml）
echo "[2/5] 打包 Electron 应用..."
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npx electron-builder --publish=never

# 3. 对 app 进行 ad-hoc 签名并清除隔离属性
echo "[3/5] 修复 macOS 安全属性..."
APP_PATH="$RELEASE_DIR/mac-arm64/Lume.app"
if [ -d "$APP_PATH" ]; then
  xattr -cr "$APP_PATH" 2>/dev/null || true
  # 签名所有必须的二进制（包括 ShipIt）
  codesign --force --deep -s - "$APP_PATH" 2>/dev/null || true
  echo "  ✓ 已完成 ad-hoc 签名"

  # 用已签名的 app 重新打包 ZIP（覆盖 electron-builder 生成的未签名 ZIP）
  echo "  ✓ 重新打包 ZIP（已签名）..."
  rm -f "$RELEASE_DIR/$AUTO_ZIP_NAME"
  cd "$RELEASE_DIR/mac-arm64"
  zip -r -y "$RELEASE_DIR/$AUTO_ZIP_NAME" "Lume.app" -x "*.DS_Store"
  cd "$PROJECT_DIR"

  # 更新 latest-mac.yml 的 sha512 和 size
  echo "  ✓ 更新 latest-mac.yml..."
  ZIP_SIZE=$(stat -f%z "$RELEASE_DIR/$AUTO_ZIP_NAME")
  ZIP_SHA512=$(shasum -a 512 "$RELEASE_DIR/$AUTO_ZIP_NAME" | xxd -r -p | base64)
  # 用 node 解析并改写 yml
  node -e "
const fs = require('fs');
const yml = fs.readFileSync('$RELEASE_DIR/latest-mac.yml', 'utf8');
// 更新 sha512 和 size
const updated = yml
  .replace(/sha512: .+/g, 'sha512: $ZIP_SHA512')
  .replace(/size: \d+/g, 'size: $ZIP_SIZE');
fs.writeFileSync('$RELEASE_DIR/latest-mac.yml', updated);
console.log('  ✓ latest-mac.yml 已更新');
"
fi

# 4. 准备 DMG 内容
echo "[4/5] 准备 DMG 内容..."
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

# 清除 TEMP_DIR 所有文件的隔离属性，确保修复脚本可以直接双击运行
xattr -cr "$TEMP_DIR" 2>/dev/null || true

# 5. 创建 DMG
echo "[5/5] 创建 DMG 文件..."
rm -f "$RELEASE_DIR/$DMG_NAME"
hdiutil create -srcfolder "$TEMP_DIR" -volname "Lume" -format UDZO -fs APFS "$RELEASE_DIR/$DMG_NAME"

# 验证 DMG
echo "验证 DMG 文件..."
hdiutil verify "$RELEASE_DIR/$DMG_NAME"

echo "========== 打包完成 =========="
echo "DMG 文件: $RELEASE_DIR/$DMG_NAME ($(ls -lh "$RELEASE_DIR/$DMG_NAME" | awk '{print $5}'))"
if [ -f "$RELEASE_DIR/$AUTO_ZIP_NAME" ]; then
  echo "ZIP  文件: $RELEASE_DIR/$AUTO_ZIP_NAME ($(ls -lh "$RELEASE_DIR/$AUTO_ZIP_NAME" | awk '{print $5}'))"
fi
echo "更新元数据: $RELEASE_DIR/latest-mac.yml"
