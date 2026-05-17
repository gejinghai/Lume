import React, { useState, useEffect, useCallback } from 'react';

// 导入背景组件
import RainBackground from './components/RainBackground';
import SnowBackground from './components/SnowBackground';
import StarsBackground from './components/StarsBackground';
import AuroraBackground from './components/AuroraBackground';

// 导入 UI 组件
import TopBar from './components/TopBar';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import BottomBar from './components/BottomBar';
import SettingsPanel from './components/SettingsPanel';
import AmbientMusicPlayer from './components/AmbientMusicPlayer';
import WelcomePage from './components/WelcomePage';
import { loadCustomConfig } from './lib/assetResolver';

/**
 * 场景类型 - 定义可用的背景效果
 * rain: 雨天效果
 * snow: 雪天效果
 * stars: 星空效果
 * aurora: 极光效果
 */
export type SceneType = 'rain' | 'snow' | 'stars' | 'aurora';

/**
 * 文档数据接口 - 定义每个文档的结构
 */
export interface TabData {
  id: string;          // 文档唯一标识符
  title: string;       // 文档标题
  subtitle: string;    // 文档副标题（日期）
  content: string;     // 文档内容
  isSaved?: boolean;   // 是否已保存
}

/**
 * Lume 应用主组件
 * 负责整个应用的状态管理和组件协调
 */
