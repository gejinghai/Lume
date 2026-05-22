import type { SceneType } from '../App';

/**
 * AppSettings 应用设置接口
 * 所有用户可配置的设置项
 */
export interface AppSettings {
  fontFamily?: 'sans' | 'serif';
  editorFontSize?: number;
  scene?: SceneType;
  rainIntensity?: number;
  thunderEnabled?: boolean;
  starDensity?: number;
  whiteNoiseEnabled?: boolean;
  ambientSoundsEnabled?: boolean;
  volume?: number;
  auroraCount?: number;
  lang?: 'en' | 'zh';
}

/**
 * 设置默认值
 */
export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'serif',
  editorFontSize: 14,
  scene: 'rain',
  rainIntensity: 0.6,
  thunderEnabled: false,
  starDensity: 400,
  whiteNoiseEnabled: true,
  ambientSoundsEnabled: false,
  volume: 0.5,
  auroraCount: 5,
  lang: 'en',
};

const isElectron = typeof window !== 'undefined' && window.electronAPI;

/**
 * 从持久化存储加载设置
 */
export async function loadSettings(): Promise<AppSettings> {
  if (!isElectron) return {};

  try {
    const saved = await window.electronAPI.loadSettings();
    return saved as AppSettings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return {};
  }
}

/**
 * 保存设置到持久化存储
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isElectron) return;

  try {
    await window.electronAPI.saveSettings(settings as Record<string, unknown>);
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
