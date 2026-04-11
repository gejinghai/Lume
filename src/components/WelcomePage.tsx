import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';

/**
 * WelcomePageProps 欢迎页组件接口
 */
interface WelcomePageProps {
  onCreateDocument: () => void;   // 新建文档回调
  onOpenDocument: () => void;     // 打开文档回调
  documentCount: number;          // 已有文档数量
}

/**
 * WelcomePage 欢迎页组件
 * 当没有打开文档时显示
 * 提供新建文档和打开文档的入口
 * 使用 Framer Motion 实现淡入动画
 */
export default function WelcomePage({ onCreateDocument, onOpenDocument, documentCount }: WelcomePageProps) {
  return (
    <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex flex-col items-center justify-center p-8">
      {/* 欢迎内容容器 */}
      <motion.div 
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          <img 
            src="./images/logo.png" 
            alt="Lume Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain opacity-50"
          />
          <h1 className="text-primary text-2xl md:text-3xl font-light tracking-tight mb-1 opacity-90">
            Welcome to Lume
          </h1>
        </motion.div>

        {documentCount > 0 && (
          <motion.div 
            className="mb-6 py-3 px-5 bg-surface-variant/30 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-on-surface-variant text-xs opacity-70">
              You have <span className="text-primary font-medium">{documentCount}</span> document{documentCount > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        <motion.div 
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={onCreateDocument}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-300 border border-primary/20 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Create New Document</span>
          </motion.button>

          {documentCount > 0 && (
            <motion.button
              onClick={onOpenDocument}
              className="px-6 py-3 bg-surface-variant/50 hover:bg-surface-variant/70 text-on-surface-variant rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FolderOpen size={18} />
              <span className="text-sm font-medium">Open Existing Document</span>
            </motion.button>
          )}
        </motion.div>

        <motion.p 
          className="mt-10 text-on-surface-variant text-xs opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Press Cmd+N to create new document · Cmd+Shift+S to open sidebar
        </motion.p>
      </motion.div>
    </div>
  );
}