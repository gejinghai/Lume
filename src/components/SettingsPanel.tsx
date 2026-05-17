import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Volume2, CloudRain, Zap, Snowflake, Star, Moon, Sparkles,
  ChevronDown, ChevronRight, Music, Image, FolderOpen, RotateCcw,
} from 'lucide-react';
import { loadCustomConfig, getCustomConfig } from '../lib/assetResolver';

/**
 * SettingsPanelProps 设置面板组件接口
 */
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rainIntensity: number;
  setRainIntensity: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  thunderEnabled: boolean;
  setThunderEnabled: (val: boolean) => void;
  starDensity: number;
  setStarDensity: (val: number) => void;
  whiteNoiseEnabled: boolean;
  setWhiteNoiseEnabled: (val: boolean) => void;
  ambientSoundsEnabled: boolean;
  setAmbientSoundsEnabled: (val: boolean) => void;
  auroraCount: number;
  setAuroraCount: (val: number) => void;
  scene: string;
}

interface ResourceItem {
  type: 'sounds' | 'images' | 'music';
  name: string;
  label: string;
  defaultExt: string;
}

const RESOURCES: ResourceItem[] = [
  { type: 'sounds', name: 'rain',       label: 'Rain (White Noise)', defaultExt: '.mp3' },
  { type: 'sounds', name: 'wind',       label: 'Wind',              defaultExt: '.mp3' },
  { type: 'sounds', name: 'thunder',    label: 'Thunder',           defaultExt: '.mp3' },
  { type: 'sounds', name: 'nightsound', label: 'Night Sound',       defaultExt: '.mp3' },
  { type: 'sounds', name: 'cricket',    label: 'Cricket',           defaultExt: '.mp3' },
  { type: 'images', name: 'rain',       label: 'Rain Background',   defaultExt: '.jpg' },
  { type: 'images', name: 'winter',     label: 'Winter Background', defaultExt: '.jpg' },
];

const ICONS: Record<string, React.ReactNode> = {
  sounds: <Music className="w-3.5 h-3.5" />,
  images: <Image className="w-3.5 h-3.5" />,
};

