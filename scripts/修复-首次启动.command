#!/bin/bash

# Lume 首次启动修复工具
# 双击此文件可移除 macOS 的安全限制
# 需要输入管理员密码

APP_NAME="Lume.app"

# 查找 Lume.app（优先检查 /Applications，再检查同目录）
if [ -d "/Applications/$APP_NAME" ]; then
  APP_PATH="/Applications/$APP_NAME"
elif [ -d "$(dirname "$0")/$APP_NAME" ]; then
  APP_PATH="$(dirname "$0")/$APP_NAME"
else
  osascript -e 'display dialog "未找到 Lume.app。请将 Lume 拖入 /Applications 文件夹后重试。" buttons {"好"} default button 1 with icon stop'
  exit 1
fi

# 以管理员权限移除隔离属性
osascript -e "
  do shell script \"
    xattr -rd com.apple.quarantine '$APP_PATH' 2>/dev/null
  \" with administrator privileges
" 2>/dev/null

if [ $? -eq 0 ]; then
  osascript -e 'display dialog "修复完成！现在可以正常打开 Lume 了 🎉" buttons {"好"} default button 1 with icon note'
  # 自动打开 Lume
  open "$APP_PATH"
else
  osascript -e 'display dialog "修复失败，请尝试手动操作。\n\n打开终端（终端.app）输入：\nsudo xattr -rd com.apple.quarantine /Applications/Lume.app" buttons {"好"} default button 1 with icon stop'
fi
