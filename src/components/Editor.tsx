import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
  fontFamily: 'sans' | 'serif';
  isUIVisible: boolean;
  tab: { id: string; title: string; subtitle: string; content: string } | null;
  fontSizePx: number;
  onUpdateTab: (id: string, updates: Partial<{ title: string; subtitle: string; content: string }>) => void;
}

export default function Editor({ fontFamily, isUIVisible, tab, fontSizePx, onUpdateTab }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingText, setClearingText] = useState('');

  useEffect(() => {
    if (!tab) return;
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [tab?.content]);

  const handleClear = () => {
    if (!tab) return;
    if (!tab.content.trim()) return;
    setClearingText(tab.content);
    setIsClearing(true);
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
          <div className="text-lg">No document open</div>
          <div className="text-sm opacity-70 mt-2">从左侧文档列表选择一个文件，或新建文档。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex flex-col items-center pt-6 pb-6">
      <div className="w-full h-full overflow-y-auto custom-scrollbar-hidden p-12 md:p-20 flex flex-col items-center">
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
            placeholder="Untitled Document"
          />
          <input 
            type="text" 
            value={tab.subtitle}
            onChange={(e) => onUpdateTab(tab.id, { subtitle: e.target.value })}
            className="bg-transparent text-on-surface-variant text-xs font-sans tracking-[0.2em] uppercase opacity-50 italic outline-none text-center w-full"
            placeholder="Subtitle"
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
            placeholder="Start writing..."
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
