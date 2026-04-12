"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  GitCommit,
  Archive,
  ArrowCounterClockwise,
  FilePdf,
  ClockCounterClockwise,
  Play,
  FileDoc,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface EditorToolbarProps {
  resumeId: string;
  hasStash: boolean;
  onCommit: () => void;
  onStash: () => void;
  onPopStash: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onCompile: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
}

export function EditorToolbar({
  hasStash,
  onCommit,
  onStash,
  onPopStash,
  onExportPdf,
  onExportDocx,
  onCompile,
  onToggleHistory,
  showHistory,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[var(--surface-card)] border-b border-[var(--surface-border)] shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[var(--surface-text)] hover:bg-[var(--surface-border)]"
            onClick={onCommit}
          >
            <GitCommit size={16} />
            <span className="hidden sm:inline">Commit</span>
            <kbd className="hidden lg:inline-flex items-center ml-1 text-[10px] text-[var(--surface-text-muted)] bg-[var(--surface-border)] px-1 rounded">
              Ctrl+S
            </kbd>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save a snapshot (Ctrl+S)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[var(--surface-text)] hover:bg-[var(--surface-border)]"
            onClick={onStash}
          >
            <Archive size={16} />
            <span className="hidden sm:inline">Stash</span>
            <kbd className="hidden lg:inline-flex items-center ml-1 text-[10px] text-[var(--surface-text-muted)] bg-[var(--surface-border)] px-1 rounded">
              Ctrl+Shift+S
            </kbd>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stash changes and revert (Ctrl+Shift+S)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[var(--surface-text)] hover:bg-[var(--surface-border)]"
            onClick={onPopStash}
            disabled={!hasStash}
          >
            <ArrowCounterClockwise size={16} />
            <span className="hidden sm:inline">Pop Stash</span>
            {hasStash && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-[var(--accent-color)]/20 text-[var(--accent-color)] border-0">
                1
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Restore stashed changes</TooltipContent>
      </Tooltip>

      <div className="w-px h-5 bg-[var(--surface-border)] mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[#171717] font-medium"
            onClick={onCompile}
          >
            <Play size={16} weight="fill" />
            <span className="hidden sm:inline">Compile</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Compile and render LaTeX preview</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[var(--surface-text)] hover:bg-[var(--surface-border)]"
            onClick={onExportPdf}
          >
            <FilePdf size={16} />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print resume as PDF</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[var(--surface-text)] hover:bg-[var(--surface-border)]"
            onClick={onExportDocx}
          >
            <FileDoc size={16} />
            <span className="hidden sm:inline">Word</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export as Word document</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 hover:bg-[var(--surface-border)] ${
              showHistory ? "text-[var(--accent-color)] bg-[var(--accent-color)]/10" : "text-[var(--surface-text)]"
            }`}
            onClick={onToggleHistory}
          >
            <ClockCounterClockwise size={16} />
            <span className="hidden sm:inline">History</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle commit history sidebar</TooltipContent>
      </Tooltip>
    </div>
  );
}
