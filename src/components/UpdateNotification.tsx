import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UpdateNotification — 自动更新提示组件
 *
 * 监听主进程的更新事件，显示更新状态和操作按钮。
 */
type UpdateStatus =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };

export default function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const clear = useCallback(() => setStatus(null), []);

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI.onUpdateChecking(() => setStatus({ type: 'checking' }));
    window.electronAPI.onUpdateAvailable((info) => setStatus({ type: 'available', version: info.version }));
    window.electronAPI.onUpdateNotAvailable(() => {
      setStatus({ type: 'not-available' });
      setTimeout(clear, 3000);
    });
    window.electronAPI.onUpdateError((msg) => {
      setStatus({ type: 'error', message: msg });
      setTimeout(clear, 5000);
    });
    window.electronAPI.onUpdateDownloadProgress((progress) => {
      setStatus({ type: 'downloading', percent: Math.round(progress.percent) });
    });
    window.electronAPI.onUpdateDownloaded((info) => {
      setStatus({ type: 'downloaded', version: info.version });
    });

    // 清理监听器
    return () => {
      window.electronAPI.removeAllListeners('update-checking');
      window.electronAPI.removeAllListeners('update-available');
      window.electronAPI.removeAllListeners('update-not-available');
      window.electronAPI.removeAllListeners('update-error');
      window.electronAPI.removeAllListeners('update-download-progress');
      window.electronAPI.removeAllListeners('update-downloaded');
    };
  }, [isElectron, clear]);

  const handleDownload = () => {
    window.electronAPI?.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI?.installUpdate();
  };

  return (
    <AnimatePresence>
      {status && status.type !== 'checking' && status.type !== 'not-available' && (
        <motion.div
          key="update-notification"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-highest/80 backdrop-blur-2xl border border-outline-variant/20 shadow-2xl text-sm">
            {status.type === 'available' && (
              <>
                <span className="text-on-surface">
                  Update <strong>v{status.version}</strong> available
                </span>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 rounded-lg bg-secondary text-on-secondary text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  Download
                </button>
                <button onClick={clear} className="text-outline-variant hover:text-on-surface text-xs transition-colors">
                  Dismiss
                </button>
              </>
            )}
            {status.type === 'downloading' && (
              <>
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-on-surface">Downloading... {status.percent}%</span>
              </>
            )}
            {status.type === 'downloaded' && (
              <>
                <span className="text-on-surface">
                  Update <strong>v{status.version}</strong> downloaded
                </span>
                <button
                  onClick={handleInstall}
                  className="px-3 py-1 rounded-lg bg-secondary text-on-secondary text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  Restart & Install
                </button>
                <button onClick={clear} className="text-outline-variant hover:text-on-surface text-xs transition-colors">
                  Later
                </button>
              </>
            )}
            {status.type === 'error' && (
              <>
                <span className="text-red-400">Update check failed: {status.message}</span>
                <button onClick={clear} className="text-outline-variant hover:text-on-surface text-xs transition-colors">
                  Dismiss
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
