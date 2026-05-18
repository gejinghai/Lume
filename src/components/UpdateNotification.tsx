import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UpdateNotification — 自动更新提示组件
 *
 * 监听主进程的更新事件，显示更新状态和操作按钮。
 * 支持手动重试检查/下载，错误可见可恢复。
 */
type UpdateStatus =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'check-error'; message: string }
  | { type: 'download-error'; message: string; version: string };

export default function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const pendingVersionRef = useRef<string | null>(null);

  const clear = useCallback(() => setStatus(null), []);

  const handleCheckAgain = useCallback(() => {
    setStatus({ type: 'checking' });
    window.electronAPI?.checkForUpdates();
  }, []);

  const handleDownload = useCallback(() => {
    // 保留当前版本用于错误追踪，不要覆盖 status — 让 progress/error 事件驱动
    if (status?.type === 'available') {
      pendingVersionRef.current = status.version;
    }
    window.electronAPI?.downloadUpdate();
  }, [status]);

  const handleInstall = useCallback(() => {
    window.electronAPI?.installUpdate();
  }, []);

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI.onUpdateChecking(() => {
      setStatus({ type: 'checking' });
    });

    window.electronAPI.onUpdateAvailable((info) => {
      pendingVersionRef.current = null;
      setStatus({ type: 'available', version: info.version });
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      setStatus({ type: 'not-available' });
      setTimeout(clear, 3000);
    });

    window.electronAPI.onUpdateError((msg) => {
      if (pendingVersionRef.current) {
        setStatus({ type: 'download-error', message: msg, version: pendingVersionRef.current });
        pendingVersionRef.current = null;
      } else {
        setStatus({ type: 'check-error', message: msg });
      }
    });

    window.electronAPI.onUpdateDownloadProgress((progress) => {
      // 进入下载状态，记录版本（从当前 available 或 ref 中获取）
      setStatus({ type: 'downloading', percent: Math.round(progress.percent) });
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      pendingVersionRef.current = null;
      setStatus({ type: 'downloaded', version: info.version });
    });

    return () => {
      window.electronAPI.removeAllListeners('update-checking');
      window.electronAPI.removeAllListeners('update-available');
      window.electronAPI.removeAllListeners('update-not-available');
      window.electronAPI.removeAllListeners('update-error');
      window.electronAPI.removeAllListeners('update-download-progress');
      window.electronAPI.removeAllListeners('update-downloaded');
    };
  }, [isElectron, clear]);

  return (
    <AnimatePresence>
      {status && status.type !== 'not-available' && (
        <motion.div
          key="update-notification"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-highest/80 backdrop-blur-2xl border border-outline-variant/20 shadow-2xl text-sm">
            {status.type === 'checking' && (
              <>
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-on-surface">Checking for updates...</span>
              </>
            )}

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

            {status.type === 'check-error' && (
              <>
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-on-surface text-xs font-medium">Update check failed</span>
                  <span className="text-outline-variant text-[11px] truncate max-w-[280px]">{status.message}</span>
                </div>
                <button
                  onClick={handleCheckAgain}
                  className="px-3 py-1 rounded-lg border border-outline-variant/40 text-on-surface text-xs font-medium hover:bg-surface-higher transition-colors shrink-0"
                >
                  Retry
                </button>
                <button onClick={clear} className="text-outline-variant hover:text-on-surface text-xs transition-colors shrink-0">
                  Dismiss
                </button>
              </>
            )}

            {status.type === 'download-error' && (
              <>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-on-surface text-xs">
                    Download failed for <strong>v{status.version}</strong>
                  </span>
                  <span className="text-outline-variant text-[11px] truncate max-w-[280px]">{status.message}</span>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1 rounded-lg bg-secondary text-on-secondary text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  Retry Download
                </button>
                <button onClick={handleCheckAgain} className="text-outline-variant hover:text-on-surface text-xs transition-colors">
                  Check Again
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
