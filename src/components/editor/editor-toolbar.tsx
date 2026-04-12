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
} from "@phosphor-icons/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface EditorToolbarProps {
  resumeId: string;
  hasStash: boolean;
  onCommit: () => void;
  onStash: () => void;
  onPopStash: () => void;
  onExportPdf: () => void;
  onCompile: () => void;
}

export function EditorToolbar({
  resumeId,
  hasStash,
  onCommit,
  onStash,
  onPopStash,
  onExportPdf,
  onCompile,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#1c1c1c] border-b border-[#2e2e2e]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[#ededed] hover:bg-[#2e2e2e]"
            onClick={onCommit}
          >
            <GitCommit size={16} />
            <span className="hidden sm:inline">Commit</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save a snapshot of your work</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[#ededed] hover:bg-[#2e2e2e]"
            onClick={onStash}
          >
            <Archive size={16} />
            <span className="hidden sm:inline">Stash</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stash current changes and revert to last commit</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[#ededed] hover:bg-[#2e2e2e]"
            onClick={onPopStash}
            disabled={!hasStash}
          >
            <ArrowCounterClockwise size={16} />
            <span className="hidden sm:inline">Pop Stash</span>
            {hasStash && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-[#3ECF8E]/20 text-[#3ECF8E] border-0">
                1
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Restore stashed changes</TooltipContent>
      </Tooltip>

      <div className="w-px h-5 bg-[#2e2e2e] mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[#3ECF8E] hover:bg-[#35b87c] text-[#171717] font-medium"
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
            className="h-8 gap-1.5 text-[#ededed] hover:bg-[#2e2e2e]"
            onClick={onExportPdf}
          >
            <FilePdf size={16} />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print resume as PDF</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/resume/${resumeId}/history`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[#ededed] hover:bg-[#2e2e2e]"
            >
              <ClockCounterClockwise size={16} />
              <span className="hidden sm:inline">History</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>View commit history</TooltipContent>
      </Tooltip>
    </div>
  );
}
