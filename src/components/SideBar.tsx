import React, { useState } from 'react';
import { Search, Plus, Trash2, FileText, Circle, Folder, ChevronDown, Pencil, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useI18n } from '../lib/i18n';
import { TabData } from '../App';
import type { MenuMode } from './SidebarContextMenu';

interface SideBarProps {
  isOpen: boolean;
  tabs: TabData[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onDeleteTab: (id: string) => void;
  onAddTab: () => void;
  onReorderTabs: (newTabs: TabData[]) => void;
  collections: string[];
  onCollectionsChange: (cols: string[]) => void;
  onMoveToCollection: (docId: string, collection: string | undefined) => void;
  onContextMenu: (e: React.MouseEvent, mode: MenuMode, docId?: string, collectionName?: string) => void;
}

export default function SideBar({
  isOpen, tabs, activeTabId, onSelectTab, onDeleteTab, onAddTab, onReorderTabs,
  collections, onCollectionsChange, onMoveToCollection, onContextMenu,
}: SideBarProps) {
  const { t } = useI18n();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteTab, setPendingDeleteTab] = useState<TabData | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [editingColValue, setEditingColValue] = useState('');
  const [showNewColInput, setShowNewColInput] = useState(false);
  const [newColValue, setNewColValue] = useState('');
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.toLowerCase();
  const filteredTabs = tabs.filter(tab =>
    (tab.title || '').toLowerCase().includes(q) ||
    (tab.subtitle || '').toLowerCase().includes(q)
  );

  // 按合集分组
  const grouped = new Map<string | '', TabData[]>();
  const uncategorized: TabData[] = [];
  for (const col of collections) grouped.set(col, []);
  for (const tab of tabs) {
    const col = tab.collection || '';
    if (col && grouped.has(col)) grouped.get(col)!.push(tab);
    else if (!col) uncategorized.push(tab);
    else grouped.set(col, [tab]); // orphan collection
  }

  // 显示所有合集（包括空合集）
  const orderedCollections = collections;

