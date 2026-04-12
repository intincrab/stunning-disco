"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCommit, Trash, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import type { Resume } from "@/types";
import { useRef } from "react";

interface ResumeCardProps {
  resume: Resume;
  commitCount: number;
  lastUpdated: string;
  onDelete: (id: string) => void;
  onUploadTex: (id: string, content: string) => void;
}

export function ResumeCard({ resume, commitCount, lastUpdated, onDelete, onUploadTex }: ResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUploadTex(resume.id, reader.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Card className="group bg-[var(--surface-card)] border-[var(--surface-border)] hover:border-[var(--accent-color)] transition-colors">
      <Link href={`/resume/${resume.id}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[var(--surface-text)] truncate">
            {resume.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-3 text-xs text-[var(--surface-text-secondary)]">
            <span className="flex items-center gap-1">
              <GitCommit size={14} />
              {commitCount} commit{commitCount !== 1 ? "s" : ""}
            </span>
            <span>{lastUpdated}</span>
          </div>
        </CardContent>
      </Link>
      <div className="px-6 pb-4 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".tex"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]"
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
        >
          <UploadSimple size={14} className="mr-1" />
          Upload .tex
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-[var(--surface-text-secondary)] hover:text-red-400 ml-auto"
          onClick={(e) => {
            e.preventDefault();
            onDelete(resume.id);
          }}
        >
          <Trash size={14} />
        </Button>
      </div>
    </Card>
  );
}
