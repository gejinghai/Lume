import React, { useState, useEffect } from 'react';
import { FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BottomBarProps 接口
 */
interface BottomBarProps {
  isUIVisible: boolean;      // UI是否可见
  wordCount?: number;        // 字数统计
  charCount?: number;       // 字符数统计
}

/**
 * BottomBar 底部状态栏组件
 * 显示当前文档的字数统计和系统时间
 * 当鼠标移动时显示，静止3秒后自动隐藏
 */
export default function BottomBar({ isUIVisible, wordCount = 0, charCount = 0 }: BottomBarProps) {
  // 当前时间状态
  const [time, setTime] = useState('');

  // 定时更新系统时间（每分钟更新一次）
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isUIVisible && (
        <motion.footer 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 w-full z-30 flex justify-between px-6 md:px-12 py-6 bg-gradient-to-t from-surface/80 to-transparent text-on-surface-variant font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] pointer-events-none"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 opacity-70" />
            <span>Words: {wordCount.toLocaleString()} | Chars: {charCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span>System: {time}</span>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
