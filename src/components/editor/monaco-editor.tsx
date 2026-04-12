"use client";

import Editor, { DiffEditor, type Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  pendingChange?: { original: string; proposed: string } | null;
}

const LATEX_THEME_NAME = "resumegit-dark";

function registerLatexLanguage(monaco: Monaco) {
  monaco.editor.defineTheme(LATEX_THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "3ECF8E" },
      { token: "comment", foreground: "a1a1a1" },
      { token: "string", foreground: "7ee0b2" },
    ],
    colors: {
      "editor.background": "#171717",
      "editor.lineHighlightBackground": "#1c1c1c55",
      "editorLineNumber.foreground": "#6b6b6b",
      "editorLineNumber.activeForeground": "#ededed",
      "editorGutter.background": "#171717",
    },
  });

  if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === "latex")) {
    monaco.languages.register({ id: "latex" });
    monaco.languages.setMonarchTokensProvider("latex", {
      tokenizer: {
        root: [
          [/%.*$/, "comment"],
          [/\\[a-zA-Z@]+/, "keyword"],
          [/[{}]/, "delimiter.bracket"],
          [/\$\$?/, "string"],
          [/\\[\\\[\]()$&%#_{}~^]/, "keyword"],
        ],
      },
    });
  }
}

const editorOptions = {
  fontSize: 14,
  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
  minimap: { enabled: false },
  lineNumbers: "on" as const,
  wordWrap: "on" as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 12 },
  renderWhitespace: "none" as const,
  bracketPairColorization: { enabled: true },
};

export default function MonacoLatexEditor({ value, onChange, pendingChange }: MonacoEditorProps) {
  if (pendingChange) {
    return (
      <DiffEditor
        height="100%"
        language="latex"
        theme={LATEX_THEME_NAME}
        original={pendingChange.original}
        modified={pendingChange.proposed}
        options={{
          ...editorOptions,
          readOnly: true,
          renderSideBySide: true,
          enableSplitViewResizing: true,
        }}
        beforeMount={registerLatexLanguage}
        onMount={(_editor, monaco) => {
          monaco.editor.setTheme(LATEX_THEME_NAME);
        }}
      />
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="latex"
      language="latex"
      theme={LATEX_THEME_NAME}
      value={value}
      onChange={(v) => onChange(v || "")}
      options={editorOptions}
      beforeMount={registerLatexLanguage}
      onMount={(_editor, monaco) => {
        monaco.editor.setTheme(LATEX_THEME_NAME);
      }}
    />
  );
}
