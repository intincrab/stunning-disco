"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  ArrowCounterClockwise,
  GitDiff,
  GitCommit as GitCommitIcon,
} from "@phosphor-icons/react";
import type { Commit } from "@/types";

interface HistorySidebarProps {
  commits: Commit[];
  loading: boolean;
  onRestore: (commit: Commit) => void;
  onCompare: (a: string, b: string) => void;
  onClose: () => void;
  restoringId: string | null;
  resumeId: string;
}

export function HistorySidebar({
  commits,
  loading,
  onRestore,
  onCompare,
  onClose,
  restoringId,
}: HistorySidebarProps) {
  const [diffA, setDiffA] = useState("");
  const [diffB, setDiffB] = useState("");

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Click a commit → diff it against the previous commit
  const handleCommitClick = (index: number) => {
    if (index < commits.length - 1) {
      // Compare this commit with the one before it
      onCompare(commits[index + 1].id, commits[index].id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--surface-card)] border-l border-[var(--surface-border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-[var(--surface-border)] shrink-0">
        <span className="text-sm font-medium text-[var(--surface-text)]">History</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]"
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Diff Picker */}
      <div className="px-3 py-2 border-b border-[var(--surface-border)] space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <Select value={diffA} onValueChange={setDiffA}>
            <SelectTrigger className="h-7 text-xs bg-[var(--surface-bg)] border-[var(--surface-border)] flex-1">
              <SelectValue placeholder="Commit A" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--surface-card)] border-[var(--surface-border)]">
              {commits.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  <span className="font-mono text-[var(--accent-color)]">{c.id.slice(0, 7)}</span>
                  <span className="ml-1">{c.message}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] text-[var(--surface-text-muted)]">vs</span>
          <Select value={diffB} onValueChange={setDiffB}>
            <SelectTrigger className="h-7 text-xs bg-[var(--surface-bg)] border-[var(--surface-border)] flex-1">
              <SelectValue placeholder="Commit B" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--surface-card)] border-[var(--surface-border)]">
              {commits.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  <span className="font-mono text-[var(--accent-color)]">{c.id.slice(0, 7)}</span>
                  <span className="ml-1">{c.message}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => onCompare(diffA, diffB)}
          disabled={!diffA || !diffB || diffA === diffB}
          size="sm"
          className="h-7 w-full text-xs gap-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[#171717]"
        >
          <GitDiff size={12} />
          Compare
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 bg-[var(--surface-border)]" />
              ))}
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-8">
              <GitCommitIcon size={24} className="mx-auto text-[var(--surface-border)] mb-2" />
              <p className="text-xs text-[var(--surface-text-secondary)]">No commits yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[var(--surface-border)]" />
              <div className="space-y-0">
                {commits.map((commit, index) => (
                  <div
                    key={commit.id}
                    className="relative flex items-start gap-3 py-2 cursor-pointer hover:bg-[var(--surface-bg)] rounded-md px-1 transition-colors"
                    onClick={() => handleCommitClick(index)}
                    title={index < commits.length - 1 ? "Click to view diff for this commit" : "First commit"}
                  >
                    <div className="relative z-10 w-4 flex-shrink-0 flex justify-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 mt-1 ${
                          index === 0
                            ? "bg-[var(--accent-color)] border-[var(--accent-color)]"
                            : "bg-[var(--surface-bg)] border-[var(--surface-text-muted)]"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] px-1 py-0 bg-[var(--surface-border)] text-[var(--accent-color)] border-0"
                        >
                          {commit.id.slice(0, 7)}
                        </Badge>
                        {index < commits.length - 1 && (
                          <GitDiff size={10} className="text-[var(--surface-text-muted)]" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--surface-text)] truncate">{commit.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[var(--surface-text-muted)]">
                          {formatDate(commit.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestore(commit);
                          }}
                          disabled={restoringId === commit.id}
                        >
                          <ArrowCounterClockwise size={10} className="mr-0.5" />
                          {restoringId === commit.id ? "..." : "Restore"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
