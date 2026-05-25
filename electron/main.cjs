/**
 * Lume Electron 主进程入口
 * 负责窗口管理、菜单创建、快捷键注册、文件读写等核心功能
 */

const { app, BrowserWindow, ipcMain, Menu, shell, dialog, globalShortcut, protocol } = require('electron');
// const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// 主窗口实例
let mainWindow = null;
// 是否开发模式（始终使用本地构建）
const isDev = false;

/**
 * 将文档对象转换为 JSON 格式
 * @param {Object} param0 - 文档对象
 * @returns {string} JSON 字符串
 */
function toJsonDocument({ id, title, subtitle, content, collection, updatedAt }) {
  const doc = {
    id: String(id || ''),
    title: String(title || 'Untitled Document'),
    subtitle: String(subtitle || 'NEW DRAFT'),
    content: String(content || ''),
    updatedAt: updatedAt || new Date().toISOString(),
  };
  if (collection) doc.collection = String(collection);
  return JSON.stringify(doc, null, 2);
}

/**
 * 解析 JSON 文档文件
 * @param {string} raw - JSON 内容
 * @param {string} fallbackId - 备用 ID
 * @returns {Object} 文档对象
 */
function parseJsonDocument(raw, fallbackId) {
  try {
    const doc = JSON.parse(raw);
    return {
      id: doc.id || fallbackId,
      title: doc.title || 'Untitled Document',
      subtitle: doc.subtitle || 'NEW DRAFT',
      content: doc.content || '',
      collection: doc.collection || undefined,
      updatedAt: doc.updatedAt,
    };
  } catch (e) {
    return {
      id: fallbackId,
      title: 'Untitled Document',
      subtitle: 'NEW DRAFT',
      content: raw,
      updatedAt: undefined,
    };
  }
}

/**
 * 解析旧版 Markdown 文档（兼容迁移）
 * @param {string} raw - 原始 Markdown 内容
 * @param {string} fallbackId - 备用 ID
 * @returns {Object} 文档对象
 */
function parseMarkdownDocument(raw, fallbackId) {
  const normalized = String(raw || '');
  // 匹配 YAML frontmatter：--- ... --- ... content
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return {
      id: fallbackId,
      title: 'Untitled Document',
      subtitle: 'NEW DRAFT',
      content: normalized,
      updatedAt: undefined
    };
  }

  const metadataBlock = match[1];
  const content = match[2] || '';
  const metadata = {};

  metadataBlock.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    metadata[key] = value.replace(/\\"/g, '"');
  });

  return {
    id: metadata.id || fallbackId,
    title: metadata.title || 'Untitled Document',
    subtitle: metadata.subtitle || 'NEW DRAFT',
    content,
    updatedAt: metadata.updatedAt
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Lume',
    backgroundColor: '#0e0e0e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
     // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.platform === 'darwin') {
    createMenu();
  } else {
    Menu.setApplicationMenu(null);
  }
}

