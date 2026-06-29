"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

// ─── Monaco dynamic import (SSR devre dışı) ──────────────────
// @ts-ignore — paket runtime'da yüklenecek
const MonacoEditor = dynamic(
  // @ts-ignore
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e1a",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "monospace",
          fontSize: "13px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(99,102,241,0.25)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 8px",
            }}
          />
          Monaco yükleniyor...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    ),
  }
);

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
  theme?: "vs-dark" | "hc-black";
}

// ─── Monaco Python Tema Tanımı ────────────────────────────────
function defineMonacoTheme(monaco: any) {
  monaco.editor.defineTheme("pythonDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c084fc", fontStyle: "bold" },
      { token: "string", foreground: "86efac" },
      { token: "number", foreground: "fbbf24" },
      { token: "comment", foreground: "71717a", fontStyle: "italic" },
      { token: "type", foreground: "60a5fa" },
      { token: "function", foreground: "f472b6" },
      { token: "variable", foreground: "e4e4e7" },
    ],
    colors: {
      "editor.background": "#0a0e1a",
      "editor.foreground": "#e4e4e7",
      "editorLineNumber.foreground": "#3f3f46",
      "editorLineNumber.activeForeground": "#a1a1aa",
      "editor.selectionBackground": "#fbbf2440",
      "editor.lineHighlightBackground": "#1e293b40",
      "editorCursor.foreground": "#fbbf24",
      "editorIndentGuide.background": "#1e293b",
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// ─── CodeEditorMonaco Component ───────────────────────────────
// ═══════════════════════════════════════════════════════════════
export const CodeEditorMonaco = forwardRef<CodeEditorRef, Props>(
  function CodeEditorMonaco(
    {
      value,
      onChange,
      language = "python",
      height = "100%",
      readOnly = false,
      theme = "vs-dark",
    },
    ref
  ) {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    // ── Imperative API (Editor.tsx ile uyumlu) ────────────────
    useImperativeHandle(
      ref,
      () => ({
        getValue: () => editorRef.current?.getValue() ?? value,
        setValue: (v: string) => {
          if (editorRef.current && editorRef.current.getValue() !== v) {
            editorRef.current.setValue(v);
          }
          onChange(v);
        },
        focus: () => editorRef.current?.focus(),
      }),
      [value, onChange]
    );

    // ── Editor mount handler ──────────────────────────────────
    const handleEditorDidMount = (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Dark theme tanımla
      defineMonacoTheme(monaco);
      monaco.editor.setTheme("pythonDark");

      // Python LSP özellikleri (opsiyonel)
      monaco.languages.registerCompletionItemProvider("python", {
        provideCompletionItems: () => {
          const suggestions = [
            "def", "class", "return", "if", "elif", "else",
            "for", "while", "import", "from", "as", "try", "except",
            "with", "lambda", "yield", "in", "is", "not", "and", "or",
            "True", "False", "None", "print", "len", "range", "enumerate",
            "zip", "map", "filter", "sorted", "sum", "min", "max",
          ].map((kw) => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
          }));
          return { suggestions };
        },
      });

      // Klavye kısayolları
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        (e: any) => e.preventDefault() // Save engelle (browser dialog)
      );

      // Focus
      editor.focus();

      setIsReady(true);
    };

    // ── Options ───────────────────────────────────────────────
    const options = {
      fontSize: 18,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      lineHeight: 1.55,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "off" as const,
      lineNumbers: "on" as const,
      glyphMargin: false,
      folding: true,
      renderLineHighlight: "line" as const,
      scrollbar: {
        vertical: "visible" as const,
        horizontal: "visible" as const,
        useShadows: false,
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      padding: { top: 12, bottom: 12 },
      readOnly,
      cursorBlinking: "smooth" as const,
      cursorSmoothCaretAnimation: "on" as const,
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: false,
      formatOnPaste: false,
      formatOnType: false,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
    };

    return (
      <div
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          overflow: "hidden",
          background: "#0a0e1a",
        }}
      >
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          options={options}
          onChange={(v: string | undefined) => onChange(v ?? "")}
          onMount={handleEditorDidMount}
          loading={
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0e1a",
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
              }}
            >
              Monaco yükleniyor...
            </div>
          }
        />
      </div>
    );
  }
);

// ─── Default Export (eski dosyalarla uyumluluk için) ─────────
export default CodeEditorMonaco;
