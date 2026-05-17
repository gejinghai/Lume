/**
 * assetResolver — 自定义资源解析器
 *
 * 自定义资源通过 IPC 按需读取为 data URL，
 * 不预加载，避免启动卡顿。
 * 没有自定义资源时返回内建路径。
 */

import { loadBuffer } from './useGaplessAudio';

// 每个场景对应的音效名称列表
const SCENE_SOUNDS: Record<string, string[]> = {
  rain: ['rain', 'thunder'],
  snow: ['wind'],
  stars: ['nightsound', 'cricket'],
  aurora: [],
};

// 自定义资源配置
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

/** 获取当前自定义配置 */
export function getCustomConfig() {
  return _customConfig;
}

/** 重新加载自定义配置 */
export async function reloadCustomConfig(): Promise<void> {
  await loadCustomConfig();
}

/**
 * 解析音效文件 URL（同步，始终返回内建路径）
 * 自定义音效暂不通过此函数加载。
 */
export function resolveSound(name: string): string {
  return `./sounds/${name}.mp3`;
}

/**
 * 解析背景图片 URL（同步，始终返回内建路径）
 * 自定义图片通过 resolveCustomImage 异步加载。
 */
export function resolveImage(name: string): string {
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

/**
 * 异步加载自定义背景图片。
 * 有自定义文件时通过 IPC 读取为 data URL，否则返回 null。
 */
export async function resolveCustomImage(name: string): Promise<string | null> {
  if (!_customConfig?.images?.[name]) return null;
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      return await window.electronAPI.readCustomAssetDataUrl({ type: 'images', name });
    } catch (err) {
      console.error('[assetResolver] Failed to read custom image:', err);
    }
  }
  return null;
}

/**
 * 在初始化阶段预解码指定场景的音效文件。
 * 避免组件挂载后同步的 RMS 扫描阻塞主线程，导致 WebGL 背景初始化延迟。
 */
export async function preloadSceneAudio(scene: string): Promise<void> {
  const soundNames = SCENE_SOUNDS[scene] || [];
  if (soundNames.length === 0) return;
  await Promise.all(soundNames.map(name => loadBuffer(resolveSound(name)).catch(() => null)));
}
