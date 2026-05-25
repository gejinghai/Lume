import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FolderOpen, Layers, FileType, Braces, Code2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export type ExportFormat = 'md' | 'txt' | 'json' | 'html';
export type MenuMode = 'document' | 'collection' | 'all';

export interface ContextMenuState {
  x: number;
  y: number;
  mode: MenuMode;
  docId?: string;
  collectionName?: string;
}

interface SidebarContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
  onSelectFormat: (format: ExportFormat) => void;
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  md: <FileText className="w-3.5 h-3.5" />,
  txt: <FileType className="w-3.5 h-3.5" />,
  json: <Braces className="w-3.5 h-3.5" />,
  html: <Code2 className="w-3.5 h-3.5" />,
};

export default function SidebarContextMenu({ menu, onClose, onSelectFormat }: SidebarContextMenuProps) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    requestAnimationFrame(() => document.addEventListener('mousedown', handleClick));
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menu, onClose]);

  if (!menu) return null;

  const labelKey = menu.mode === 'document' ? 'sidebar.exportDocument' :
    menu.mode === 'collection' ? 'sidebar.exportCollection' : 'sidebar.exportAll';

  const HeaderIcon = menu.mode === 'document' ? FileText :
    menu.mode === 'collection' ? FolderOpen : Layers;

  const formatLabelKey = (fmt: ExportFormat) =>
    fmt === 'md' ? 'Markdown' :
    fmt === 'txt' ? 'Plain Text' :
    fmt === 'json' ? 'JSON' : 'HTML';

  const adjustedX = Math.min(menu.x, window.innerWidth - 170);
  const adjustedY = Math.min(menu.y, window.innerHeight - 200);

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[80] w-40 bg-surface-highest/70 backdrop-blur-2xl border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden py-1.5"
          style={{ left: adjustedX, top: adjustedY }}
        >
          <div className="flex items-center gap-2 px-3 pb-1.5 text-[10px] text-on-surface-variant/50 uppercase tracking-wider border-b border-outline-variant/10 mb-1">
            <HeaderIcon className="w-3 h-3 opacity-60" />
            {t(labelKey)}
          </div>
          {(['md', 'txt', 'json', 'html'] as ExportFormat[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => onSelectFormat(fmt)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-colors"
            >
              {FORMAT_ICONS[fmt]}
              {formatLabelKey(fmt)}
              <span className="ml-auto text-[10px] opacity-40">.{fmt}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