function createMenu() {
  const template = [
    {
      label: 'Lume',
      submenu: [
        { label: 'About Lume', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: () => mainWindow?.webContents.send('open-preferences') },
        { type: 'separator' },
        { label: 'Hide Lume', role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit Lume', role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Document', accelerator: 'Cmd+N', click: () => mainWindow?.webContents.send('new-document') },
        { label: 'New Window', accelerator: 'Cmd+Shift+N', click: () => mainWindow?.webContents.send('new-window') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'Cmd+S', click: () => mainWindow?.webContents.send('save-document') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'Cmd+W', click: () => mainWindow?.webContents.send('close-tab') }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Cmd+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
        { label: 'Select All', accelerator: 'Cmd+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'Cmd+Shift+S', click: () => mainWindow?.webContents.send('toggle-sidebar') },
        { label: 'Toggle Full Screen', accelerator: 'Cmd+Ctrl+F', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomOut' },
        { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Enter Full Screen', accelerator: 'Cmd+Ctrl+F', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Scene',
      submenu: [
        { label: 'Rain', click: () => mainWindow?.webContents.send('change-scene', 'rain') },
        { label: 'Snow', click: () => mainWindow?.webContents.send('change-scene', 'snow') },
        { label: 'Stars', click: () => mainWindow?.webContents.send('change-scene', 'stars') },
        { label: 'Aurora', click: () => mainWindow?.webContents.send('change-scene', 'aurora') }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Learn More', click: () => shell.openExternal('https://github.com') },
        { label: 'Documentation', click: () => shell.openExternal('https://github.com') },
        // { type: 'separator' },
        // { label: 'Check for Updates...', click: () => {
        //   autoUpdater.checkForUpdates().catch(() => {});
        // }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  // F11 全屏切换（Windows/Linux）
  let lastF11Time = 0;
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      event.preventDefault();
      const now = Date.now();
      if (now - lastF11Time > 400) {
        lastF11Time = now;
        mainWindow?.setFullScreen(!mainWindow?.isFullScreen());
      }
    }
  });

  // ========== 自动更新（已注释）==========
  // autoUpdater.setFeedURL({
  //   provider: 'github',
  //   owner: 'gejinghai',
  //   repo: 'Lume',
  // });
  // autoUpdater.autoDownload = false;
  // autoUpdater.autoInstallOnAppQuit = false;
  // if (process.env.LUME_DEV_UPDATE) {
  //   autoUpdater.forceDevUpdateConfig = true;
  // }

  // const updateCachePath = path.join(app.getPath('userData'), '.update_cache');
  // const stagingDir = path.join(app.getPath('userData'), '__update__');
  // try { fs.rmSync(updateCachePath, { recursive: true, force: true }); } catch {}
  // try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}

  // setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);

  // autoUpdater.on('checking-for-update', () => {
  //   mainWindow?.webContents.send('update-checking');
  // });
  // autoUpdater.on('update-available', (info) => {
  //   mainWindow?.webContents.send('update-available', { version: info.version, releaseDate: info.releaseDate });
  // });
  // autoUpdater.on('update-not-available', () => {
  //   mainWindow?.webContents.send('update-not-available');
  // });
  // autoUpdater.on('error', (err) => {
  //   console.warn('[autoUpdater] error:', err.message);
  //   mainWindow?.webContents.send('update-error', err.message);
  // });
  // autoUpdater.on('download-progress', (progress) => {
  //   mainWindow?.webContents.send('update-download-progress', {
  //     percent: progress.percent,
  //     bytesPerSecond: progress.bytesPerSecond,
  //   });
  // });
  // autoUpdater.on('update-downloaded', (info) => {
  //   mainWindow?.webContents.send('update-downloaded', { version: info.version });
  // });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('save-document', async (event, { id, title, subtitle, content, collection }) => {
  const userDataPath = app.getPath('userData');
  const documentsPath = path.join(userDataPath, 'documents');

  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }

  const docPath = path.join(documentsPath, `${id}.json`);
  const updatedAt = new Date().toISOString();
  const json = toJsonDocument({ id, title, subtitle, content, collection, updatedAt });

  fs.writeFileSync(docPath, json, 'utf-8');
  return docPath;
});

ipcMain.handle('load-documents', async () => {
  const userDataPath = app.getPath('userData');
  const documentsPath = path.join(userDataPath, 'documents');

  if (!fs.existsSync(documentsPath)) {
    return [];
  }

  const files = fs.readdirSync(documentsPath).filter(f =>
    (f.endsWith('.md') || f.endsWith('.json')) && !f.startsWith('_')
  );
  const seenIds = new Set();
  const documents = files.map(file => {
    if (file === '_order.json') return null;

    const fullPath = path.join(documentsPath, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');

    if (file.endsWith('.json')) {
      try {
        const doc = JSON.parse(raw);
        seenIds.add(doc.id);
        return doc;
      } catch (error) {
        const fallbackId = path.basename(file, '.json');
        return { id: fallbackId, title: 'Untitled Document', subtitle: 'NEW DRAFT', content: raw };
      }
    }

    // 旧版 .md 文件 — 迁移到 .json
    const fallbackId = path.basename(file, '.md');
    const doc = parseMarkdownDocument(raw, fallbackId);

    // 如果已存在同 ID 的 .json 文件，跳过 .md（避免重复）
    if (seenIds.has(doc.id)) return null;

    // 自动迁移: 写入 .json 并删除旧 .md
    try {
      const jsonPath = path.join(documentsPath, `${doc.id}.json`);
      if (!fs.existsSync(jsonPath)) {
        fs.writeFileSync(jsonPath, toJsonDocument(doc), 'utf-8');
      }
      fs.unlinkSync(fullPath);
    } catch (e) {
      // 迁移失败不影响文档加载
    }

    seenIds.add(doc.id);
    return doc;
  }).filter(Boolean);

  // 读取保存的文档顺序，按顺序排序
  const orderPath = path.join(documentsPath, '_order.json');
  try {
    if (fs.existsSync(orderPath)) {
      const orderData = JSON.parse(fs.readFileSync(orderPath, 'utf-8'));
      if (Array.isArray(orderData)) {
        const docMap = new Map(documents.map(d => [d.id, d]));
        // 按 order 排序，不在 order 中的文档排在末尾
        const ordered = orderData.map(id => docMap.get(id)).filter(Boolean);
        const unordered = documents.filter(d => !orderData.includes(d.id));
        return [...ordered, ...unordered];
      }
    }
  } catch (e) {
    // 忽略 order 文件读取错误，使用默认顺序
  }

  return documents;
});

ipcMain.handle('save-documents-order', async (event, order) => {
  const userDataPath = app.getPath('userData');
  const documentsPath = path.join(userDataPath, 'documents');

  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(documentsPath, '_order.json'),
    JSON.stringify(order),
    'utf-8'
  );
  return true;
});

ipcMain.handle('save-collections', async (event, collections) => {
  const userDataPath = app.getPath('userData');
  const documentsPath = path.join(userDataPath, 'documents');
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
  }
  fs.writeFileSync(path.join(documentsPath, '_collections.json'), JSON.stringify(collections), 'utf-8');
  return true;
});

ipcMain.handle('load-collections', async () => {
  const userDataPath = app.getPath('userData');
  const collectionsPath = path.join(userDataPath, 'documents', '_collections.json');
  try {
    if (fs.existsSync(collectionsPath)) {
      const data = JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) { /* ignore */ }
  return [];
});

ipcMain.handle('delete-document', async (event, id) => {
  const userDataPath = app.getPath('userData');
  const docPathMd = path.join(userDataPath, 'documents', `${id}.md`);
  const docPathJson = path.join(userDataPath, 'documents', `${id}.json`);
  let deleted = false;
  
  if (fs.existsSync(docPathMd)) {
    fs.unlinkSync(docPathMd);
    deleted = true;
  }
  if (fs.existsSync(docPathJson)) {
    fs.unlinkSync(docPathJson);
    deleted = true;
  }
  return deleted;
});

ipcMain.handle('show-save-dialog', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Document',
    defaultPath: defaultName || 'document.md',
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Plain Text', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'HTML', extensions: ['html'] },
      { name: 'All Files', extensions: ['*'] },
    ]
  });
  return result;
});

