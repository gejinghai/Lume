export interface CustomResourceConfig {
  sounds: Record<string, string>;
  images: Record<string, string>;
  music: Record<string, string>;
}

export interface ElectronAPI {
  saveDocumentsOrder: (order: string[]) => Promise<boolean>;
  getUserDataPath: () => Promise<string>;
  saveDocument: (doc: { id: string; title: string; subtitle: string; content: string }) => Promise<string>;
  loadDocuments: () => Promise<Array<{ id: string; title: string; subtitle: string; content: string; updatedAt?: string }>>;
  deleteDocument: (id: string) => Promise<boolean>;
  showSaveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  exportDocument: (data: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;
  getWindowState: () => Promise<{ isMaximized: boolean; isFullScreen: boolean }>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (data: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;

  // 自定义资源管理
  pickAudioFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  pickImageFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  importResource: (data: { type: string; name: string; sourcePath: string }) => Promise<{ success: boolean; fileName?: string; error?: string }>;
  getCustomConfig: () => Promise<CustomResourceConfig>;
  deleteCustomResource: (data: { type: string; name: string }) => Promise<{ success: boolean; error?: string }>;
  getCustomFolderPath: () => Promise<string>;
  openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  
  onNewDocument: (callback: () => void) => void;
  onNewWindow: (callback: () => void) => void;
  onSaveDocument: (callback: () => void) => void;
  onCloseTab: (callback: () => void) => void;
  onToggleSidebar: (callback: () => void) => void;
  onOpenPreferences: (callback: () => void) => void;
  onChangeScene: (callback: (scene: string) => void) => void;
  
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}