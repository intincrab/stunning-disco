"use client";

import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MonacoLatexEditor({ value, onChange }: MonacoEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="latex"
      language="latex"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || "")}
      options={{
        fontSize: 14,
        fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
        minimap: { enabled: false },
        lineNumbers: "on",
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12 },
        renderWhitespace: "none",
        bracketPairColorization: { enabled: true },
      }}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("resumegit-dark", {
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
        if (!monaco.languages.getLanguages().some((l) => l.id === "latex")) {
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
      }}
      onMount={(editor, monaco) => {
        monaco.editor.setTheme("resumegit-dark");
      }}
    />
  );
}
