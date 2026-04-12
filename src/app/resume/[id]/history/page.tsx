"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useCommits } from "@/hooks/use-commits";
import { useResume } from "@/hooks/use-resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  GitDiff,
  GitCommit as GitCommitIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { Commit } from "@/types";

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { resume } = useResume(id);
  const { commits, loading, createCommit } = useCommits(id);
  const [diffA, setDiffA] = useState<string>("");
  const [diffB, setDiffB] = useState<string>("");
  const [restoring, setRestoring] = useState<string | null>(null);

  const handleRestore = async (commit: Commit) => {
    setRestoring(commit.id);
    const hash = commit.id.slice(0, 7);
    await createCommit(`Restored to ${hash}`, commit.latex_source);
    setRestoring(null);
    router.push(`/resume/${id}`);
  };

  const handleCompare = () => {
    if (diffA && diffB) {
      router.push(`/resume/${id}/diff?a=${diffA}&b=${diffB}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/resume/${id}`}>
            <Button variant="ghost" size="sm" className="h-8 text-[#8b949e] hover:text-[#e6edf3]">
              <ArrowLeft size={16} className="mr-1" />
              Back to Editor
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#e6edf3]">
              {resume?.name} &mdash; History
            </h1>
          </div>
        </div>

        {/* Diff Picker */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm text-[#8b949e]">Compare:</span>
            <Select value={diffA} onValueChange={setDiffA}>
              <SelectTrigger className="w-full sm:w-[240px] bg-[#0d1117] border-[#30363d]">
                <SelectValue placeholder="Select commit A" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {commits.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-mono text-xs text-yellow-400">{c.id.slice(0, 7)}</span>
                    <span className="ml-2 text-sm">{c.message}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-[#484f58]">vs</span>
            <Select value={diffB} onValueChange={setDiffB}>
              <SelectTrigger className="w-full sm:w-[240px] bg-[#0d1117] border-[#30363d]">
                <SelectValue placeholder="Select commit B" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {commits.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-mono text-xs text-yellow-400">{c.id.slice(0, 7)}</span>
                    <span className="ml-2 text-sm">{c.message}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCompare}
              disabled={!diffA || !diffB || diffA === diffB}
              size="sm"
              className="gap-1.5"
            >
              <GitDiff size={16} />
              Compare
            </Button>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 bg-[#161b22]" />
            ))}
          </div>
        ) : commits.length === 0 ? (
          <div className="text-center py-16">
            <GitCommitIcon size={40} className="mx-auto text-[#30363d] mb-4" />
            <p className="text-[#8b949e]">No commits yet</p>
            <p className="text-sm text-[#484f58] mt-1">Make your first commit in the editor</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-[#30363d]" />

            <div className="space-y-0">
              {commits.map((commit, index) => (
                <div key={commit.id} className="relative flex items-start gap-4 py-4">
                  {/* Dot */}
                  <div className="relative z-10 w-[32px] flex-shrink-0 flex justify-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 mt-1.5 ${
                        index === 0
                          ? "bg-green-400 border-green-400"
                          : "bg-[#0d1117] border-[#484f58]"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="w-fit font-mono text-xs bg-[#30363d] text-yellow-400 border-0"
                      >
                        {commit.id.slice(0, 7)}
                      </Badge>
                      <span className="font-medium text-[#e6edf3] text-sm">
                        {commit.message}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">
                        {formatDate(commit.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-[#8b949e] hover:text-[#e6edf3]"
                          onClick={() => handleRestore(commit)}
                          disabled={restoring === commit.id}
                        >
                          <ArrowCounterClockwise size={14} className="mr-1" />
                          {restoring === commit.id ? "Restoring..." : "Restore"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
