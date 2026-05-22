/**
 * Font 字体定义
 */
export interface FontOption {
  id: string;
  name: string;
  family: string;       // CSS font-family value
  category: 'sans' | 'serif' | 'mono';
}

/**
 * 系统字体列表（跨平台兼容）
 */
export const FONT_OPTIONS: FontOption[] = [
  // ── Sans-serif ──
  { id: 'inter',        name: 'Inter',           family: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",        category: 'sans' },
  { id: 'noto-sans-sc', name: 'Noto Sans SC',    family: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",                                      category: 'sans' },
  { id: 'pingfang',     name: 'PingFang',        family: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",                                      category: 'sans' },
  { id: 'yahei',        name: 'Microsoft YaHei', family: "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif",                                      category: 'sans' },

  // ── Serif ──
  { id: 'georgia',      name: 'Georgia',         family: "Georgia, 'Noto Serif', 'Songti SC', SimSun, serif",                                                 category: 'serif' },
  { id: 'merriweather', name: 'Merriweather',    family: "'Merriweather', Georgia, 'Noto Serif', serif",                                                       category: 'serif' },
  { id: 'noto-serif-sc',name: 'Noto Serif SC',   family: "'Noto Serif SC', 'Songti SC', SimSun, serif",                                                        category: 'serif' },
  { id: 'songti',       name: 'Songti SC',       family: "'Songti SC', SimSun, 'Noto Serif SC', serif",                                                        category: 'serif' },

  // ── Mono ──
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: "'JetBrains Mono', 'Source Code Pro', 'Cascadia Code', 'Fira Code', monospace",                    category: 'mono' },
  { id: 'source-code-pro',name: 'Source Code Pro',family: "'Source Code Pro', 'JetBrains Mono', 'Cascadia Code', monospace",                                 category: 'mono' },
];

/** 默认字体（Inter sans-serif） */
export const DEFAULT_FONT_ID = 'inter';

export function getFont(id: string): FontOption {
  return FONT_OPTIONS.find(f => f.id === id) ?? FONT_OPTIONS[0];
}
