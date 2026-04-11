import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, CloudRain, Zap, Snowflake, Star, Moon, Sparkles } from 'lucide-react';

/**
 * SettingsPanelProps 设置面板组件接口
 */
interface SettingsPanelProps {
  isOpen: boolean;                           // 面板是否打开
  onClose: () => void;                      // 关闭面板回调
  rainIntensity: number;                      // 雨滴强度 (0-1)
  setRainIntensity: (val: number) => void;  // 设置雨滴强度
  volume: number;                          // 音量大小 (0-1)
  setVolume: (val: number) => void;          // 设置音量
  thunderEnabled: boolean;                    // 雷声开关
  setThunderEnabled: (val: boolean) => void;     // 设置雷声
  starDensity: number;                    // 星星密度
  setStarDensity: (val: number) => void;     // 设置星星密度
  whiteNoiseEnabled: boolean;               // 白噪音开关
  setWhiteNoiseEnabled: (val: boolean) => void;  // 设置白噪音
  ambientSoundsEnabled: boolean;            // 环境音开关
  setAmbientSoundsEnabled: (val: boolean) => void;  // 设置环境音
  auroraCount: number;                  // 极光数量
  setAuroraCount: (val: number) => void;      // 设置极光数量
  scene: string;                      // 当前场景类型
}

/**
 * SettingsPanel 设置面板组件
 * 可调节背景效果、声音、环境参数等
 * 使用 Framer Motion 实现滑入动画
 */
export default function SettingsPanel({
  isOpen,
  onClose,
  rainIntensity,
  setRainIntensity,
  volume,
  setVolume,
  thunderEnabled,
  setThunderEnabled,
  starDensity,
  setStarDensity,
  whiteNoiseEnabled,
  setWhiteNoiseEnabled,
  ambientSoundsEnabled,
  setAmbientSoundsEnabled,
  auroraCount,
  setAuroraCount,
  scene
}: SettingsPanelProps) {
  const isWeatherScene = scene === 'rain' || scene === 'snow';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-16 right-4 w-80 bg-surface-highest/50 backdrop-blur-3xl border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
