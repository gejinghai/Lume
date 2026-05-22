import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../lib/i18n';

/**
 * 编辑器组件Props接口
 */
interface EditorProps {
  fontFamily: 'sans' | 'serif';       // 字体系列：sans-无衬线，serif-衬线
  isUIVisible: boolean;               // UI是否可见（用于控制清除按钮显示）
  tab: {                              // 当前文档标签
    id: string;                       // 文档ID
    title: string;                    // 文档标题
    subtitle: string;                 // 文档副标题
    content: string;                 // 文档内容
  } | null;
  fontSizePx: number;                 // 字体大小（像素）
  onUpdateTab: (                     // 更新文档回调函数
    id: string, 
    updates: Partial<{ title: string; subtitle: string; content: string }>
  ) => void;
}

/**
 * Editor 编辑器组件
 * 核心写作区域，支持标题、副标题和正文编辑
 * 提供文字清除动画效果
 */
export default function Editor({ fontFamily, isUIVisible, tab, fontSizePx, onUpdateTab }: EditorProps) {
  const { t } = useI18n();
  // 文本域引用，用于自动调整高度
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 清除动画状态
  const [isClearing, setIsClearing] = useState(false);    // 是否正在清除
  const [clearingText, setClearingText] = useState('');    // 清除时的文字副本

  // 监听内容变化，自动调整文本域高度
  useEffect(() => {
    if (!tab) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 保存外层滚动容器的滚动位置，防止 height='auto' 重置后跳动到顶部
    const scrollContainer = textarea.parentElement?.parentElement as HTMLElement | null;
    const prevScrollTop = scrollContainer?.scrollTop ?? 0;

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    // 恢复滚动位置
    if (scrollContainer) {
      scrollContainer.scrollTop = prevScrollTop;
    }
  }, [tab?.content]);

  /**
   * 处理清除内容
   * 触发文字飞散动画效果
   */
  const handleClear = () => {
    if (!tab) return;
    if (!tab.content.trim()) return;
    
    // 保存当前内容用于动画
    setClearingText(tab.content);
    setIsClearing(true);
    
    // 1.2秒后清空内容
    setTimeout(() => {
      onUpdateTab(tab.id, { content: '' });
      setClearingText('');
      setIsClearing(false);
    }, 1200);
  };

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
    <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex flex-col items-center pt-6 pb-6">
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
          <motion.textarea
            ref={textareaRef}
            value={tab.content}
            onChange={(e) => onUpdateTab(tab.id, { content: e.target.value })}
            spellCheck={false}
            readOnly={isClearing}
            className={`w-full bg-transparent outline-none resize-none text-on-surface text-lg md:text-xl leading-[1.8] placeholder-outline-variant/30 ${
              fontFamily === 'serif' ? 'font-serif' : 'font-sans font-light'
            } ${isClearing ? 'text-transparent caret-transparent select-none' : ''}`}
            placeholder={t('editor.startWriting')}
            style={{ minHeight: '50vh', fontSize: fontSizePx }}
          />

          <AnimatePresence>
            {isClearing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`pointer-events-none absolute inset-0 whitespace-pre-wrap break-words text-on-surface text-lg md:text-xl leading-[1.8] ${
                  fontFamily === 'serif' ? 'font-serif' : 'font-sans font-light'
                }`}
                style={{ fontSize: fontSizePx }}
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
            className="absolute top-4 right-4 px-3 py-1.5 text-xs font-medium tracking-wider uppercase text-on-surface-variant hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all z-50"
          >
            Clear
          </motion.button>
        )} */}
    </div>
  );
}