  const toggleCollapse = (name: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleRenameCol = (oldName: string) => {
    const newName = editingColValue.trim();
    if (!newName || newName === oldName) { setEditingCol(null); return; }
    onCollectionsChange(collections.map(c => c === oldName ? newName : c));
    // 更新属于该合集的文档
    tabs.filter(t => t.collection === oldName).forEach(t => onMoveToCollection(t.id, newName));
    setEditingCol(null);
  };

  const handleDeleteCol = (name: string) => {
    onCollectionsChange(collections.filter(c => c !== name));
    tabs.filter(t => t.collection === name).forEach(t => onMoveToCollection(t.id, undefined));
  };

  const handleCreateCol = () => {
    const name = newColValue.trim();
    if (!name || collections.includes(name)) { setShowNewColInput(false); setNewColValue(''); return; }
    onCollectionsChange([...collections, name]);
    setShowNewColInput(false);
    setNewColValue('');
  };

  const handleDropOnCol = (colName: string | undefined, docId: string) => {
    onMoveToCollection(docId, colName);
    setDragOverCol(null);
  };

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
          {/* ── 头部 ── */}
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

          {/* ── 搜索 ── */}
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

          {/* ── 文档列表（按合集分组） ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-hidden px-4 pb-4" onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, 'all'); }}>
            {isSearching ? (
              <div className="space-y-1">
                {filteredTabs.map(tab => (
                  <div key={tab.id} onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'document', tab.id); }}>
                    <TabItem tab={tab} isActive={activeTabId === tab.id} onSelect={() => onSelectTab(tab.id)} onDelete={() => setPendingDeleteTab(tab)} />
                  </div>
                ))}
                {filteredTabs.length === 0 && (
                  <div className="text-center text-on-surface-variant text-xs py-8 opacity-50">{t('sidebar.noDocuments')}</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* 合集分组 */}
                {orderedCollections.map(colName => {
                  const docs = grouped.get(colName) || [];
                  const isCollapsed = collapsedCols.has(colName);
                  return (
                    <div key={colName}>
                      {/* 合集标题 */}
                      <div
                        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                          dragOverCol === colName
                            ? 'bg-secondary/20 text-secondary'
                            : 'hover:bg-secondary/10 hover:text-secondary'
                        }`}
                        onClick={() => toggleCollapse(colName)}
                        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'collection', undefined, colName); }}
                        onDragOver={(e) => { e.preventDefault(); setDragOverCol(colName); }}
                        onDragLeave={() => setDragOverCol(null)}
                        onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/doc-id'); if (id) handleDropOnCol(colName, id); }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <ChevronDown className={`w-3 h-3 text-on-surface-variant/60 flex-shrink-0 transition-transform group-hover:text-secondary ${isCollapsed ? '-rotate-90' : ''}`} />
                          <Folder className="w-3.5 h-3.5 text-on-surface-variant/70 flex-shrink-0 group-hover:text-secondary" />
                          {editingCol === colName ? (
                            <input
                              autoFocus
                              value={editingColValue}
                              onChange={(e) => setEditingColValue(e.target.value)}
                              onBlur={() => handleRenameCol(colName)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCol(colName); if (e.key === 'Escape') setEditingCol(null); }}
                              className="flex-1 bg-black/30 border border-outline-variant/30 rounded px-1 py-0.5 text-xs text-on-surface outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-xs text-on-surface-variant truncate group-hover:text-secondary">{colName}</span>
                          )}
                          <span className="text-[10px] text-on-surface-variant/40 flex-shrink-0 ml-auto group-hover:hidden">{docs.length}</span>
                        </div>
                        <div className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingCol(colName); setEditingColValue(colName); }}
                            className="p-1 rounded text-on-surface-variant/50 hover:text-on-surface hover:bg-white/10 transition-colors"
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCol(colName); }}
                            className="p-1 rounded text-on-surface-variant/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 合集内文档 */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 border-l border-outline-variant/10 pl-2 mt-0.5 space-y-0.5">
                              {docs.map(tab => (
                                <div
                                  key={tab.id}
                                  draggable
                                  onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('text/doc-id', tab.id)}
                                  onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'document', tab.id); }}
                                >
                                  <TabItem tab={tab} isActive={activeTabId === tab.id} onSelect={() => onSelectTab(tab.id)} onDelete={() => setPendingDeleteTab(tab)} compact />
                                </div>
                              ))}
                              {docs.length === 0 && (
                                <div className="text-[10px] text-on-surface-variant/30 text-center py-2 italic">{t('sidebar.collectionEmpty')}</div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* 未分类 */}
                {uncategorized.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider">{t('sidebar.uncategorized')}</span>
                      <span className="text-[10px] text-on-surface-variant/30">{uncategorized.length}</span>
                    </div>
                    <div className="space-y-0.5">
                      {uncategorized.map(tab => (
                        <div
                          key={tab.id}
                          draggable
                          onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('text/doc-id', tab.id)}
                          onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'document', tab.id); }}
                        >
                          <TabItem tab={tab} isActive={activeTabId === tab.id} onSelect={() => onSelectTab(tab.id)} onDelete={() => setPendingDeleteTab(tab)} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 新建合集输入框 */}
                {showNewColInput && (
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Folder className="w-3.5 h-3.5 text-secondary/70 flex-shrink-0" />
                    <input
                      autoFocus
                      value={newColValue}
                      onChange={(e) => setNewColValue(e.target.value)}
                      onBlur={handleCreateCol}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCol(); if (e.key === 'Escape') { setShowNewColInput(false); setNewColValue(''); } }}
                      placeholder={t('sidebar.collectionNamePlaceholder')}
                      className="flex-1 bg-black/30 border border-secondary/40 rounded px-1.5 py-1 text-xs text-on-surface placeholder-on-surface-variant/40 outline-none"
                    />
                  </div>
                )}

                {/* 新建合集按钮 */}
                <button
                  onClick={() => { setShowNewColInput(true); setNewColValue(''); }}
                  className="flex items-center gap-2 px-3 py-1.5 w-full text-xs text-on-surface-variant/50 hover:text-on-surface hover:bg-white/5 rounded-md transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {t('sidebar.newCollection')}
                </button>

                {/* 无文档提示 */}
                {tabs.length === 0 && (
                  <div className="text-center text-on-surface-variant text-xs py-8 opacity-50">
                    {t('sidebar.noDocuments')}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.aside>
      )}

      {/* ── 删除确认弹窗 ── */}
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
                  onClick={() => { onDeleteTab(pendingDeleteTab.id); setPendingDeleteTab(null); }}
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

function TabItem({ tab, isActive, onSelect, onDelete, compact }: { tab: TabData; isActive: boolean; onSelect: () => void; onDelete: () => void; compact?: boolean }) {
  const { t } = useI18n();
  if (compact) {
    return (
      <div
        onClick={onSelect}
        className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
          isActive ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant/70 hover:bg-secondary/10 hover:text-secondary'
        }`}
      >
        <FileText className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-secondary' : 'opacity-50 group-hover:text-secondary'}`} />
        <span className="text-xs truncate min-w-0 flex-1">{tab.title || t('sidebar.untitled')}</span>
        <Circle className={`w-1.5 h-1.5 flex-shrink-0 ${tab.isSaved ? 'fill-transparent text-transparent' : 'fill-secondary text-secondary'}`} />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          title={t('sidebar.deleteDocument')}
        >
          <Trash2 className="w-3 h-3 hover:text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all ${
        isActive
          ? 'bg-white/10 text-on-surface shadow-[0_2px_10px_rgba(0,0,0,0.1)]'
          : 'text-on-surface-variant hover:bg-secondary/10 hover:text-secondary'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2 overflow-hidden flex-1 min-w-0">
          <Circle className={`w-2 h-2 flex-shrink-0 ${tab.isSaved ? 'fill-transparent text-transparent' : 'fill-secondary text-secondary'}`} />
          <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-secondary' : 'opacity-50 group-hover:text-secondary'}`} />
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
