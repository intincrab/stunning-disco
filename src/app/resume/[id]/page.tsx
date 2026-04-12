"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { LatexPreview } from "@/components/editor/latex-preview";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { CommitDialog } from "@/components/editor/commit-dialog";
import { useResume } from "@/hooks/use-resume";
import { useCommits } from "@/hooks/use-commits";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCommit, ClockCounterClockwise } from "@phosphor-icons/react";
import Link from "next/link";

const MonacoEditor = dynamic(
  () => import("@/components/editor/monaco-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#171717] animate-pulse flex items-center justify-center">
        <span className="text-[#6b6b6b] text-sm">Loading editor...</span>
      </div>
    ),
  }
);

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;
  const { resume, latestCommit, commitCount, loading, stash, popStash, refetch } = useResume(id);
  const { createCommit } = useCommits(id);
  const [source, setSource] = useState("");
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [compileKey, setCompileKey] = useState(0);

  // Resizable panels
  const [panelWidth, setPanelWidth] = useState(40);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latestCommit && !initialized) {
      setSource(latestCommit.latex_source);
      setInitialized(true);
    }
  }, [latestCommit, initialized]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setPanelWidth(Math.min(80, Math.max(20, percent)));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleCommit = async (message: string) => {
    await createCommit(message, source);
    await refetch();
  };

  const handleStash = useCallback(async () => {
    const lastSource = await stash(source);
    if (lastSource !== undefined) {
      setSource(lastSource);
    }
  }, [source, stash]);

  const handlePopStash = useCallback(async () => {
    const stashContent = await popStash();
    if (stashContent) {
      setSource(stashContent);
    }
  }, [popStash]);

  const handleExportPdf = () => {
    window.print();
  };

  const handleCompile = () => {
    setCompileKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717]">
        <Header />
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 bg-[#1c1c1c]" />
          <Skeleton className="h-[calc(100vh-10rem)] bg-[#1c1c1c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171717]">
      <Header />
      <EditorToolbar
        resumeId={id}
        hasStash={!!resume?.stash_content}
        onCommit={() => setCommitDialogOpen(true)}
        onStash={handleStash}
        onPopStash={handlePopStash}
        onExportPdf={handleExportPdf}
        onCompile={handleCompile}
      />

      <div
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Monaco Editor - Left Panel */}
        <div
          className="w-full h-[50vh] md:h-[calc(100vh-7.5rem)] border-b md:border-b-0 border-[#2e2e2e]"
          style={{ width: undefined, flex: `0 0 ${panelWidth}%` }}
        >
          <div className="hidden md:block h-full" style={{ width: "100%" }}>
            <MonacoEditor value={source} onChange={setSource} />
          </div>
          <div className="md:hidden h-full">
            <MonacoEditor value={source} onChange={setSource} />
          </div>
        </div>

        {/* Resize Handle - Desktop only */}
        <div
          className="hidden md:flex items-center justify-center w-[6px] cursor-col-resize bg-[#2e2e2e] hover:bg-[#3ECF8E] active:bg-[#3ECF8E] transition-colors group flex-shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div className="w-[2px] h-8 rounded-full bg-[#6b6b6b] group-hover:bg-white group-active:bg-white transition-colors" />
        </div>

        {/* LaTeX Preview - Right Panel */}
        <div
          className="w-full h-[50vh] md:h-[calc(100vh-7.5rem)] overflow-auto bg-white flex-1"
        >
          <LatexPreview key={compileKey} source={source} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-8 bg-[#1c1c1c] border-t border-[#2e2e2e] flex items-center px-4 text-xs text-[#a1a1a1] gap-4 shrink-0">
        <span className="font-medium text-[#ededed]">{resume?.name}</span>
        <span className="flex items-center gap-1">
          <GitCommit size={12} />
          {commitCount} commit{commitCount !== 1 ? "s" : ""}
        </span>
        {latestCommit && (
          <span className="truncate max-w-[200px]">
            Last: {latestCommit.message}
          </span>
        )}
        <div className="flex-1" />
        <Link
          href={`/resume/${id}/history`}
          className="flex items-center gap-1 hover:text-[#ededed] transition-colors"
        >
          <ClockCounterClockwise size={12} />
          View History
        </Link>
      </div>

      <CommitDialog
        open={commitDialogOpen}
        onOpenChange={setCommitDialogOpen}
        onCommit={handleCommit}
      />
    </div>
  );
}
