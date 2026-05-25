import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Highlight } from '@tiptap/extension-highlight';
import type { Editor as TiptapEditorType } from '@tiptap/core';
import { getFont } from '../lib/fonts';

/** 默认空白文档 */
const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

/**
 * 解析编辑器内容：尝试 JSON.parse，失败则当纯文本处理
 */
function parseContent(content: string | undefined): JSONContent {
  if (!content) return EMPTY_DOC;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
      return parsed as JSONContent;
    }
    return EMPTY_DOC;
  } catch {
    return plainTextToDoc(content);
  }
}

/**
 * 纯文本 → TipTap doc（按换行分段）
 */
function plainTextToDoc(text: string): JSONContent {
  const lines = text.split('\n');
  const content: JSONContent[] = lines.map(line => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }));
  return { type: 'doc', content };
}

export interface RichEditorProps {
  /** JSON 字符串格式的内容 */
  content: string;
  /** 内容变更回调，传入 JSON.stringify 后的字符串 */
  onChange: (jsonString: string) => void;
  /** 字体大小（px） */
  fontSize: number;
  /** 字体 ID */
  fontFamilyId: string;
  /** 只读（清除动画期间） */
  readOnly?: boolean;
  /** 编辑器就绪回调 */
  onEditorReady?: (editor: TiptapEditorType | null) => void;
}

export default function RichEditor({
  content,
  onChange,
  fontSize,
  fontFamilyId,
  readOnly = false,
  onEditorReady,
}: RichEditorProps) {
  // 跟踪 onEditorReady 和 onChange 避免 effect 重跑 / 闭包陈旧
  const readyRef = useRef(onEditorReady);
  readyRef.current = onEditorReady;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 用 lowlight 替代
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Mathematics.configure({
        katexOptions: { throwOnError: false },
      }),
    ],
    content: parseContent(content),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChangeRef.current(JSON.stringify(editor.getJSON()));
    },
  });

  // 暴露 editor 实例
  useEffect(() => {
    readyRef.current?.(editor);
    return () => readyRef.current?.(null);
  }, [editor]);

  // 响应外部 readOnly 变化
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) return null;

  const currentFont = getFont(fontFamilyId);

  return (
    <div
      className="w-full"
      style={{
        fontFamily: currentFont.family,
        fontSize: `${fontSize}px`,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