ipcMain.handle('show-directory-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Export Directory',
    properties: ['openDirectory', 'createDirectory'],
  });
  return { canceled: result.canceled, directoryPath: result.filePaths?.[0] };
});

ipcMain.handle('export-document', async (event, { filePath, content }) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-window-state', () => {
  return {
    isMaximized: mainWindow?.isMaximized(),
    isFullScreen: mainWindow?.isFullScreen()
  };
});

ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ========== 自定义资源管理 API ==========

const customConfigPath = path.join(app.getPath('userData'), 'custom', 'config.json');

function readCustomConfig() {
  try {
    if (fs.existsSync(customConfigPath)) {
      return JSON.parse(fs.readFileSync(customConfigPath, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { sounds: {}, images: {}, music: {} };
}

function writeCustomConfig(config) {
  const dir = path.dirname(customConfigPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(customConfigPath, JSON.stringify(config, null, 2), 'utf-8');
}

ipcMain.handle('pick-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Sound File',
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] },
    ],
    properties: ['openFile'],
  });
  return result;
});

ipcMain.handle('pick-image-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Image File',
    filters: [
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
    ],
    properties: ['openFile'],
  });
  return result;
});

ipcMain.handle('import-resource', async (event, { type, name, sourcePath }) => {
  try {
    const userDataPath = app.getPath('userData');
    const ext = path.extname(sourcePath);
    const destDir = path.join(userDataPath, 'custom', type);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destFile = path.join(destDir, `${name}${ext}`);
    console.log('[main] import-resource: copying', sourcePath, '→', destFile);
    fs.copyFileSync(sourcePath, destFile);

    // 更新 config
    const config = readCustomConfig();
    if (type === 'sounds') config.sounds[name] = `${name}${ext}`;
    else if (type === 'images') config.images[name] = `${name}${ext}`;
    else if (type === 'music') config.music[name] = `${name}${ext}`;
    writeCustomConfig(config);

    return { success: true, fileName: `${name}${ext}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-custom-config', () => {
  return readCustomConfig();
});

ipcMain.handle('delete-custom-resource', async (event, { type, name }) => {
  try {
    const config = readCustomConfig();
    const fileName = config[type]?.[name];
    if (fileName) {
      const filePath = path.join(app.getPath('userData'), 'custom', type, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      delete config[type][name];
      writeCustomConfig(config);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-custom-folder-path', () => {
  return path.join(app.getPath('userData'), 'custom');
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle('read-custom-asset-dataurl', async (event, { type, name }) => {
  try {
    const config = readCustomConfig();
    const fileName = config[type]?.[name];
    if (!fileName) {
      console.log('[main] read-custom-asset-dataurl: no file in config for', type, name, JSON.stringify(config));
      return null;
    }

    const filePath = path.join(app.getPath('userData'), 'custom', type, fileName);
    console.log('[main] read-custom-asset-dataurl: looking for', filePath, 'exists:', fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) return null;

    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeMap = {
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      m4a: 'audio/mp4', flac: 'audio/flac', aac: 'audio/aac',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    const result = `data:${mime};base64,${data.toString('base64')}`;
    console.log('[main] read-custom-asset-dataurl: success, data URL length:', result.length);
    return result;
  } catch (e) {
    console.log('[main] read-custom-asset-dataurl: error', e);
    return null;
  }
});

// ========== 设置持久化 API ==========

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function readSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

function writeSettings(settings) {
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    writeSettings(settings);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('load-settings', async () => {
  return readSettings();
});

// ========== 自动更新 IPC（已注释）==========
// ipcMain.handle('check-for-updates', async () => {
//   try {
//     const updateCachePath = path.join(app.getPath('userData'), '.update_cache');
//     const stagingDir = path.join(app.getPath('userData'), '__update__');
//     try { fs.rmSync(updateCachePath, { recursive: true, force: true }); } catch {}
//     try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
//     await autoUpdater.checkForUpdates();
//     return { success: true };
//   } catch (err) {
//     return { success: false, error: String(err) };
//   }
// });

// ipcMain.handle('download-update', async () => {
//   try {
//     autoUpdater.downloadUpdate();
//     return { success: true };
//   } catch (err) {
//     return { success: false, error: String(err) };
//   }
// });

// ipcMain.handle('install-update', () => {
//   autoUpdater.quitAndInstall();
//   return { success: true };
// });
