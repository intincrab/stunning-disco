"use client";

import { useMemo } from "react";
import { createPatch } from "diff";
import { html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldTitle?: string;
  newTitle?: string;
}

export function DiffViewer({ oldText, newText, oldTitle, newTitle }: DiffViewerProps) {
  const diffHtml = useMemo(() => {
    const patch = createPatch(
      "resume.tex",
      oldText,
      newText,
      oldTitle || "old",
      newTitle || "new"
    );
    return html(patch, {
      drawFileList: false,
      outputFormat: "side-by-side",
      matching: "lines",
    });
  }, [oldText, newText, oldTitle, newTitle]);

  return (
    <div className="border border-[var(--surface-border)] rounded-lg overflow-hidden">
      <div
        className="font-mono text-sm [&_.d2h-file-wrapper]:border-0"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    </div>
  );
}
