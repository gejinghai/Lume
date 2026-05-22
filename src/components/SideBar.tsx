import React, { useState } from 'react';
import { Search, Plus, Trash2, FileText, Circle } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useI18n } from '../lib/i18n';
import { TabData } from '../App';

/**
 * SideBarProps 侧边栏组件接口
 */
interface SideBarProps {
  isOpen: boolean;                    // 侧边栏是否打开
  tabs: TabData[];                    // 所有文档列表
  activeTabId: string | null;          // 当前活动文档 ID
  onSelectTab: (id: string) => void;  // 选择文档回调
  onDeleteTab: (id: string) => void;   // 删除文档回调
  onAddTab: () => void;               // 新建文档回调
  onReorderTabs: (newTabs: TabData[]) => void;  // 重新排序回调
}

/**
 * SideBar 侧边栏组件
 * 显示所有文档列表，支持搜索、删除、拖拽排序
 * 使用 Framer Motion 实现动画效果
 */
export default function SideBar({ 
  isOpen, tabs, activeTabId, onSelectTab, onDeleteTab, onAddTab, onReorderTabs 
}: SideBarProps) {
  const { t } = useI18n();
  // 搜索状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);      // 搜索框是否打开
  const [searchQuery, setSearchQuery] = useState('');        // 搜索关键词
  const [pendingDeleteTab, setPendingDeleteTab] = useState<TabData | null>(null);  // 待删除的文档

  // 是否正在搜索
  const isSearching = searchQuery.trim().length > 0;
  // 过滤后的文档列表
  const filteredTabs = tabs.filter(tab => 
    tab.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tab.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-0 top-0 h-full w-72 bg-surface-highest/30 backdrop-blur-3xl flex flex-col z-40 shadow-2xl border-r border-outline-variant/10 pt-16"
        >
          <div className="px-6 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-on-surface font-medium text-sm tracking-wide">{t('sidebar.title')}</h2>
              <p className="text-on-surface-variant text-xs tracking-wide opacity-70 mt-0.5">{t('sidebar.subtitle')}</p>
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className={`p-1.5 rounded-md transition-colors ${isSearchOpen ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button 
                onClick={onAddTab} 
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isSearchOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="px-6 overflow-hidden"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70" />
                  <input 
                    type="text" 
                    placeholder={t('sidebar.searchPlaceholder')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-outline-variant/20 rounded-lg py-1.5 pl-9 pr-3 text-xs text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-secondary/50 transition-colors"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto custom-scrollbar-hidden px-4 pb-4">
            {isSearching ? (
              <div className="space-y-1">
                {filteredTabs.map(tab => (
                  <div key={tab.id}>
                    <TabItem 
                      tab={tab} 
                      isActive={activeTabId === tab.id} 
                      onSelect={() => onSelectTab(tab.id)} 
                      onDelete={() => setPendingDeleteTab(tab)} 
                    />
                  </div>
                ))}
                {filteredTabs.length === 0 && (
                  <div className="text-center text-on-surface-variant text-xs py-8 opacity-50">
                    {t('sidebar.noDocuments')}
                  </div>
                )}
              </div>
            ) : (
              <Reorder.Group axis="y" values={tabs} onReorder={onReorderTabs} className="space-y-1">
                <AnimatePresence initial={false}>
                  {tabs.map(tab => (
                    <Reorder.Item 
                      key={tab.id} 
                      value={tab} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, height: 0, margin: 0 }} 
                      transition={{ duration: 0.2 }}
                    >
                      <TabItem 
                        tab={tab} 
                        isActive={activeTabId === tab.id} 
                        onSelect={() => onSelectTab(tab.id)} 
                        onDelete={() => setPendingDeleteTab(tab)} 
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </motion.aside>
      )}

      <AnimatePresence>
        {pendingDeleteTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-[min(92vw,26rem)] rounded-xl border border-outline-variant/20 bg-surface-highest/45 backdrop-blur-2xl shadow-2xl p-5"
            >
              <div className="text-on-surface text-sm font-medium">{t('sidebar.deleteConfirm')}</div>
              <div className="text-on-surface-variant text-xs mt-2 leading-relaxed">
                {t('sidebar.deleteWarning').replace('{title}', pendingDeleteTab.title || t('sidebar.untitled'))}
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPendingDeleteTab(null)}
                  className="px-3 py-1.5 text-xs rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors"
                >
                  {t('sidebar.cancel')}
                </button>
                <button
                  onClick={() => {
                    onDeleteTab(pendingDeleteTab.id);
                    setPendingDeleteTab(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md text-red-300 bg-red-500/15 hover:bg-red-500/25 transition-colors"
                >
                  {t('sidebar.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

function TabItem({ tab, isActive, onSelect, onDelete }: { tab: TabData, isActive: boolean, onSelect: () => void, onDelete: () => void }) {
  const { t } = useI18n();
  return (
    <div 
      onClick={onSelect}
      className={`group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-white/10 text-on-surface shadow-[0_2px_10px_rgba(0,0,0,0.1)]' 
          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2 overflow-hidden flex-1 min-w-0">
          <Circle className={`w-2 h-2 flex-shrink-0 ${tab.isSaved ? 'fill-transparent text-transparent' : 'fill-secondary text-secondary'}`} />
          <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-secondary' : 'opacity-50'}`} />
          <span className="text-sm font-medium truncate min-w-0 mr-6">{tab.title || t('sidebar.untitled')}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`absolute right-2 top-2.5 p-1.5 rounded-md transition-all ${
            isActive ? 'opacity-50 hover:opacity-100 hover:bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
          }`}
          title={t('sidebar.deleteDocument')}
        >
          <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
        </button>
      </div>
      <span className="text-[10px] uppercase tracking-wider opacity-50 truncate pl-5.5">
        {tab.subtitle || t('sidebar.noSubtitle')}
      </span>
    </div>
  );
}