export default function App() {
  // ========== UI 可见性状态 ==========
  const [isUIVisible, setIsUIVisible] = useState(true);           // 控制 UI 元素显示/隐藏
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);       // 侧边栏开关状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);      // 设置面板开关状态

  // ========== 编辑器设置状态 ==========
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');  // 字体系列
  const [editorFontSize, setEditorFontSize] = useState(14);       // 编辑器字体大小

  // ========== 场景与背景状态 ==========
  const [scene, setScene] = useState<SceneType>('rain');           // 当前场景类型
  // 自定义资源版本号，变更时强制重挂载背景组件以加载新资源
  const [customVersion, setCustomVersion] = useState(0);
  
  // 天气效果参数
  const [rainIntensity, setRainIntensity] = useState(0.6);         // 雨滴强度 (0-1)
  const [thunderEnabled, setThunderEnabled] = useState(false);     // 雷声开关
  
  // 星空效果参数
  const [starDensity, setStarDensity] = useState(400);            // 星星密度
  
  // 环境音设置
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(true);       // 白噪音开关
  const [ambientSoundsEnabled, setAmbientSoundsEnabled] = useState(true);  // 环境音开关
  const [volume, setVolume] = useState(0.5);                      // 音量大小 (0-1)
  
  // 极光效果参数
  const [auroraCount, setAuroraCount] = useState(5);               // 极光数量

  // ========== 应用加载状态 ==========
  const [isLoading, setIsLoading] = useState(true);              // 是否正在加载

  // ========== 文档管理状态 ==========
  const [documents, setDocuments] = useState<TabData[]>([]);       // 所有文档列表
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);      // 当前打开的标签页 ID 列表
  const [activeTabId, setActiveTabId] = useState<string | null>(null);  // 当前活动标签页 ID

  // 计算当前打开的标签页
  const openTabs = openTabIds
    .map(id => documents.find(doc => doc.id === id))
    .filter((tab): tab is TabData => Boolean(tab));
  
  // 获取当前活动标签页
  const activeTab = activeTabId ? documents.find(t => t.id === activeTabId) ?? null : null;

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const calculateWordCount = (text: string) => {
    if (!text) return 0;
    const cjkMatches = text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || [];
    const westernText = text.replace(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g, ' ');
    const westernMatches = westernText.trim().split(/\s+/).filter(word => word.length > 0);
    return cjkMatches.length + westernMatches.length;
  };

  const charCount = activeTab ? activeTab.content.replace(/\s+/g, '').length : 0;
  const wordCount = activeTab ? calculateWordCount(activeTab.content) : 0;
  const clampedEditorFontSize = Math.min(32, Math.max(14, editorFontSize));

  const loadDocuments = useCallback(async () => {
    if (!isElectron) {
      setIsLoading(false);
      return;
    }

    try {
      const documents = await window.electronAPI.loadDocuments();
      if (documents && documents.length > 0) {
        const loadedDocuments = documents.map(d => ({ ...d, isSaved: true }));
        setDocuments(loadedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const saveDocument = useCallback(async (tab: TabData) => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI.saveDocument({
        id: tab.id,
        title: tab.title,
        subtitle: tab.subtitle,
        content: tab.content
      });
      setDocuments(prev => prev.map(t => t.id === tab.id ? { ...t, isSaved: true } : t));
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, [isElectron]);

  const openDocument = useCallback((id: string) => {
    setOpenTabIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveTabId(id);
  }, []);

  useEffect(() => {
    loadDocuments();
    loadCustomConfig().then(() => {
      // 自定义资源加载完成后强制重挂载背景组件，使自定义图片/音效生效
      setCustomVersion(v => v + 1);
    });
  }, [loadDocuments]);

  useEffect(() => {
    if (!isElectron) return;

    const handleNewDocument = () => {
      handleAddTab();
    };

    const handleSaveDocument = () => {
      const currentTab = activeTabId ? documents.find(t => t.id === activeTabId) : null;
      if (currentTab) {
        saveDocument(currentTab);
      }
    };

    const handleCloseCurrentTab = () => {
      if (!activeTabId) return;
      handleCloseTab(activeTabId);
    };

    const handleToggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };

    const handleChangeScene = (newScene: string) => {
      setScene(newScene as SceneType);
    };

    window.electronAPI.onNewDocument(handleNewDocument);
    window.electronAPI.onSaveDocument(handleSaveDocument);
    window.electronAPI.onCloseTab(handleCloseCurrentTab);
    window.electronAPI.onToggleSidebar(handleToggleSidebar);
    window.electronAPI.onChangeScene(handleChangeScene);

    return () => {
      window.electronAPI.removeAllListeners('new-document');
      window.electronAPI.removeAllListeners('save-document');
      window.electronAPI.removeAllListeners('close-tab');
      window.electronAPI.removeAllListeners('toggle-sidebar');
      window.electronAPI.removeAllListeners('change-scene');
    };
  }, [isElectron, documents, activeTabId, saveDocument]);

  const handleUpdateTab = (id: string, updates: Partial<TabData>) => {
    setDocuments(prev => prev.map(t => t.id === id ? { ...t, ...updates, isSaved: false } : t));
  };

  const handleReorderDocuments = (reordered: TabData[]) => {
    setDocuments(reordered);
    // 持久化文档顺序，下次启动保持
    if (isElectron) {
      window.electronAPI.saveDocumentsOrder(reordered.map(d => d.id));
    }
  };

  const handleCustomResourceChange = () => {
    // 版本号 +1 强制重挂载背景组件，使新资源立即生效
    setCustomVersion(v => v + 1);
  };

  const handleAddTab = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const defaultSubtitle = `${year}年${month}月${day}日`;

    const newTab: TabData = {
      id: Date.now().toString(),
      title: 'Untitled Document',
      subtitle: defaultSubtitle,
      content: '',
      isSaved: false
    };
    setDocuments(prev => [...prev, newTab]);
    setOpenTabIds(prev => [...prev, newTab.id]);
    setActiveTabId(newTab.id);
    void saveDocument(newTab);
  };

  const handleCloseTab = (id: string) => {
    const newOpenTabIds = openTabIds.filter(tabId => tabId !== id);
    setOpenTabIds(newOpenTabIds);

    if (activeTabId === id) {
      setActiveTabId(newOpenTabIds[newOpenTabIds.length - 1] ?? null);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!isElectron) return;

    try {
      await window.electronAPI.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      const newOpenTabIds = openTabIds.filter(tabId => tabId !== id);
      setOpenTabIds(newOpenTabIds);

      if (activeTabId === id) {
        setActiveTabId(newOpenTabIds[newOpenTabIds.length - 1] ?? null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  useEffect(() => {
    if (!isElectron || !activeTab || activeTab.isSaved) return;

    const timeout = setTimeout(() => {
      void saveDocument(activeTab);
    }, 600);

    return () => clearTimeout(timeout);
  }, [isElectron, activeTab, saveDocument]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsUIVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!isSidebarOpen && !isSettingsOpen) {
          setIsUIVisible(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isSidebarOpen, isSettingsOpen]);

  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-surface text-on-surface font-sans flex items-center justify-center">
        <div className="text-on-surface-variant text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-surface text-on-surface font-sans select-none">
      {scene === 'rain' && (
        <div key={customVersion}>
          <RainBackground
            intensity={rainIntensity}
            volume={volume}
            thunderEnabled={thunderEnabled}
            whiteNoiseEnabled={whiteNoiseEnabled}
          />
        </div>
      )}
      {scene === 'snow' && (
        <div key={customVersion}>
          <SnowBackground
            intensity={rainIntensity}
            volume={volume}
            whiteNoiseEnabled={whiteNoiseEnabled}
          />
        </div>
      )}
      {scene === 'stars' && (
        <div key={customVersion}>
          <StarsBackground
            starDensity={starDensity}
            whiteNoiseEnabled={whiteNoiseEnabled}
            volume={volume}
          />
        </div>
      )}
      {scene === 'aurora' && <AuroraBackground auroraCount={auroraCount} />}

      {/* Global Ambient Music Player */}
      <AmbientMusicPlayer 
        volume={volume} 
        enabled={ambientSoundsEnabled} 
      />

      <TopBar 
        isUIVisible={isUIVisible || isSidebarOpen || isSettingsOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        toggleFont={() => setFontFamily(prev => prev === 'sans' ? 'serif' : 'sans')}
        toggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        fontFamily={fontFamily}
        editorFontSize={clampedEditorFontSize}
        onEditorFontSizeChange={(size) => setEditorFontSize(Math.min(32, Math.max(14, size)))}
        scene={scene}
        setScene={setScene}
        tabs={openTabs}
        activeTabId={activeTabId}
        onReorderTabs={(newTabs) => setOpenTabIds(newTabs.map(tab => tab.id))}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onAddTab={handleAddTab}
      />
      
      <SideBar 
        isOpen={isSidebarOpen} 
        tabs={documents}
        activeTabId={activeTabId}
        onSelectTab={openDocument}
        onDeleteTab={handleDeleteDocument}
        onAddTab={handleAddTab}
        onReorderTabs={handleReorderDocuments}
      />

      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rainIntensity={rainIntensity}
        setRainIntensity={setRainIntensity}
        volume={volume}
        setVolume={setVolume}
        thunderEnabled={thunderEnabled}
        setThunderEnabled={setThunderEnabled}
        starDensity={starDensity}
        setStarDensity={setStarDensity}
        whiteNoiseEnabled={whiteNoiseEnabled}
        setWhiteNoiseEnabled={setWhiteNoiseEnabled}
        ambientSoundsEnabled={ambientSoundsEnabled}
        setAmbientSoundsEnabled={setAmbientSoundsEnabled}
        auroraCount={auroraCount}
        setAuroraCount={setAuroraCount}
        scene={scene}
        onCustomResourceChange={handleCustomResourceChange}
      />
      
      {/* Main Workspace */}
      <main 
        className="relative z-10 flex items-center justify-center h-screen w-full p-6 md:p-12 lg:p-24 transition-all duration-500 ease-in-out"
        style={{ paddingLeft: isSidebarOpen ? 'calc(18rem + 3rem)' : '' }}
        onClick={() => {
          if (isSettingsOpen) setIsSettingsOpen(false);
        }}
      >
        <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center">
          {activeTab ? (
            <Editor 
              fontFamily={fontFamily} 
              isUIVisible={isUIVisible || isSidebarOpen || isSettingsOpen} 
              tab={activeTab}
              fontSizePx={clampedEditorFontSize}
              onUpdateTab={handleUpdateTab}
            />
          ) : (
            <WelcomePage 
              onCreateDocument={handleAddTab}
              onOpenDocument={() => setIsSidebarOpen(true)}
              documentCount={documents.length}
            />
          )}
        </div>
      </main>

      <BottomBar 
        isUIVisible={isUIVisible || isSidebarOpen || isSettingsOpen} 
        wordCount={wordCount}
        charCount={charCount}
      />
    </div>
  );
}
