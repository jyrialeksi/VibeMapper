import { useEffect, useRef, type TextareaHTMLAttributes } from 'react';

interface AutoExpandTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export function AutoExpandTextarea({
  minRows = 1,
  maxRows = 10,
  value,
  onChange,
  className = '',
  ...props
}: AutoExpandTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={minRows}
      className={`resize-none ${className}`}
      {...props}
    />
  );
}
