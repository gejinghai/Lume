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