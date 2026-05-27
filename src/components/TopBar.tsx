import React, { useEffect, useRef, useState } from 'react';
import { Languages, Settings, PanelLeft, CloudRain, Snowflake, Star, Waves, X, Plus, Circle, Info } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useI18n } from '../lib/i18n';

/**
 * TopBarProps 顶部标签栏组件接口
 */
interface TopBarProps {
  isUIVisible: boolean;                        // UI是否可见
  toggleSidebar: () => void;                  // 切换侧边栏
  toggleSettings?: () => void;               // 切换设置面板
  toggleAbout?: () => void;                  // 切换关于面板
  scene: 'rain' | 'snow' | 'stars' | 'aurora';  // 当前场景类型
  setScene: (scene: 'rain' | 'snow' | 'stars' | 'aurora') => void;  // 场景切换回调
  tabs: {                                  // 标签页列表
    id: string;
    title: string;
    subtitle: string;
    content: string;
    isSaved?: boolean
  }[];
  activeTabId: string | null;               // 当前活动标签 ID
  onReorderTabs: (newTabs: { id: string; title: string; subtitle: string; content: string; isSaved?: boolean }[]) => void;  // 标签排序回调
  onSelectTab: (id: string) => void;        // 选择标签回调
  onCloseTab: (id: string) => void;        // 关闭标签回调
  onAddTab: () => void;                   // 新建标签回调
  lang: 'en' | 'zh';                      // 当前语言
  toggleLang: () => void;                 // 切换语言
}

/**
 * TopBar 顶部标签栏组件
 * 显示文档标签页，支持拖拽排序、场景切换、字体设置
 * 使用 Framer Motion 实现标签拖拽动画
 */
export default function TopBar({
  isUIVisible, toggleSidebar, toggleSettings, toggleAbout, scene, setScene,
  tabs, activeTabId, onReorderTabs, onSelectTab, onCloseTab, onAddTab,
  lang, toggleLang
}: TopBarProps) {
  const { t } = useI18n();
  // 标签滚动区域引用
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  // 上一个标签数量引用（用于检测新标签）
  const prevTabCountRef = useRef(tabs.length);
  useEffect(() => {
    if (tabs.length > prevTabCountRef.current && tabsScrollRef.current) {
      tabsScrollRef.current.scrollTo({
        left: tabsScrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
    prevTabCountRef.current = tabs.length;
  }, [tabs.length]);

  const cycleScene = () => {
    const scenes: ('rain' | 'snow' | 'stars' | 'aurora')[] = ['rain', 'snow', 'stars', 'aurora'];
    const currentIndex = scenes.indexOf(scene);
    setScene(scenes[(currentIndex + 1) % scenes.length]);
  };

  const SceneIcon = {
    rain: CloudRain,
    snow: Snowflake,
    stars: Star,
    aurora: Waves
  }[scene];

  return (
    <AnimatePresence>
      {isUIVisible && (
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-0 w-full h-12 bg-surface-highest/40 backdrop-blur-2xl flex justify-between items-center px-4 z-50 border-b border-outline-variant/10"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center w-1/4 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          </div>

          <div className="flex-1 flex items-center overflow-hidden px-4 justify-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="flex items-center max-w-full">
              <div ref={tabsScrollRef} className="overflow-x-auto custom-scrollbar-hidden">
              <Reorder.Group 
                axis="x" 
                values={tabs} 
                onReorder={onReorderTabs} 
                className="flex items-center space-x-1"
              >
                <AnimatePresence initial={false}>
                  {tabs.map(tab => (
                    <Reorder.Item 
                      key={tab.id} 
                      value={tab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, width: 0, padding: 0, margin: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`group relative flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-all flex-shrink-0 ${
                        activeTabId === tab.id 
                          ? 'bg-white/10 text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                      }`}
                      onPointerDown={() => onSelectTab(tab.id)}
                    >
                      <Circle className={`w-2 h-2 mr-2 flex-shrink-0 ${tab.isSaved ? 'fill-transparent text-transparent' : 'fill-secondary text-secondary'}`} />
                      <span className="text-xs font-medium whitespace-nowrap select-none max-w-[120px] truncate">
                        {tab.title || 'Untitled'}
                      </span>
                      <button 
                        className={`ml-2 rounded-full p-0.5 transition-all ${
                          activeTabId === tab.id 
                            ? 'opacity-50 hover:opacity-100 hover:bg-white/10' 
                            : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
                        }`}
                        onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
              </div>
              <button 
                onClick={onAddTab}
                className="ml-2 p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 w-1/4 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex items-center space-x-1"
              title={t('topbar.toggleSidebar')}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={cycleScene}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex items-center space-x-1"
              title={t('topbar.changeScene')}
            >
              <SceneIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLang}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex items-center space-x-1"
              title={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
            >
              <Languages className="w-4 h-4" />
              <span className="text-[10px] font-medium tracking-wider opacity-70">{lang === 'en' ? 'EN' : '中'}</span>
            </button>
            <button
              onClick={toggleAbout}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors"
              title={t('topbar.about')}
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSettings}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors"
              title={t('topbar.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}