"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";

// ─── Tip Tanımları ─────────────────────────────────────────────
export interface CodeEditorRef {
  getValue: () => string;
  setValue: (v: string) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  language?: "python" | "javascript" | "typescript";
  height?: string | number;
  readOnly?: boolean;
}

// ─── Python Keyword Listesi (Prism yerine lightweight regex) ───
const PY_KEYWORDS = /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|pass|break|continue|in|is|not|and|or|lambda|yield|global|nonlocal|None|True|False)\b/g;
const PY_BUILTINS = /\b(print|len|range|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|int|float|str|list|dict|tuple|set|bool|type|isinstance|input|open)\b/g;
const PY_STRINGS = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
const PY_NUMBERS = /\b\d+(\.\d+)?\b/g;
const PY_COMMENTS = /#[^\n]*/g;
const PY_FUNCTIONS = /(?<=\bdef\s)\w+/g;

// ─── Token Highlighter ─────────────────────────────────────────
function highlightPython(code: string): string {
  // Escape HTML first
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Order matters: strings/comments first to protect from keyword highlighting
  const placeholders: string[] = [];

  const stash = (match: string, type: string): string => {
    const idx = placeholders.length;
    placeholders.push(`<span class="tok-${type}">${match}</span>`);
    return `\x00${idx}\x00`;
  };

  // 1. Strings (tek/çift/üç tırnak)
  html = html.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => stash(m, "string"));

  // 2. Comments
  html = html.replace(/#[^\n]*/g, (m) => stash(m, "comment"));

  // 3. Keywords
  html = html.replace(PY_KEYWORDS, '<span class="tok-keyword">$1</span>');

  // 4. Builtins
  html = html.replace(PY_BUILTINS, '<span class="tok-builtin">$1</span>');

  // 5. Numbers
  html = html.replace(PY_NUMBERS, '<span class="tok-number">$&</span>');

  // 6. Function names after def
  html = html.replace(/(<span class="tok-keyword">def<\/span>\s+)(\w+)/g, '$1<span class="tok-function">$2</span>');

  // Restore stashed strings/comments
  html = html.replace(/\x00(\d+)\x00/g, (_, idx) => placeholders[parseInt(idx)]);

  return html;
}

// ─── Tab Insertion Helper ──────────────────────────────────────
function insertTab(textarea: HTMLTextAreaElement): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.substring(0, start) + "  " + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + 2;

  // Trigger React onChange
  const event = new Event("input", { bubbles: true });
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  nativeSetter?.call(textarea, textarea.value);
  textarea.dispatchEvent(event);
}

// ═══════════════════════════════════════════════════════════════
// ─── CodeEditor Component ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export const CodeEditor = forwardRef<CodeEditorRef, Props>(function CodeEditor(
  { value, onChange, language = "python", height = "100%", readOnly = false },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState("");

  // ── Imperative API ──────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    getValue: () => textareaRef.current?.value ?? value,
    setValue: (v: string) => {
      if (textareaRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(textareaRef.current, v);
        textareaRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
      onChange(v);
    },
    focus: () => textareaRef.current?.focus(),
  }));

  // ── Highlight on value change ───────────────────────────────
  useEffect(() => {
    if (language === "python") {
      setHighlighted(highlightPython(value));
    } else {
      setHighlighted(value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  }, [value, language]);

  // ── Sync scroll: textarea ↔ highlight ↔ line numbers ───────
  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    const ln = lineNumbersRef.current;
    if (!ta || !pre) return;

    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    if (ln) ln.scrollTop = ta.scrollTop;
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;

      // Tab → 2 spaces
      if (e.key === "Tab") {
        e.preventDefault();
        insertTab(ta);
        return;
      }

      // Ctrl/Cmd + / → toggle line comment
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const value = ta.value;
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const realEnd = lineEnd === -1 ? value.length : lineEnd;
        const lines = value.substring(lineStart, realEnd).split("\n");

        const allCommented = lines.every((l) => l.trimStart().startsWith("#"));
        const newLines = lines.map((l) =>
          allCommented ? l.replace(/^(\s*)#\s?/, "$1") : `# ${l}`
        );
        const newText = newLines.join("\n");

        ta.value = value.substring(0, lineStart) + newText + value.substring(realEnd);
        const event = new Event("input", { bubbles: true });
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(ta, ta.value);
        ta.dispatchEvent(event);
        return;
      }

      // Auto-close brackets/quotes
      const pairs: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
        '"': '"',
        "'": "'",
      };
      if (pairs[e.key]) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start !== end) {
          // Wrap selection
          e.preventDefault();
          const selected = ta.value.substring(start, end);
          ta.value = ta.value.substring(0, start) + e.key + selected + pairs[e.key] + ta.value.substring(end);
          ta.selectionStart = start + 1;
          ta.selectionEnd = end + 1;
          const event = new Event("input", { bubbles: true });
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
          )?.set;
          nativeSetter?.call(ta, ta.value);
          ta.dispatchEvent(event);
        }
      }
    },
    []
  );

  // ── Line numbers ────────────────────────────────────────────
  const lineCount = value.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Inline styles for syntax tokens */}
      <style jsx>{`
        .editor-container {
          position: relative;
          height: ${typeof height === "number" ? `${height}px` : height};
          background: #0a0e1a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.55;
        }
        .editor-inner {
          position: relative;
          height: 100%;
          display: flex;
          overflow: hidden;
        }
        .line-numbers {
          padding: 12px 8px 12px 12px;
          background: rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.25);
          text-align: right;
          user-select: none;
          font-variant-numeric: tabular-nums;
          font-size: 11px;
          min-width: 38px;
          overflow: hidden;
          white-space: pre;
          border-right: 1px solid rgba(255, 255, 255, 0.04);
        }
        .editor-scroll {
          position: relative;
          flex: 1;
          overflow: hidden;
        }
        .editor-pre,
        .editor-textarea {
          position: absolute;
          inset: 0;
          margin: 0;
          padding: 12px 14px;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          white-space: pre;
          word-wrap: normal;
          overflow: auto;
          tab-size: 2;
          border: 0;
          outline: 0;
        }
        .editor-pre {
          pointer-events: none;
          color: #e4e4e7;
        }
        .editor-textarea {
          color: transparent;
          caret-color: #fbbf24;
          background: transparent;
          resize: none;
          z-index: 2;
        }
        .editor-textarea::selection {
          background: rgba(251, 191, 36, 0.25);
          color: transparent;
        }
        .tok-keyword { color: #c084fc; font-weight: 600; }
        .tok-builtin { color: #60a5fa; }
        .tok-string  { color: #86efac; }
        .tok-number  { color: #fbbf24; }
        .tok-comment { color: #71717a; font-style: italic; }
        .tok-function { color: #f472b6; font-weight: 500; }
      `}</style>

      <div ref={containerRef} className="editor-container">
        <div className="editor-inner">
          {/* Line numbers */}
          <div ref={lineNumbersRef} className="line-numbers">
            {lineNumbers}
          </div>

          {/* Highlighted layer + Textarea */}
          <div className="editor-scroll">
            <pre
              ref={preRef}
              className="editor-pre"
              dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
            />
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              wrap="off"
            />
          </div>
        </div>
      </div>
    </>
  );
});
