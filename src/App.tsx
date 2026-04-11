import React, { useState, useEffect, useCallback } from 'react';
import RainBackground from './components/RainBackground';
import SnowBackground from './components/SnowBackground';
import StarsBackground from './components/StarsBackground';
import AuroraBackground from './components/AuroraBackground';
import TopBar from './components/TopBar';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import BottomBar from './components/BottomBar';
import SettingsPanel from './components/SettingsPanel';
import AmbientMusicPlayer from './components/AmbientMusicPlayer';
import WelcomePage from './components/WelcomePage';

export type SceneType = 'rain' | 'snow' | 'stars' | 'aurora';

export interface TabData {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  isSaved?: boolean;
}

export default function App() {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [scene, setScene] = useState<SceneType>('rain');
  
  const [rainIntensity, setRainIntensity] = useState(0.6);
  const [volume, setVolume] = useState(0.5);
  const [thunderEnabled, setThunderEnabled] = useState(false);
  const [starDensity, setStarDensity] = useState(400);
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(true);
  const [ambientSoundsEnabled, setAmbientSoundsEnabled] = useState(true);
  const [auroraCount, setAuroraCount] = useState(5);

  const [isLoading, setIsLoading] = useState(true);

  const [documents, setDocuments] = useState<TabData[]>([]);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTabs = openTabIds
    .map(id => documents.find(doc => doc.id === id))
    .filter((tab): tab is TabData => Boolean(tab));
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
    <div className="relative w-full h-screen overflow-hidden bg-surface text-on-surface font-sans">
      {scene === 'rain' && (
        <RainBackground 
          intensity={rainIntensity} 
          volume={volume} 
          thunderEnabled={thunderEnabled} 
          whiteNoiseEnabled={whiteNoiseEnabled}
        />
      )}
      {scene === 'snow' && (
        <SnowBackground 
          intensity={rainIntensity} 
          volume={volume} 
          whiteNoiseEnabled={whiteNoiseEnabled}
        />
      )}
      {scene === 'stars' && (
        <StarsBackground 
          starDensity={starDensity} 
          whiteNoiseEnabled={whiteNoiseEnabled} 
          volume={volume} 
        />
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
        onReorderTabs={setDocuments}
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
