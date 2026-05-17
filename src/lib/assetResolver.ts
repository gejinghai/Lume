/**
 * assetResolver — 自定义资源解析器
 *
 * 自定义资源通过 IPC 读取为 data URL（避免 CORS 问题），
 * 在应用启动时预加载到缓存中。当没有自定义资源时返回内建路径。
 */

// 自定义资源配置
let _customConfig: {
  sounds: Record<string, string>;
  images: Record<string, string>;
  music: Record<string, string>;
} | null = null;

// data URL 缓存（key: "sounds/rain" → "data:audio/mpeg;base64,..."）
const _dataUrlCache = new Map<string, string>();

/** 从 Electron 主进程加载自定义配置并预加载 data URL */
export async function loadCustomConfig(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const config = await window.electronAPI.getCustomConfig();
      _customConfig = config;
      _dataUrlCache.clear();

      // 预加载所有自定义音效和图片为 data URL
      for (const name of Object.keys(config.sounds || {})) {
        const url = await window.electronAPI.readCustomAssetDataUrl({ type: 'sounds', name }).catch(() => null);
        if (url) _dataUrlCache.set(`sounds/${name}`, url);
      }
      for (const name of Object.keys(config.images || {})) {
        const url = await window.electronAPI.readCustomAssetDataUrl({ type: 'images', name }).catch(() => null);
        if (url) _dataUrlCache.set(`images/${name}`, url);
      }
    } catch {
      _customConfig = { sounds: {}, images: {}, music: {} };
    }
  } else {
    _customConfig = { sounds: {}, images: {}, music: {} };
  }
}

/** 获取当前自定义配置 */
export function getCustomConfig() {
  return _customConfig;
}

/**
 * 重新加载自定义配置并刷新 data URL 缓存
 * 在 SettingsPanel 导入/删除资源后调用
 */
export async function reloadCustomConfig(): Promise<void> {
  await loadCustomConfig();
}

/**
 * 解析音效文件 URL（同步，返回 data URL 或内建路径）
 */
export function resolveSound(name: string): string {
  const cached = _dataUrlCache.get(`sounds/${name}`);
  if (cached) return cached;
  return `./sounds/${name}.mp3`;
}

/**
 * 解析背景图片 URL
 */
export function resolveImage(name: string): string {
  const cached = _dataUrlCache.get(`images/${name}`);
  if (cached) return cached;
  return `./images/${name}.jpg`;
}

/**
 * 解析背景音乐 URL
 */
export function resolveMusic(name: string): string {
  const customFile = _customConfig?.music?.[name.replace(/\.mp3$/, '')];
  if (customFile) {
    return `./music/${customFile}`;
  }
  return `./music/${name}`;
}
