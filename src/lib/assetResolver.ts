/**
 * assetResolver — 自定义资源解析器
 *
 * 负责在自定义资源与内建资源之间选择。
 * 当用户通过 CustomizePanel 导入了自定义资源后，
 * 此模块返回 custom-asset:// 协议的 URL，否则返回内建资源路径。
 *
 * custom-asset:// 协议由 Electron 主进程注册，托管 userData/custom/ 目录。
 */

// 自定义资源配置（由 IPC 从 userData/custom/config.json 加载）
let _customConfig: {
  sounds: Record<string, string>;
  images: Record<string, string>;
  music: Record<string, string>;
} | null = null;

/** 从 Electron 主进程加载自定义配置 */
export async function loadCustomConfig(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      _customConfig = await window.electronAPI.getCustomConfig();
    } catch {
      _customConfig = { sounds: {}, images: {}, music: {} };
    }
  } else {
    _customConfig = { sounds: {}, images: {}, music: {} };
  }
}

/** 获取当前自定义配置（同步，可能为空） */
export function getCustomConfig() {
  return _customConfig;
}

/**
 * 解析音效文件 URL
 * @param name 资源名称（如 'rain'、'wind'）
 * @returns 完整 URL（自定义或内建）
 */
export function resolveSound(name: string): string {
  const customFile = _customConfig?.sounds?.[name];
  if (customFile) {
    return `local-asset://sounds/${customFile}`;
  }
  return `./sounds/${name}.mp3`;
}

/**
 * 解析背景图片 URL
 * @param name 资源名称（如 'rain'、'winter'）
 * @returns 完整 URL（自定义或内建）
 */
export function resolveImage(name: string): string {
  const customFile = _customConfig?.images?.[name];
  if (customFile) {
    return `local-asset://images/${customFile}`;
  }
  return `./images/${name}.jpg`;
}

/**
 * 解析背景音乐 URL
 * @param name 曲目文件名（如 'piano1.mp3'）
 * @returns 完整 URL（自定义或内建）
 */
export function resolveMusic(name: string): string {
  const customFile = _customConfig?.music?.[name.replace(/\.mp3$/, '')];
  if (customFile) {
    return `local-asset://music/${customFile}`;
  }
  return `./music/${name}`;
}
