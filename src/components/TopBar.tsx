import React, { useEffect, useRef } from 'react';
import { Settings, PanelLeft, Type, CloudRain, Snowflake, Star, Waves, X, Plus, Circle } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

/**
 * TopBarProps 顶部标签栏组件接口
 */
interface TopBarProps {
  isUIVisible: boolean;                        // UI是否可见
  toggleSidebar: () => void;                  // 切换侧边栏
  toggleFont: () => void;                   // 切换字体
  toggleSettings?: () => void;               // 切换设置面板
  fontFamily: 'sans' | 'serif';            // 当前字体系列
  editorFontSize: number;                     // 编辑器字体大小
  onEditorFontSizeChange: (size: number) => void;  // 字体大小变更回调
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
}

/**
 * TopBar 顶部标签栏组件
 * 显示文档标签页，支持拖拽排序、场景切换、字体设置
 * 使用 Framer Motion 实现标签拖拽动画
 */
export default function TopBar({ 
  isUIVisible, toggleSidebar, toggleFont, toggleSettings, fontFamily, scene, setScene,
  editorFontSize, onEditorFontSizeChange,
  tabs, activeTabId, onReorderTabs, onSelectTab, onCloseTab, onAddTab
}: TopBarProps) {
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
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={cycleScene}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex items-center space-x-1"
              title="Change Scene"
            >
              <SceneIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFont}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors flex items-center space-x-1"
              title={`Switch to ${fontFamily === 'sans' ? 'Serif' : 'Sans-serif'}`}
            >
              <Type className="w-4 h-4" />
              <span className="text-[10px] uppercase font-sans tracking-wider opacity-70">{fontFamily}</span>
            </button>
            <div className="flex items-center rounded-md border border-outline-variant/15 bg-white/5 px-1">
              <Type className="w-3.5 h-3.5 text-on-surface-variant opacity-70 mr-1" />
              <select
                value={editorFontSize}
                onChange={(e) => onEditorFontSizeChange(Number(e.target.value))}
                className="bg-transparent text-[10px] font-sans tracking-wider text-on-surface-variant/90 py-1 pr-1 outline-none"
                title="Editor font size"
              >
                {[14, 16, 18, 20, 22, 24, 28, 32].map((size) => (
                  <option key={size} value={size} className="bg-surface text-on-surface">
                    {size}px
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={toggleSettings}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}