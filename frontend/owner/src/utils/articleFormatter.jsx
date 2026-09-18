import React from 'react';

/**
 * Strips raw HTML markup tags from content string
 * so the editor textarea never displays literal HTML tags like <b>, <h3>, <p>.
 */
export function cleanHtmlToText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  
  let str = rawText;
  
  // Replace block closing tags and breaks with line breaks
  str = str.replace(/<\/(h[1-6]|p|div|li|blockquote)>/gi, '\n');
  str = str.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip remaining HTML tags
  str = str.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  str = str.replace(/&nbsp;/gi, ' ')
           .replace(/&amp;/gi, '&')
           .replace(/&lt;/gi, '<')
           .replace(/&gt;/gi, '>')
           .replace(/&quot;/gi, '"');
           
  // Normalize multiple blank lines to double newlines
  str = str.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  return str.trim();
}

/**
 * Format inline text for markdown-style **bold** and *italic*
 */
function formatInlineMarkdown(text) {
  if (!text) return '';

  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-gray-800">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Renders structured content according to standard article layout rules (Tiêu chuẩn bài viết)
 * without ever exposing raw HTML tags like <b>, <h3> to the user.
 */
export function ArticleContentDisplay({ content }) {
  if (!content || typeof content !== 'string') return null;

  const cleanText = cleanHtmlToText(content);
  if (!cleanText.trim()) return null;

  const blocks = cleanText.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed font-normal">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading lines: starts with # or ends with : or short uppercase title line
        const isHeaderTag = trimmed.startsWith('#') || (trimmed.length < 120 && trimmed.endsWith(':')) || /^[A-Z0-9\s\-\.\,\!\?\:\–]{8,90}$/.test(trimmed);

        if (isHeaderTag) {
          const headingText = trimmed.replace(/^#+\s*/, '').replace(/[\*\_]/g, '');
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-gray-900 mt-5 mb-2.5 flex items-center gap-2 border-l-4 border-brand-orange pl-3 py-0.5 bg-brand-orange/5 rounded-r-lg"
            >
              {headingText}
            </h3>
          );
        }

        // Bulleted / Numbered lists
        const lines = trimmed.split('\n');
        const isList = lines.length > 1 && lines.every(line => /^\s*[\-\*\•\d\.]\s+/.test(line));

        if (isList) {
          return (
            <ul key={idx} className="space-y-2 my-3 pl-2 bg-surface-subtle p-3 rounded-xl border border-border-subtle-medium">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*[\-\*\•\d\.]\s+/, '').trim();
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs text-gray-800 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
                    <span>{formatInlineMarkdown(itemText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph block
        return (
          <p key={idx} className="leading-relaxed text-gray-800 text-xs sm:text-sm">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInlineMarkdown(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
