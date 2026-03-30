'use client';

import { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';

interface MathRendererProps {
  content: string;
}

const normalizeLatexContent = (value: string): string => {
  // Some SQL-seeded prompts store LaTeX as double-escaped text (e.g. \\begin, \\\\ row breaks).
  // In that case, collapse escaped slashes so KaTeX receives valid LaTeX commands.
  const looksDoubleEscaped = /\\\\[a-zA-Z]/.test(value) || /\\\\begin\{/.test(value);
  if (!looksDoubleEscaped) {
    return value;
  }

  return value.replace(/\\\\/g, '\\');
};

export default function MathRenderer({ content }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const normalizedContent = normalizeLatexContent(content);
    element.textContent = normalizedContent;

    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }, [content]);

  return <div ref={containerRef} />;
}
