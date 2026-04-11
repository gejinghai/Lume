#!/bin/bash

# 创建 InitLume.app 目录结构
mkdir -p InitLume.app/Contents/MacOS
mkdir -p InitLume.app/Contents/Resources

# 创建可执行脚本
cat > InitLume.app/Contents/MacOS/InitLume << 'EOF'
#!/bin/bash

APP_PATH="/Applications/Lume.app"

if [ ! -d "$APP_PATH" ]; then
  osascript -e 'display dialog "请先将 Lume.app 拖入应用程序文件夹（/Applications）后再运行本工具。" buttons {"好"} default button 1 with icon stop'
  exit 1
fi

osascript -e 'display dialog "正在为 Lume.app 进行首次启动准备..." buttons {"好"} default button 1' || true

if xattr -l "$APP_PATH" 2>/dev/null | grep -q "com.apple.quarantine"; then
    xattr -d -r com.apple.quarantine "$APP_PATH" 2>/dev/null
    osascript -e 'display dialog "准备完成！已成功移除安全限制。您现在可以在应用程序中正常打开 Lume。" buttons {"好"} default button 1 with icon note' || true
else
    osascript -e 'display dialog "Lume 已经准备就绪！您现在可以在应用程序中正常打开 Lume。" buttons {"好"} default button 1 with icon note' || true
fi
EOF

# 设置执行权限
chmod +x InitLume.app/Contents/MacOS/InitLume

# 创建 Info.plist
cat > InitLume.app/Contents/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleExecutable</key>
    <string>InitLume</string>
    <key>CFBundleIdentifier</key>
    <string>com.lume.init</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>首次启动助手</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# 创建 Resources 目录下的文件（可选）
echo "创建完成！"