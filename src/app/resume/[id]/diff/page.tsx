"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "@phosphor-icons/react";
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
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/resume/${id}/history`}>
            <Button variant="ghost" size="sm" className="h-8 text-[#8b949e] hover:text-[#e6edf3]">
              <ArrowLeft size={16} className="mr-1" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#e6edf3]">Diff View</h1>
        </div>

        {loading ? (
          <Skeleton className="h-[60vh] bg-[#161b22]" />
        ) : commitA && commitB ? (
          <>
            {/* Commit info headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs bg-[#30363d] text-red-400 border-0"
                  >
                    {commitA.id.slice(0, 7)}
                  </Badge>
                  <span className="text-sm text-[#e6edf3] truncate">{commitA.message}</span>
                </div>
                <span className="text-xs text-[#8b949e]">{formatDate(commitA.created_at)}</span>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs bg-[#30363d] text-green-400 border-0"
                  >
                    {commitB.id.slice(0, 7)}
                  </Badge>
                  <span className="text-sm text-[#e6edf3] truncate">{commitB.message}</span>
                </div>
                <span className="text-xs text-[#8b949e]">{formatDate(commitB.created_at)}</span>
              </div>
            </div>

            <DiffViewer
              oldText={commitA.latex_source}
              newText={commitB.latex_source}
              oldTitle={`${commitA.id.slice(0, 7)} - ${commitA.message}`}
              newTitle={`${commitB.id.slice(0, 7)} - ${commitB.message}`}
            />
          </>
        ) : (
          <div className="text-center py-16 text-[#8b949e]">
            Could not load commits for comparison.
          </div>
        )}
      </main>
    </div>
  );
}
