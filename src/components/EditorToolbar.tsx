import React, { useRef, useState, useCallback } from 'react';
import type { Editor as TiptapEditorType } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Pilcrow,
  Table,
  Trash2,
  ArrowUpFromLine,
  ArrowLeftFromLine,
  Sigma,
  Highlighter,
} from 'lucide-react';
import ColorPicker from './ColorPicker';
import DropdownPortal from './DropdownPortal';
import { FONT_OPTIONS } from '../lib/fonts';

interface EditorToolbarProps {
  editor: TiptapEditorType | null;
}

const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
];

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [isTableGridOpen, setIsTableGridOpen] = useState(false);
  const fontFamilyBtnRef = useRef<HTMLButtonElement>(null);
  const fontSizeBtnRef = useRef<HTMLButtonElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const [gridHover, setGridHover] = useState({ rows: 0, cols: 0 });
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [formulaLatex, setFormulaLatex] = useState('');
  const formulaBtnRef = useRef<HTMLButtonElement>(null);
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);

  const HIGHLIGHT_COLORS = [
    { label: 'Yellow', value: '#f5e56b' },
    { label: 'Green', value: '#4ade80' },
    { label: 'Blue', value: '#60a5fa' },
    { label: 'Pink', value: '#f472b6' },
    { label: 'Orange', value: '#fb923c' },
    { label: 'Purple', value: '#a78bfa' },
  ];

  if (!editor) return null;

  const currentFontSize = editor.getAttributes('textStyle').fontSize as string | undefined;
  const currentColor = editor.getAttributes('textStyle').color as string | null;
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily as string | null;

  const Btn = ({
    icon: Icon,
    label,
    action,
    isActive,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    action: () => void;
    isActive: boolean;
  }) => (
    <button
      type="button"
      onClick={action}
      className={`p-1.5 rounded-md transition-colors ${
        isActive
          ? 'bg-secondary/20 text-secondary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-outline-variant/20 mx-1" />;

  return (
    <div className="flex items-center justify-center gap-0.5 px-3 py-1.5 border-b border-outline-variant/10 bg-surface-low/5 backdrop-blur-sm select-none overflow-x-auto custom-scrollbar-hidden opacity-40 hover:opacity-100 transition-opacity duration-300">
      {/* ── 段落 ── */}
      <Btn icon={Pilcrow} label="Paragraph" action={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} />
      <Btn icon={Heading1} label="Heading 1" action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} />
      <Btn icon={Heading2} label="Heading 2" action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} />
      <Btn icon={Heading3} label="Heading 3" action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} />

      <Divider />

      {/* ── B / I / U ── */}
      <Btn icon={Bold} label="Bold" action={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
      <Btn icon={Italic} label="Italic" action={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
      <Btn icon={Underline} label="Underline" action={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} />

      <Divider />

      {/* ── 字体 ── */}
      <button
        ref={fontFamilyBtnRef}
        type="button"
        onClick={() => setIsFontFamilyOpen(!isFontFamilyOpen)}
        className="px-1.5 py-1 rounded-md transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-1 text-[11px] max-w-[90px]"
        title="Font Family"
      >
        <span className="truncate">{FONT_OPTIONS.find(f => currentFontFamily?.includes(f.name))?.name || 'Font'}</span>
      </button>

      <DropdownPortal triggerRef={fontFamilyBtnRef} open={isFontFamilyOpen} onClose={() => setIsFontFamilyOpen(false)}>
        <div className="w-44 bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl overflow-hidden">
          {(['sans', 'serif', 'mono'] as const).map((category) => {
            const fonts = FONT_OPTIONS.filter(f => f.category === category);
            if (!fonts.length) return null;
            return (
              <div key={category}>
                <div className="px-3 py-1.5 text-[10px] text-on-surface-variant/50 uppercase tracking-wider">
                  {category === 'sans' ? 'Sans-serif' : category === 'serif' ? 'Serif' : 'Mono'}
                </div>
                {fonts.map(font => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font.family).run();
                      setIsFontFamilyOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      currentFontFamily === font.family
                        ? 'bg-secondary/20 text-secondary'
                        : 'text-on-surface hover:bg-secondary/10 hover:text-secondary'
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            );
          })}
          <div className="border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetFontFamily().run();
                setIsFontFamilyOpen(false);
              }}
              className="w-full text-center px-3 py-1.5 text-[10px] text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </DropdownPortal>

      <Divider />

      {/* ── 颜色 ── */}
      <ColorPicker
        currentColor={currentColor}
        onColorChange={(color) => {
          if (color) editor.chain().focus().setColor(color).run();
          else editor.chain().focus().unsetColor().run();
        }}
      />

      {/* ── 高亮 ── */}
      <button
        ref={highlightBtnRef}
        type="button"
        onClick={() => setIsHighlightOpen(!isHighlightOpen)}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('highlight')
            ? 'bg-secondary/20 text-secondary'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
        }`}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </button>

      <DropdownPortal triggerRef={highlightBtnRef} open={isHighlightOpen} onClose={() => setIsHighlightOpen(false)}>
        <div className="bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl p-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color: c.value }).run();
                  setIsHighlightOpen(false);
                }}
                className={`w-8 h-8 rounded-md border transition-transform hover:scale-110 ${
                  editor.isActive('highlight', { color: c.value })
                    ? 'border-secondary ring-1 ring-secondary'
                    : 'border-outline-variant/30'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              setIsHighlightOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1 text-xs text-on-surface-variant hover:text-secondary py-1 rounded hover:bg-secondary/10 transition-colors"
          >
            Remove
          </button>
        </div>
      </DropdownPortal>

      {/* ── 字号 ── */}
      <button
        ref={fontSizeBtnRef}
        type="button"
        onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
        className="p-1 rounded-md transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-0.5 text-xs"
        title="Font Size"
      >
        <span className="min-w-[16px] text-center">{currentFontSize?.replace('px', '') || '16'}</span>
      </button>

      <DropdownPortal triggerRef={fontSizeBtnRef} open={isFontSizeOpen} onClose={() => setIsFontSizeOpen(false)}>
        <div className="w-16 bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl overflow-hidden">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => {
                editor.chain().focus().setFontSize(size.value).run();
                setIsFontSizeOpen(false);
              }}
              className={`w-full text-center px-2 py-1.5 text-xs transition-colors ${
                currentFontSize === size.value
                  ? 'bg-secondary/20 text-secondary'
                  : 'text-on-surface hover:bg-secondary/10 hover:text-secondary'
              }`}
            >
              {size.label}
            </button>
          ))}
          <div className="border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetFontSize().run();
                setIsFontSizeOpen(false);
              }}
              className="w-full text-center px-2 py-1.5 text-[10px] text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </DropdownPortal>

      <Divider />

      {/* ── 列表 ── */}
      <Btn icon={List} label="Bullet List" action={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
      <Btn icon={ListOrdered} label="Ordered List" action={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />

      <Divider />

      {/* ── 表格 ── */}
      <button
        ref={tableBtnRef}
        type="button"
        onClick={() => setIsTableGridOpen(!isTableGridOpen)}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('table')
            ? 'bg-secondary/20 text-secondary'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
        }`}
        title="Insert Table"
      >
        <Table className="w-4 h-4" />
      </button>

      <DropdownPortal triggerRef={tableBtnRef} open={isTableGridOpen} onClose={() => setIsTableGridOpen(false)}>
        <div className="bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl p-3">
          <div className="grid grid-cols-5 gap-[3px] mb-2">
            {Array.from({ length: 25 }, (_, i) => {
              const row = Math.floor(i / 5) + 1;
              const col = (i % 5) + 1;
              const active = row <= gridHover.rows && col <= gridHover.cols;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setGridHover({ rows: row, cols: col })}
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run();
                    setIsTableGridOpen(false);
                  }}
                  className={`w-5 h-5 rounded-sm transition-colors ${
                    active
                      ? 'bg-secondary/40 border border-secondary/60'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-center text-[10px] text-on-surface-variant">
            {gridHover.rows > 0 ? `${gridHover.rows} × ${gridHover.cols}` : 'Select size'}
          </div>
        </div>
      </DropdownPortal>

      {/* 表格操作按钮（仅在表格内显示） */}
      {editor.isActive('table') && (
        <>
          <Btn icon={ArrowUpFromLine} label="Add Row" action={() => editor.chain().focus().addRowAfter().run()} isActive={false} />
          <Btn icon={ArrowLeftFromLine} label="Add Column" action={() => editor.chain().focus().addColumnAfter().run()} isActive={false} />
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-1.5 rounded-md transition-colors text-on-surface-variant hover:text-red-400 hover:bg-red-400/10"
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}

      <Divider />

      {/* ── 公式 ── */}
      <button
        ref={formulaBtnRef}
        type="button"
        onClick={() => { setIsFormulaOpen(!isFormulaOpen); setFormulaLatex(''); }}
        className="p-1.5 rounded-md transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5"
        title="Insert Formula"
      >
        <Sigma className="w-4 h-4" />
      </button>

      <DropdownPortal triggerRef={formulaBtnRef} open={isFormulaOpen} onClose={() => setIsFormulaOpen(false)}>
        <div className="bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl p-3 w-72">
          <div className="text-xs text-on-surface-variant mb-2">LaTeX Formula</div>
          <textarea
            autoFocus
            value={formulaLatex}
            onChange={(e) => setFormulaLatex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (formulaLatex.trim()) {
                  editor.chain().focus().insertInlineMath({ latex: formulaLatex.trim() }).run();
                  setIsFormulaOpen(false);
                }
              }
            }}
            placeholder="E = mc^2"
            className="w-full h-20 bg-surface/60 border border-outline-variant/20 rounded-md p-2 text-xs text-on-surface placeholder-outline-variant outline-none resize-none font-mono"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsFormulaOpen(false)}
              className="px-2.5 py-1 text-[10px] text-on-surface-variant hover:text-on-surface transition-colors rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (formulaLatex.trim()) {
                  editor.chain().focus().insertInlineMath({ latex: formulaLatex.trim() }).run();
                  setIsFormulaOpen(false);
                }
              }}
              disabled={!formulaLatex.trim()}
              className="px-2.5 py-1 text-[10px] bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors rounded disabled:opacity-30"
            >
              Inline Σ
            </button>
            <button
              type="button"
              onClick={() => {
                if (formulaLatex.trim()) {
                  editor.chain().focus().insertBlockMath({ latex: formulaLatex.trim() }).run();
                  setIsFormulaOpen(false);
                }
              }}
              disabled={!formulaLatex.trim()}
              className="px-2.5 py-1 text-[10px] bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors rounded disabled:opacity-30"
            >
              Block Σ
            </button>
          </div>
        </div>
      </DropdownPortal>

      <Divider />

      {/* ── 引用 & 代码块 ── */}
      <Btn icon={Quote} label="Blockquote" action={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} />
      <Btn icon={Code} label="Code Block" action={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} />
    </div>
  );
}
