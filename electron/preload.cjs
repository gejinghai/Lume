/**
 * Lume Electron 预加载脚本
 * 在渲染进程和主进程之间建立安全的通信桥梁
 * 暴露安全的 API 给前端使用
 */

const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 文件操作 API ==========
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),     // 获取用户数据目录路径
  saveDocument: (doc) => ipcRenderer.invoke('save-document', doc),    // 保存文档
  loadDocuments: () => ipcRenderer.invoke('load-documents'),        // 加载所有文档
  deleteDocument: (id) => ipcRenderer.invoke('delete-document', id), // 删除文档
  
  // ========== 导入导出 API ==========
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),        // 显示保存对话框
  exportDocument: (data) => ipcRenderer.invoke('export-document', data),  // 导出文档
  
  // ========== 窗口操作 API ==========
  getWindowState: () => ipcRenderer.invoke('get-window-state'),        // 获取窗口状态
  minimizeWindow: () => ipcRenderer.send('minimize-window'),         // 最小化窗口
  maximizeWindow: () => ipcRenderer.send('maximize-window'),         // 最大化/还原窗口
  closeWindow: () => ipcRenderer.send('close-window'),              // 关闭窗口
  
  // ========== 文件读写 API ==========
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath), // 读取文件
  writeFile: (data) => ipcRenderer.invoke('write-file', data),       // 写入文件
  
  // ========== 事件监听 API ==========
  // 文档操作事件
  onNewDocument: (callback) => ipcRenderer.on('new-document', callback),    // 新建文档
  onNewWindow: (callback) => ipcRenderer.on('new-window', callback),        // 新建窗口
  onSaveDocument: (callback) => ipcRenderer.on('save-document', callback),  // 保存文档
  onCloseTab: (callback) => ipcRenderer.on('close-tab', callback),          // 关闭标签
  
  // UI 操作事件
  onToggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),  // 切换侧边栏
  onOpenPreferences: (callback) => ipcRenderer.on('open-preferences', callback),  // 打开偏好设置
  onChangeScene: (callback) => ipcRenderer.on('change-scene', (event, scene) => callback(scene)),  // 切换场景
  
  // 移除所有监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});