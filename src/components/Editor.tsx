import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Editor as TiptapEditorType } from '@tiptap/core';
import { useI18n } from '../lib/i18n';
import { getFont } from '../lib/fonts';
import RichEditor from './RichEditor';
import EditorToolbar from './EditorToolbar';

/**
 * 编辑器组件Props接口
 */
interface EditorProps {
  fontFamily: string;                                         // 字体 ID
  isUIVisible: boolean;                                      // UI是否可见
  tab: {                                                     // 当前文档标签
    id: string;
    title: string;
    subtitle: string;
    content: string;                                          // JSON.stringify(TipTap doc) 或纯文本
  } | null;
  fontSizePx: number;                                        // 字体大小（像素）
  onUpdateTab: (id: string, updates: Partial<{ title: string; subtitle: string; content: string }>) => void;
}

/**
 * Editor 编辑器组件（TipTap 版本）
 */
export default function Editor({ fontFamily, isUIVisible, tab, fontSizePx, onUpdateTab }: EditorProps) {
  const { t } = useI18n();

  // TipTap editor 实例引用（用于工具栏和清除动画）
  const [editor, setEditor] = useState<TiptapEditorType | null>(null);

  // 清除动画状态
  const [isClearing, setIsClearing] = useState(false);
  const [clearingText, setClearingText] = useState('');

  /**
   * 处理清除内容
   */
  const handleClear = useCallback(() => {
    if (!tab) return;
    if (!tab.content) return;

    // 从编辑器或内容中提取纯文本用于动画
    const text = editor ? editor.getText() : tab.content;
    if (!text.trim()) return;

    setClearingText(text);
    setIsClearing(true);

    // 1.2秒后清空内容
    setTimeout(() => {
      editor?.commands.clearContent();
      onUpdateTab(tab.id, { content: '' });
      setClearingText('');
      setIsClearing(false);
    }, 1200);
  }, [tab, editor, onUpdateTab]);

  if (!tab) {
    return (
      <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center text-on-surface-variant">
          <div className="text-lg">{t('editor.noDocument')}</div>
          <div className="text-sm opacity-70 mt-2">{t('editor.selectDocument')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex flex-col">
      {/* 格式工具栏 */}
      <EditorToolbar editor={editor} />

      {/* 可滚动内容区 */}
      <div className="w-full h-full overflow-y-auto custom-scrollbar-hidden p-12 md:p-20 flex flex-col items-center select-text">
        <motion.div
          className="mb-12 text-center w-full max-w-2xl flex-shrink-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <input
            type="text"
            value={tab.title}
            onChange={(e) => onUpdateTab(tab.id, { title: e.target.value })}
            className="bg-transparent text-primary text-2xl md:text-3xl font-light tracking-tight mb-3 opacity-90 outline-none text-center w-full placeholder-outline-variant"
            placeholder={t('editor.titlePlaceholder')}
          />
          <input
            type="text"
            value={tab.subtitle}
            onChange={(e) => onUpdateTab(tab.id, { subtitle: e.target.value })}
            className="bg-transparent text-on-surface-variant text-xs font-sans tracking-[0.2em] uppercase opacity-50 italic outline-none text-center w-full"
            placeholder={t('editor.subtitlePlaceholder')}
          />
        </motion.div>

        <div className="w-full max-w-2xl flex-grow relative pb-20">
          <div className={isClearing ? 'opacity-0 pointer-events-none' : ''}>
            <RichEditor
              key={tab.id}
              content={tab.content}
              onChange={(json) => onUpdateTab(tab.id, { content: json })}
              fontSize={fontSizePx}
              fontFamilyId={fontFamily}
              readOnly={isClearing}
              onEditorReady={setEditor}
            />
          </div>

          {/* 清除文字飞散动画 */}
          <AnimatePresence>
            {isClearing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words text-on-surface text-lg md:text-xl leading-[1.8] font-light"
                style={{ fontSize: fontSizePx, fontFamily: getFont(fontFamily).family }}
              >
                {clearingText.split('').map((char, index, arr) => {
                  const reverseIndex = arr.length - 1 - index;
                  const delay = reverseIndex * 0.008;
                  return (
                    <motion.span
                      key={`${char}-${index}`}
                      initial={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                      animate={{ y: -28, opacity: 0, filter: 'blur(6px)' }}
                      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
                      style={{ display: char === '\n' ? 'block' : 'inline-block' }}
                    >
                      {char === ' ' ? '\u00A0' : char === '\n' ? '' : char}
                    </motion.span>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* {isUIVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={handleClear}
          className="absolute top-16 right-4 px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-on-surface-variant hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all z-50"
        >
          Clear
        </motion.button>
      )} */}
    </div>
  );
}
