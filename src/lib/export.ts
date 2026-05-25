/**
 * 导出工具 — 将 TipTap JSON 内容转换为各种格式
 */

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

/** 从 TipTap JSON 递归提取纯文本 */
function extractText(node: TipTapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractText).join('');
}

/** TipTap JSON → 纯文本 */
export function toPlainText(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr) as TipTapNode;
    if (!doc.content) return '';
    return doc.content.map(block => {
      const text = extractText(block);
      // 块级元素后加换行
      if (['paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem'].includes(block.type)) {
        return text + '\n\n';
      }
      // 列表项特殊处理
      if (block.type === 'listItem') {
        return text + '\n';
      }
      return text + '\n';
    }).join('').trim();
  } catch {
    return jsonStr;
  }
}

/** TipTap JSON → HTML */
export function toHtml(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr) as TipTapNode;
    const bodyHtml = renderNode(doc);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported Document</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
  img { max-width: 100%; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; }
  blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  } catch {
    return jsonStr;
  }
}

function renderNode(node: TipTapNode): string {
  if (!node) return '';

  // 文本节点
  if (node.type === 'text') {
    let text = escapeHtml(node.text || '');
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold': text = `<strong>${text}</strong>`; break;
          case 'italic': text = `<em>${text}</em>`; break;
          case 'underline': text = `<u>${text}</u>`; break;
          case 'strike': text = `<s>${text}</s>`; break;
          case 'code': text = `<code>${text}</code>`; break;
          case 'link': text = `<a href="${escapeHtml(String(mark.attrs?.href || ''))}">${text}</a>`; break;
          case 'highlight': text = `<mark>${text}</mark>`; break;
        }
      }
    }
    return text;
  }

  // 内联内容
  const inner = node.content ? node.content.map(renderNode).join('') : '';

  // 块级节点
  switch (node.type) {
    case 'doc': return inner;
    case 'paragraph': return `<p>${inner}</p>\n`;
    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      return `<h${level}>${inner}</h${level}>\n`;
    }
    case 'bulletList': return `<ul>\n${inner}</ul>\n`;
    case 'orderedList': return `<ol>\n${inner}</ol>\n`;
    case 'listItem': return `  <li>${inner}</li>\n`;
    case 'blockquote': return `<blockquote>${inner}</blockquote>\n`;
    case 'codeBlock': {
      const lang = node.attrs?.language ? ` class="language-${escapeHtml(String(node.attrs.language))}"` : '';
      return `<pre><code${lang}>${escapeHtml(extractText(node))}</code></pre>\n`;
    }
    case 'horizontalRule': return '<hr>\n';
    case 'image': {
      const src = escapeHtml(String(node.attrs?.src || ''));
      const alt = escapeHtml(String(node.attrs?.alt || ''));
      return `<img src="${src}" alt="${alt}">\n`;
    }
    case 'table': return `<table>\n${inner}</table>\n`;
    case 'tableRow': return `  <tr>\n${inner}  </tr>\n`;
    case 'tableCell': return `    <td>${inner}</td>\n`;
    case 'tableHeader': return `    <th>${inner}</th>\n`;
    case 'hardBreak': return '<br>';
    default: {
      // 未知节点 — 尝试渲染子节点
      if (node.content) return inner;
      return '';
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** TipTap JSON → Markdown */
export function toMarkdown(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr) as TipTapNode;
    if (!doc.content) return '';
    return doc.content.map(renderMdBlock).join('\n').trim() + '\n';
  } catch {
    return jsonStr;
  }
}

function renderMdBlock(node: TipTapNode): string {
  if (!node) return '';

  const inner = node.content ? node.content.map(n => renderMdInline(n)).join('') : '';
  const prefix = mdListPrefix(node);

  switch (node.type) {
    case 'doc': return (node.content || []).map(renderMdBlock).join('\n\n');
    case 'paragraph': return prefix + inner;
    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      return prefix + '#'.repeat(level) + ' ' + inner;
    }
    case 'bulletList': return (node.content || []).map(renderMdBlock).join('\n');
    case 'orderedList': {
      let i = (node.attrs?.start as number) || 1;
      return (node.content || []).map(item => {
        const result = `  ${i}. ${mdListPrefix(item)}${item.content ? item.content.map(n => renderMdInline(n)).join('') : ''}`;
        i++;
        return result;
      }).join('\n');
    }
    case 'listItem': return (node.content || []).map(renderMdBlock).join('\n');
    case 'blockquote': return '> ' + inner;
    case 'codeBlock': {
      const lang = node.attrs?.language ? String(node.attrs.language) : '';
      return '```' + lang + '\n' + extractText(node) + '\n```';
    }
    case 'horizontalRule': return '---';
    case 'image': return `![${node.attrs?.alt || ''}](${node.attrs?.src || ''})`;
    case 'hardBreak': return '\n';
    default: return inner;
  }
}

function mdListPrefix(node: TipTapNode): string {
  // 列表项的子段落需要缩进
  if (node.type === 'paragraph') {
    // 检查父级是否在列表中
    return '';
  }
  return '';
}

function renderMdInline(node: TipTapNode): string {
  if (!node) return '';
  if (node.type === 'text') {
    let text = node.text || '';
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold': text = `**${text}**`; break;
          case 'italic': text = `*${text}*`; break;
          case 'code': text = `\`${text}\``; break;
          case 'strike': text = `~~${text}~~`; break;
          case 'link': text = `[${text}](${mark.attrs?.href || ''})`; break;
          case 'underline': text = `<u>${text}</u>`; break;
          case 'highlight': text = `==${text}==`; break;
        }
      }
    }
    return text;
  }
  if (node.content) return node.content.map(renderMdInline).join('');
  return '';
}

/** 完整的文档 JSON 导出 */
export function toJsonExport(doc: { id: string; title: string; subtitle: string; content: string; collection?: string }): string {
  return JSON.stringify({
    ...doc,
    content: JSON.parse(doc.content || '{}'),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
