import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';

import config from '../config.json';

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutPanel({ isOpen, onClose }: AboutPanelProps) {
  const { t } = useI18n();
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const openUrl = (url: string) => {
    if (isElectron) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  /** 检测当前系统平台 key */
  const detectPlatform = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Mac')) {
      // Electron 下用 process.arch 精确区分 Apple Silicon / Intel
      const arch = isElectron ? window.electronAPI.getArch() : (ua.includes('ARM') ? 'arm64' : 'x64');
      return arch === 'arm64' ? 'mac-arm' : 'mac-intel';
    }
    if (ua.includes('Win')) return 'win';
    if (ua.includes('Linux')) return 'linux';
    return '';
  };

  // 更新检查状态
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'latest' | 'available' | 'error'>('idle');
  const [latestVersion, setLatestVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleCheckUpdate = async () => {
    setUpdateState('checking');
    setLatestVersion('');
    setDownloadUrl('');
    try {
      const res = await fetch(config.updateCheckUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as { latest: string; url?: string; urls?: Record<string, string> };
      const remoteVer = (data.latest || '').replace(/^v/, '');
      if (remoteVer && remoteVer !== config.appVersion) {
        setLatestVersion(remoteVer);
        // 优先匹配系统对应下载链接，其次通用链接
        const platform = detectPlatform();
        setDownloadUrl(data.urls?.[platform] || data.url || '');
        setUpdateState('available');
      } else {
        setUpdateState('latest');
      }
    } catch (e) {
      console.error('[Update check] Failed:', e);
      setUpdateState('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-16 right-4 w-72 bg-surface-highest/50 backdrop-blur-3xl border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-medium text-on-surface">{t('about.title')}</h3>
            <button
              onClick={onClose}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* App name */}
            <div className="text-center pb-2">
              <div className="text-xl font-light text-on-surface">Lume</div>
              <div className="text-[11px] text-on-surface-variant/50 mt-1">{t('about.tagline')}</div>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant/60">{t('about.version')}</span>
              <span className="text-on-surface font-medium">v{config.appVersion}</span>
            </div>

            {/* Website */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant/60">{t('about.website')}</span>
              <button
                onClick={() => openUrl(config.websiteUrl)}
                className="flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors"
              >
                {config.websiteUrl.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant/10" />

            {/* Update Check */}
            <div>
              <button
                onClick={handleCheckUpdate}
                disabled={updateState === 'checking'}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateState === 'checking' ? 'animate-spin' : ''}`} />
                {updateState === 'checking' ? t('update.checking') : t('update.check')}
              </button>

              {updateState === 'latest' && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-accent/70">
                  <CheckCircle className="w-3 h-3" />
                  {t('update.latest')}
                </div>
              )}

              {updateState === 'error' && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  {t('update.error')}
                </div>
              )}

              {updateState === 'available' && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-secondary">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t('update.available')} v{latestVersion}</span>
                  <button
                    onClick={() => openUrl(downloadUrl || config.updateCheckUrl.replace('/version.json', ''))}
                    className="ml-1 px-2 py-0.5 rounded bg-secondary/20 hover:bg-secondary/30 text-secondary transition-colors"
                  >
                    {t('update.download')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
