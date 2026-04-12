"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { LatexPreview } from "@/components/editor/latex-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Code, Eye } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Commit } from "@/types";

export default function DiffPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const commitAId = searchParams.get("a");
  const commitBId = searchParams.get("b");

  const [commitA, setCommitA] = useState<Commit | null>(null);
  const [commitB, setCommitB] = useState<Commit | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"code" | "rendered">("rendered");

  useEffect(() => {
    async function fetchCommits() {
      if (!commitAId || !commitBId) return;
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.from("commits").select("*").eq("id", commitAId).single(),
        supabase.from("commits").select("*").eq("id", commitBId).single(),
      ]);
      setCommitA(a);
      setCommitB(b);
      setLoading(false);
    }
    fetchCommits();
  }, [commitAId, commitBId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/resume/${id}`}>
            <Button variant="ghost" size="sm" className="h-8 text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]">
              <ArrowLeft size={16} className="mr-1" />
              Back to Editor
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[var(--surface-text)]">Diff View</h1>
          <div className="flex-1" />
          <div className="flex items-center bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 text-xs gap-1.5 rounded-md ${
                viewMode === "rendered"
                  ? "bg-[var(--accent-color)]/15 text-[var(--accent-color)]"
                  : "text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]"
              }`}
              onClick={() => setViewMode("rendered")}
            >
              <Eye size={14} />
              Rendered
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 text-xs gap-1.5 rounded-md ${
                viewMode === "code"
                  ? "bg-[var(--accent-color)]/15 text-[var(--accent-color)]"
                  : "text-[var(--surface-text-secondary)] hover:text-[var(--surface-text)]"
              }`}
              onClick={() => setViewMode("code")}
            >
              <Code size={14} />
              Source
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[60vh] bg-[var(--surface-card)]" />
        ) : commitA && commitB ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs bg-[var(--surface-border)] text-red-400 border-0"
                  >
                    {commitA.id.slice(0, 7)}
                  </Badge>
                  <span className="text-sm text-[var(--surface-text)] truncate">{commitA.message}</span>
                </div>
                <span className="text-xs text-[var(--surface-text-secondary)]">{formatDate(commitA.created_at)}</span>
              </div>
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs bg-[var(--surface-border)] text-[var(--accent-color)] border-0"
                  >
                    {commitB.id.slice(0, 7)}
                  </Badge>
                  <span className="text-sm text-[var(--surface-text)] truncate">{commitB.message}</span>
                </div>
                <span className="text-xs text-[var(--surface-text-secondary)]">{formatDate(commitB.created_at)}</span>
              </div>
            </div>

            {viewMode === "code" ? (
              <DiffViewer
                oldText={commitA.latex_source}
                newText={commitB.latex_source}
                oldTitle={`${commitA.id.slice(0, 7)} - ${commitA.message}`}
                newTitle={`${commitB.id.slice(0, 7)} - ${commitB.message}`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[var(--surface-border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--surface-card)] px-3 py-2 border-b border-[var(--surface-border)] text-xs text-red-400 font-mono">
                    {commitA.id.slice(0, 7)} &mdash; {commitA.message}
                  </div>
                  <div className="bg-white max-h-[70vh] overflow-auto">
                    <LatexPreview source={commitA.latex_source} />
                  </div>
                </div>
                <div className="border border-[var(--surface-border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--surface-card)] px-3 py-2 border-b border-[var(--surface-border)] text-xs text-[var(--accent-color)] font-mono">
                    {commitB.id.slice(0, 7)} &mdash; {commitB.message}
                  </div>
                  <div className="bg-white max-h-[70vh] overflow-auto">
                    <LatexPreview source={commitB.latex_source} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-[var(--surface-text-secondary)]">
            Could not load commits for comparison.
          </div>
        )}
      </main>
    </div>
  );
}