export default function SettingsPanel({
  isOpen, onClose,
  rainIntensity, setRainIntensity,
  volume, setVolume,
  thunderEnabled, setThunderEnabled,
  starDensity, setStarDensity,
  whiteNoiseEnabled, setWhiteNoiseEnabled,
  ambientSoundsEnabled, setAmbientSoundsEnabled,
  auroraCount, setAuroraCount,
  scene,
}: SettingsPanelProps) {
  const isWeatherScene = scene === 'rain' || scene === 'snow';
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // 自定义资源状态
  const [customOpen, setCustomOpen] = useState(false);
  const [customFiles, setCustomFiles] = useState<Record<string, Record<string, string>>>({});
  const [loadingRes, setLoadingRes] = useState<string | null>(null);

  // 打开面板时加载自定义配置
  useEffect(() => {
    if (isOpen && isElectron) {
      loadCustomConfig().then(() => {
        const config = getCustomConfig();
        setCustomFiles({
          sounds: config?.sounds ?? {},
          images: config?.images ?? {},
          music: config?.music ?? {},
        });
      });
    }
  }, [isOpen, isElectron]);

  const getCustomFileName = (res: ResourceItem): string | null => {
    return customFiles[res.type]?.[res.name] ?? null;
  };

  const handleReplace = async (res: ResourceItem) => {
    if (!isElectron) return;
    setLoadingRes(`${res.type}/${res.name}`);

    try {
      const picker = res.type === 'images'
        ? window.electronAPI.pickImageFile()
        : window.electronAPI.pickAudioFile();

      const result = await picker;
      if (result.canceled || !result.filePaths?.[0]) {
        setLoadingRes(null);
        return;
      }

      const sourcePath = result.filePaths[0];
      const importResult = await window.electronAPI.importResource({
        type: res.type,
        name: res.name,
        sourcePath,
      });

      if (importResult.success) {
        // 刷新配置
        const config = await window.electronAPI.getCustomConfig();
        setCustomFiles({
          sounds: config.sounds ?? {},
          images: config.images ?? {},
          music: config.music ?? {},
        });
      }
    } catch (e) {
      console.error('Failed to import resource:', e);
    }
    setLoadingRes(null);
  };

  const handleReset = async (res: ResourceItem) => {
    if (!isElectron) return;
    setLoadingRes(`${res.type}/${res.name}`);

    try {
      await window.electronAPI.deleteCustomResource({ type: res.type, name: res.name });
      const config = await window.electronAPI.getCustomConfig();
      setCustomFiles({
        sounds: config.sounds ?? {},
        images: config.images ?? {},
        music: config.music ?? {},
      });
    } catch (e) {
      console.error('Failed to reset resource:', e);
    }
    setLoadingRes(null);
  };

  const handleOpenFolder = async () => {
    if (!isElectron) return;
    const folderPath = await window.electronAPI.getCustomFolderPath();
    await window.electronAPI.openFolder(folderPath);
  };

  const handleResetAll = async () => {
    if (!isElectron) return;
    for (const res of RESOURCES) {
      await window.electronAPI.deleteCustomResource({ type: res.type, name: res.name });
    }
    const config = await window.electronAPI.getCustomConfig();
    setCustomFiles({
      sounds: config.sounds ?? {},
      images: config.images ?? {},
      music: config.music ?? {},
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-16 right-4 w-80 bg-surface-highest/50 backdrop-blur-3xl border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-y-auto max-h-[calc(100vh-5rem)]"
        >
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-medium text-on-surface">Environment Settings</h3>
            <button
              onClick={onClose}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Weather Intensity (Rain/Snow) */}
            {isWeatherScene && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center space-x-2">
                    {scene === 'snow' ? <Snowflake className="w-3.5 h-3.5" /> : <CloudRain className="w-3.5 h-3.5" />}
                    <span>{scene === 'snow' ? 'Snow' : 'Rain'} Intensity</span>
                  </div>
                  <span>{Math.round(rainIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={rainIntensity}
                  onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-outline-variant/30 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
              </div>
            )}

            {/* Volume */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Background Volume</span>
                </div>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-outline-variant/30 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              />
            </div>

            {/* Thunder Toggle (Only for Rain) */}
            {scene === 'rain' && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Enable Thunder</span>
                </div>
                <button
                  onClick={() => setThunderEnabled(!thunderEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${thunderEnabled ? 'bg-secondary' : 'bg-outline-variant/30'}`}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full absolute top-1"
                    animate={{ left: thunderEnabled ? '24px' : '4px' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            )}

            {/* Stars Settings */}
            {scene === 'stars' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center space-x-2">
                    <Star className="w-3.5 h-3.5" />
                    <span>Star Density</span>
                  </div>
                  <span>{starDensity}</span>
                </div>
                <input
                  type="range"
                  min="100" max="1000" step="50"
                  value={starDensity}
                  onChange={(e) => setStarDensity(parseInt(e.target.value))}
                  className="w-full h-1 bg-outline-variant/30 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
              </div>
            )}

            {/* Aurora Settings */}
            {scene === 'aurora' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aurora Density</span>
                  </div>
                  <span>{auroraCount}</span>
                </div>
                <input
                  type="range"
                  min="1" max="10" step="1"
                  value={auroraCount}
                  onChange={(e) => setAuroraCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-outline-variant/30 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
              </div>
            )}

            {/* White Noise Toggle (Rain, Snow, Stars) */}
            {(scene === 'rain' || scene === 'snow' || scene === 'stars') && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
                  {scene === 'stars' ? <Moon className="w-3.5 h-3.5" /> : <CloudRain className="w-3.5 h-3.5" />}
                  <span>{scene === 'stars' ? 'Night Sounds (Frogs/Crickets)' : 'White Noise (Rain/Wind)'}</span>
                </div>
                <button
                  onClick={() => setWhiteNoiseEnabled(!whiteNoiseEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${whiteNoiseEnabled ? 'bg-secondary' : 'bg-outline-variant/30'}`}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full absolute top-1"
                    animate={{ left: whiteNoiseEnabled ? '24px' : '4px' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            )}

            {/* Ambient Sounds Toggle (All scenes) */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ambient Sounds (Music)</span>
              </div>
              <button
                onClick={() => setAmbientSoundsEnabled(!ambientSoundsEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${ambientSoundsEnabled ? 'bg-secondary' : 'bg-outline-variant/30'}`}
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full absolute top-1"
                  animate={{ left: ambientSoundsEnabled ? '24px' : '4px' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>

          {/* ──────── Custom Resources ──────── */}
          {isElectron && (
            <div className="border-t border-outline-variant/10">
              <button
                onClick={() => setCustomOpen(!customOpen)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
              >
                <span>Custom Resources</span>
                {customOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {customOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-2">
                      {RESOURCES.map((res) => {
                        const customFile = getCustomFileName(res);
                        const isLoading = loadingRes === `${res.type}/${res.name}`;

                        return (
                          <div key={`${res.type}/${res.name}`} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center space-x-2 text-xs text-on-surface-variant min-w-0 flex-1">
                              <span className="shrink-0">{ICONS[res.type]}</span>
                              <span className="truncate">{res.label}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              {customFile ? (
                                <span className="text-[10px] text-accent truncate max-w-[80px]" title={customFile}>
                                  {customFile}
                                </span>
                              ) : (
                                <span className="text-[10px] text-outline-variant">Default</span>
                              )}
                              <button
                                onClick={() => handleReplace(res)}
                                disabled={isLoading}
                                className="px-2 py-1 text-[10px] rounded-md bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30"
                              >
                                {isLoading ? '...' : 'Replace'}
                              </button>
                              {customFile && (
                                <button
                                  onClick={() => handleReset(res)}
                                  disabled={isLoading}
                                  className="p-1 text-outline-variant hover:text-red-400 transition-colors disabled:opacity-30"
                                  title="Restore default"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center space-x-2 pt-3 border-t border-outline-variant/10">
                        <button
                          onClick={handleOpenFolder}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] rounded-md bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Open Folder</span>
                        </button>
                        <button
                          onClick={handleResetAll}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] rounded-md bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-red-400 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore All</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
