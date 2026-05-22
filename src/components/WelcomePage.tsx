import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import { useI18n } from '../lib/i18n';

/**
 * WelcomePageProps 欢迎页组件接口
 */
interface WelcomePageProps {
  onCreateDocument: () => void;
  onOpenDocument: () => void;
  documentCount: number;
}

/**
 * WelcomePage 欢迎页组件
 * 当没有打开文档时显示
 * 提供新建文档和打开文档的入口
 * 使用 Framer Motion 实现淡入动画
 */
export default function WelcomePage({ onCreateDocument, onOpenDocument, documentCount }: WelcomePageProps) {
  const { t } = useI18n();
  return (
    <div className="relative w-full h-full glass-panel rounded-xl overflow-hidden flex flex-col items-center justify-center p-8">
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
            {t('welcome.title')}
          </h1>
        </motion.div>

        {documentCount > 0 && (
          <motion.div
            className="mb-6 py-3 px-5 bg-surface-variant/30 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-primary text-xs opacity-70">
              {t('welcome.youHave')} <span className="font-medium">{documentCount}</span> {documentCount > 1 ? t('welcome.documents') : t('welcome.document')}
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
            <span className="text-sm font-medium">{t('welcome.createNew')}</span>
          </motion.button>

          {documentCount > 0 && (
            <motion.button
              onClick={onOpenDocument}
              className="px-6 py-3 bg-surface-variant/50 hover:bg-surface-variant/70 text-on-surface-variant rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FolderOpen size={18} />
              <span className="text-sm font-medium">{t('welcome.openExisting')}</span>
            </motion.button>
          )}
        </motion.div>

        <motion.p
          className="mt-10 text-primary text-xs opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {t('welcome.shortcut')}
        </motion.p>
      </motion.div>
    </div>
  );
}