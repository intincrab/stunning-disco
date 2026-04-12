"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { LatexPreview } from "@/components/editor/latex-preview";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { CommitDialog } from "@/components/editor/commit-dialog";
import { HistorySidebar } from "@/components/editor/history-sidebar";
import { ChatPanel, type ChatMessage } from "@/components/editor/chat-panel";
import { useResume } from "@/hooks/use-resume";
import { useCommits } from "@/hooks/use-commits";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCommit, ClockCounterClockwise, FloppyDisk, ChatCircle } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import type { Commit } from "@/types";

const MonacoEditor = dynamic(
  () => import("@/components/editor/monaco-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[var(--surface-bg)] animate-pulse flex items-center justify-center">
        <span className="text-[var(--surface-text-muted)] text-sm">Loading editor...</span>
      </div>
    ),
  }
);

interface PendingChange {
  original: string;
  proposed: string;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { resume, latestCommit, commitCount, loading, stash, popStash, refetch } = useResume(id);
  const { commits, loading: commitsLoading, createCommit, refetch: refetchCommits } = useCommits(id);
  const [source, setSource] = useState("");
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [compileKey, setCompileKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Chat panel state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  // Resizable editor/preview panels
  const [panelWidth, setPanelWidth] = useState(40);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resizable history sidebar
  const [historyWidth, setHistoryWidth] = useState(280);
  const isHistoryDragging = useRef(false);

  // Word / character count
  const wordCount = useMemo(() => {
    const text = source
      .replace(/\\[a-zA-Z]+(\{[^}]*\})*/g, " ")
      .replace(/[{}\\%$#&_^~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return { words: 0, chars: 0 };
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
    };
  }, [source]);

  // Initialize source from latest commit
  useEffect(() => {
    if (latestCommit && !initialized) {
      setSource(latestCommit.latex_source);
      setInitialized(true);
    }
  }, [latestCommit, initialized]);

  // Auto-save draft every 30s
  useEffect(() => {
    if (!initialized || !id) return;
    const interval = setInterval(async () => {
      await supabase
        .from("resumes")
        .update({ stash_content: `__draft__${source}` })
        .eq("id", id);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, [source, initialized, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        setCommitDialogOpen(true);
      } else if (mod && e.key === "s" && e.shiftKey) {
        e.preventDefault();
        handleStash();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [source]);

  // Editor/preview resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // History sidebar resize
  const handleHistoryMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isHistoryDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        setPanelWidth(Math.min(80, Math.max(20, percent)));
      }
      if (isHistoryDragging.current) {
        const fromRight = window.innerWidth - e.clientX;
        setHistoryWidth(Math.min(500, Math.max(200, fromRight)));
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      isHistoryDragging.current = false;
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
    await refetchCommits();
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
      const content = stashContent.startsWith("__draft__")
        ? stashContent.slice(9)
        : stashContent;
      setSource(content);
    }
  }, [popStash]);

  const handleExportPdf = () => window.print();

  const handleExportDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");

    let text = source;
    const docMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (docMatch) text = docMatch[1];

    text = text.replace(/%.*$/gm, "");

    const paragraphs: typeof Paragraph.prototype[] = [];
    const lines = text.split(/\n\n+/);

    for (const line of lines) {
      let cleaned = line.trim();
      if (!cleaned) continue;

      const sectionMatch = cleaned.match(/\\section\*?\{([^}]*)\}/);
      if (sectionMatch) {
        paragraphs.push(
          new Paragraph({
            text: sectionMatch[1].replace(/\\[a-zA-Z]+/g, ""),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
        continue;
      }

      const subsectionMatch = cleaned.match(/\\subsection\*?\{([^}]*)\}/);
      if (subsectionMatch) {
        paragraphs.push(
          new Paragraph({
            text: subsectionMatch[1].replace(/\\[a-zA-Z]+/g, ""),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        continue;
      }

      cleaned = cleaned
        .replace(/\\textbf\{([^}]*)\}/g, "$1")
        .replace(/\\textit\{([^}]*)\}/g, "$1")
        .replace(/\\emph\{([^}]*)\}/g, "$1")
        .replace(/\\underline\{([^}]*)\}/g, "$1")
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
        .replace(/\\item\s*/g, "• ")
        .replace(/\\begin\{[^}]*\}(\[.*?\])?/g, "")
        .replace(/\\end\{[^}]*\}/g, "")
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
        .replace(/\\[a-zA-Z]+/g, "")
        .replace(/[{}]/g, "")
        .replace(/\\\\/g, "\n")
        .replace(/\s+/g, " ")
        .trim();

      if (cleaned) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: cleaned, size: 22 })],
            spacing: { after: 80 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${resume?.name || "resume"}.docx`);
  };

  const handleCompile = () => setCompileKey((k) => k + 1);

  const handleRestore = async (commit: Commit) => {
    setRestoringId(commit.id);
    const hash = commit.id.slice(0, 7);
    await createCommit(`Restored to ${hash}`, commit.latex_source);
    setSource(commit.latex_source);
    setRestoringId(null);
    await refetch();
    await refetchCommits();
  };

  const handleCompare = (a: string, b: string) => {
    router.push(`/resume/${id}/diff?a=${a}&b=${b}`);
  };

  const handleToggleHistory = () => {
    if (!showHistory) refetchCommits();
    setShowHistory(!showHistory);
  };

  // Chat handlers
  const handleChatSend = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = {
        id: `${Date.now()}-user`,
        role: "user",
        content: message,
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);

      try {
        const res = await fetch("/api/chat-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latex: source, message }),
        });

        const data = await res.json() as { explanation?: string; latex?: string; error?: string };

        if (!res.ok || data.error) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-err`,
              role: "assistant",
              content: `Error: ${data.error ?? "Something went wrong. Please try again."}`,
            },
          ]);
          return;
        }

        if (data.explanation && data.latex) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-ai`,
              role: "assistant",
              content: data.explanation!,
            },
          ]);
          setPendingChange({ original: source, proposed: data.latex! });
        }
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-err`,
            role: "assistant",
            content: "Network error. Please check your connection and try again.",
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [source]
  );

  const handleAccept = useCallback(() => {
    if (!pendingChange) return;
    setSource(pendingChange.proposed);
    setPendingChange(null);
    setCompileKey((k) => k + 1);
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-sys`, role: "assistant", content: "Changes applied." },
    ]);
  }, [pendingChange]);

  const handleReject = useCallback(() => {
    setPendingChange(null);
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-sys`, role: "assistant", content: "Changes discarded." },
    ]);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[var(--surface-bg)] flex flex-col">
        <Header />
        <div className="p-4 space-y-4 flex-1">
          <Skeleton className="h-10 bg-[var(--surface-card)]" />
          <Skeleton className="h-[calc(100vh-10rem)] bg-[var(--surface-card)]" />
        </div>
      </div>
    );
  }

  const hasRealStash = resume?.stash_content
    ? !resume.stash_content.startsWith("__draft__")
    : false;

  // The preview renders proposed latex when in diff mode, so the user sees the visual output
  const previewSource = pendingChange ? pendingChange.proposed : source;

  return (
    <div className="h-screen flex flex-col bg-[var(--surface-bg)] overflow-hidden">
      <Header />
      <EditorToolbar
        resumeId={id}
        hasStash={hasRealStash}
        onCommit={() => setCommitDialogOpen(true)}
        onStash={handleStash}
        onPopStash={handlePopStash}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        onCompile={handleCompile}
        onToggleHistory={handleToggleHistory}
        showHistory={showHistory}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat sidebar (toggle strip + panel) */}
        <div
          className="h-full bg-[#0d1117] border-r border-[var(--surface-border)] flex flex-row flex-shrink-0 transition-[width] duration-200"
          style={{ width: showChat ? "30%" : "36px" }}
        >
          {/* Toggle button strip — always visible on the far left */}
          <div className="w-9 flex flex-col items-center pt-3 flex-shrink-0">
            <button
              onClick={() => setShowChat((v) => !v)}
              title={showChat ? "Close AI Chat" : "Open AI Chat"}
              className={`p-1.5 rounded-md transition-colors ${
                showChat
                  ? "text-[var(--accent-color)] bg-[#0f2a1e]"
                  : "text-[var(--surface-text-muted)] hover:text-[var(--surface-text)] hover:bg-[var(--surface-card)]"
              }`}
            >
              <ChatCircle size={18} weight={showChat ? "fill" : "regular"} />
            </button>
          </div>

          {/* Chat panel content — visible when open */}
          {showChat && (
            <div className="flex-1 min-w-0 border-l border-[#21262d] overflow-hidden">
              <ChatPanel
                messages={chatMessages}
                loading={chatLoading}
                hasPendingChange={pendingChange !== null}
                onSend={handleChatSend}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </div>
          )}
        </div>

        {/* Main editor + preview area */}
        <div
          ref={containerRef}
          className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0"
        >
          {/* Monaco Editor (normal) or DiffEditor (when change pending) */}
          <div
            className="w-full h-[50vh] md:h-full border-b md:border-b-0 border-[var(--surface-border)]"
            style={{ flex: `0 0 ${panelWidth}%` }}
          >
            <MonacoEditor
              value={source}
              onChange={setSource}
              pendingChange={pendingChange}
            />
          </div>

          {/* Resize Handle */}
          <div
            className="hidden md:flex items-center justify-center w-[6px] cursor-col-resize bg-[var(--surface-border)] hover:bg-[var(--accent-color)] active:bg-[var(--accent-color)] transition-colors group flex-shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="w-[2px] h-8 rounded-full bg-[var(--surface-text-muted)] group-hover:bg-white group-active:bg-white transition-colors" />
          </div>

          {/* LaTeX Preview — always shows proposed version when diff mode is active */}
          <div className="w-full h-[50vh] md:h-full overflow-auto bg-white flex-1 relative">
            {pendingChange && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-100 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-300 shadow-sm pointer-events-none">
                Previewing proposed changes
              </div>
            )}
            <LatexPreview key={compileKey} source={previewSource} />
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <>
            <div
              className="hidden md:flex items-center justify-center w-[6px] cursor-col-resize bg-[var(--surface-border)] hover:bg-[var(--accent-color)] active:bg-[var(--accent-color)] transition-colors group flex-shrink-0"
              onMouseDown={handleHistoryMouseDown}
            >
              <div className="w-[2px] h-8 rounded-full bg-[var(--surface-text-muted)] group-hover:bg-white group-active:bg-white transition-colors" />
            </div>
            <div
              className="h-full shrink-0"
              style={{ width: historyWidth }}
            >
              <HistorySidebar
                commits={commits}
                loading={commitsLoading}
                onRestore={handleRestore}
                onCompare={handleCompare}
                onClose={() => setShowHistory(false)}
                restoringId={restoringId}
                resumeId={id}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="h-8 bg-[var(--surface-card)] border-t border-[var(--surface-border)] flex items-center px-4 text-xs text-[var(--surface-text-secondary)] gap-4 shrink-0">
        <span className="font-medium text-[var(--surface-text)]">{resume?.name}</span>
        <span className="flex items-center gap-1">
          <GitCommit size={12} />
          {commitCount} commit{commitCount !== 1 ? "s" : ""}
        </span>
        {latestCommit && (
          <span className="truncate max-w-[200px]">
            Last: {latestCommit.message}
          </span>
        )}
        {draftSaved && (
          <span className="flex items-center gap-1 text-[var(--accent-color)]">
            <FloppyDisk size={12} />
            Draft saved
          </span>
        )}
        {pendingChange && (
          <span className="flex items-center gap-1 text-amber-400">
            Diff mode — pending review
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[var(--surface-text-muted)]">
          {wordCount.words} words &middot; {wordCount.chars} chars
        </span>
        <button
          onClick={handleToggleHistory}
          className="flex items-center gap-1 hover:text-[var(--surface-text)] transition-colors"
        >
          <ClockCounterClockwise size={12} />
          History
        </button>
      </div>

      <CommitDialog
        open={commitDialogOpen}
        onOpenChange={setCommitDialogOpen}
        onCommit={handleCommit}
      />
    </div>
  );
}
