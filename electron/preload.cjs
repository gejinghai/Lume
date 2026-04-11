const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  saveDocument: (doc) => ipcRenderer.invoke('save-document', doc),
  loadDocuments: () => ipcRenderer.invoke('load-documents'),
  deleteDocument: (id) => ipcRenderer.invoke('delete-document', id),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  exportDocument: (data) => ipcRenderer.invoke('export-document', data),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (data) => ipcRenderer.invoke('write-file', data),
  
  onNewDocument: (callback) => ipcRenderer.on('new-document', callback),
  onNewWindow: (callback) => ipcRenderer.on('new-window', callback),
  onSaveDocument: (callback) => ipcRenderer.on('save-document', callback),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', callback),
  onToggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
  onOpenPreferences: (callback) => ipcRenderer.on('open-preferences', callback),
  onChangeScene: (callback) => ipcRenderer.on('change-scene', (event, scene) => callback(scene)),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});