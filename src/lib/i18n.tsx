import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'en' | 'zh';

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>(null!);

// 按 language 分类的翻译表
const translations: Record<Lang, Record<string, string>> = {
  en: {
    /* App - Loading */
    'app.loading': 'Loading...',

    /* TopBar - tooltips */
    'topbar.toggleSidebar': 'Toggle Sidebar',
    'topbar.changeScene': 'Change Scene',
    'topbar.switchFont': 'Switch to Serif',
    'topbar.switchFont.serif': 'Switch to Sans-serif',
    'topbar.sans': 'sans',
    'topbar.serif': 'serif',
    'topbar.settings': 'Settings',

    /* Scene names */
    'scene.rain': 'Rain',
    'scene.snow': 'Snow',
    'scene.stars': 'Stars',
    'scene.aurora': 'Aurora',

    /* Welcome Page */
    'welcome.title': 'Welcome to Lume',
    'welcome.youHave': 'You have',
    'welcome.document': 'document',
    'welcome.documents': 'documents',
    'welcome.createNew': 'Create New Document',
    'welcome.openExisting': 'Open Existing Document',
    'welcome.shortcut': 'Press {newDoc} to create new document \u00B7 {toggleSidebar} to open sidebar',

    /* Settings Panel */
    'settings.title': 'Environment Settings',
    'settings.rainIntensity': 'Rain Intensity',
    'settings.snowIntensity': 'Snow Intensity',
    'settings.volume': 'Background Volume',
    'settings.enableThunder': 'Enable Thunder',
    'settings.starDensity': 'Star Density',
    'settings.auroraDensity': 'Aurora Density',
    'settings.auroraCount': 'Aurora Count',
    'settings.whiteNoise': 'White Noise (Rain/Wind)',
    'settings.nightSounds': 'Night Sounds (Frogs/Crickets)',
    'settings.ambientSounds': 'Ambient Sounds (Music)',
    'settings.customResources': 'Custom Resources',
    'settings.replace': 'Replace',
    'settings.default': 'Default',
    'settings.restoreDefault': 'Restore default',
    'settings.openFolder': 'Open Folder',
    'settings.restoreAll': 'Restore All',
    'settings.noResources': 'No replaceable resources for this scene',

    /* Resource labels */
    'res.rainSound': 'Rain Sound',
    'res.thunder': 'Thunder',
    'res.backgroundImage': 'Background Image',
    'res.windSound': 'Wind Sound',
    'res.nightSound': 'Night Sound',
    'res.cricket': 'Cricket',

    /* Sidebar */
    'sidebar.title': 'Documents',
    'sidebar.subtitle': 'Your Creative Vault',
    'sidebar.searchPlaceholder': 'Search documents...',
    'sidebar.noDocuments': 'No documents found.',
    'sidebar.untitled': 'Untitled Document',
    'sidebar.noSubtitle': 'NO SUBTITLE',
    'sidebar.deleteDocument': 'Delete Document',
    'sidebar.deleteConfirm': 'Delete document?',
    'sidebar.deleteWarning': 'This will delete "{title}" locally. This action cannot be undone.',
    'sidebar.cancel': 'Cancel',
    'sidebar.delete': 'Delete',
    'sidebar.uncategorized': 'Uncategorized',
    'sidebar.newCollection': 'New Collection',
    'sidebar.collectionNamePlaceholder': 'Collection name',
    'sidebar.collectionEmpty': 'Empty',
    'sidebar.exportDocument': 'Export Document',
    'sidebar.exportCollection': 'Export Collection',
    'sidebar.exportAll': 'Export All',

    /* Editor */
    'editor.noDocument': 'No document open',
    'editor.selectDocument': 'Select a document from the sidebar or create a new one.',
    'editor.titlePlaceholder': 'Untitled Document',
    'editor.subtitlePlaceholder': 'Subtitle',
    'editor.startWriting': 'Start writing...',

    /* Bottom Bar */
    'bottomBar.words': 'Words',
    'bottomBar.chars': 'Chars',
    'bottomBar.system': 'System',
  },

  zh: {
    /* App - Loading */
    'app.loading': '加载中...',

    /* TopBar - tooltips */
    'topbar.toggleSidebar': '切换侧边栏',
    'topbar.changeScene': '切换场景',
    'topbar.switchFont': '切换为衬线体',
    'topbar.switchFont.serif': '切换为无衬线体',
    'topbar.sans': '无衬线',
    'topbar.serif': '衬线',
    'topbar.settings': '设置',

    /* Scene names */
    'scene.rain': '雨',
    'scene.snow': '雪',
    'scene.stars': '星',
    'scene.aurora': '极光',

    /* Welcome Page */
    'welcome.title': '欢迎使用 Lume',
    'welcome.youHave': '你有',
    'welcome.document': '篇文档',
    'welcome.documents': '篇文档',
    'welcome.createNew': '新建文档',
    'welcome.openExisting': '打开已有文档',
    'welcome.shortcut': '按 {newDoc} 新建文档 \u00B7 {toggleSidebar} 打开侧边栏',

    /* Settings Panel */
    'settings.title': '环境设置',
    'settings.rainIntensity': '雨滴强度',
    'settings.snowIntensity': '雪花强度',
    'settings.volume': '背景音量',
    'settings.enableThunder': '启用雷声',
    'settings.starDensity': '星星密度',
    'settings.auroraDensity': '极光密度',
    'settings.auroraCount': '极光数量',
    'settings.whiteNoise': '白噪音（雨/风）',
    'settings.nightSounds': '夜晚音效（蛙/蟋蟀）',
    'settings.ambientSounds': '环境音乐',
    'settings.customResources': '自定义资源',
    'settings.replace': '替换',
    'settings.default': '默认',
    'settings.restoreDefault': '恢复默认',
    'settings.openFolder': '打开文件夹',
    'settings.restoreAll': '全部恢复',
    'settings.noResources': '当前场景没有可替换的资源',

    /* Resource labels */
    'res.rainSound': '雨声',
    'res.thunder': '雷声',
    'res.backgroundImage': '背景图片',
    'res.windSound': '风声',
    'res.nightSound': '夜晚音效',
    'res.cricket': '蟋蟀声',

    /* Sidebar */
    'sidebar.title': '文档',
    'sidebar.subtitle': '你的创作空间',
    'sidebar.searchPlaceholder': '搜索文档...',
    'sidebar.noDocuments': '未找到文档',
    'sidebar.untitled': '未命名文档',
    'sidebar.noSubtitle': '无副标题',
    'sidebar.deleteDocument': '删除文档',
    'sidebar.deleteConfirm': '删除文档？',
    'sidebar.deleteWarning': '将本地删除"{title}"。此操作无法撤销。',
    'sidebar.cancel': '取消',
    'sidebar.delete': '删除',
    'sidebar.uncategorized': '未分类',
    'sidebar.newCollection': '新建合集',
    'sidebar.collectionNamePlaceholder': '合集名称',
    'sidebar.collectionEmpty': '空',
    'sidebar.exportDocument': '导出文档',
    'sidebar.exportCollection': '导出合集',
    'sidebar.exportAll': '导出全部',

    /* Editor */
    'editor.noDocument': '未打开文档',
    'editor.selectDocument': '从侧边栏选择一个文档或新建一个。',
    'editor.titlePlaceholder': '未命名文档',
    'editor.subtitlePlaceholder': '副标题',
    'editor.startWriting': '开始写作...',

    /* Bottom Bar */
    'bottomBar.words': '字数',
    'bottomBar.chars': '字符',
    'bottomBar.system': '系统',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const t = useCallback((key: string): string => {
    return translations[lang]?.[key] ?? translations.en?.[key] ?? key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
