"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { ResumeCard } from "@/components/home/resume-card";
import { NewResumeDialog } from "@/components/home/new-resume-dialog";
import { CommitHeatmap } from "@/components/home/commit-heatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId } from "@/hooks/use-user-id";
import { useResumes } from "@/hooks/use-resumes";
import { supabase } from "@/lib/supabase";
import { FileText } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const userId = useUserId();
  const { resumes, loading, createResume, deleteResume, refetch } = useResumes(userId);
  const router = useRouter();
  const [commitCounts, setCommitCounts] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, string>>({});
  const [allCommitDates, setAllCommitDates] = useState<string[]>([]);

  const fetchMeta = useCallback(async () => {
    if (resumes.length === 0) return;
    const counts: Record<string, number> = {};
    const updated: Record<string, string> = {};
    for (const r of resumes) {
      const { count } = await supabase
        .from("commits")
        .select("*", { count: "exact", head: true })
        .eq("resume_id", r.id);
      counts[r.id] = count || 0;

      const { data: latest } = await supabase
        .from("commits")
        .select("created_at")
        .eq("resume_id", r.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const date = latest?.[0]?.created_at || r.created_at;
      updated[r.id] = formatRelativeTime(date);
    }
    setCommitCounts(counts);
    setLastUpdated(updated);

    const resumeIds = resumes.map((r) => r.id);
    const { data: allCommits } = await supabase
      .from("commits")
      .select("created_at")
      .in("resume_id", resumeIds)
      .order("created_at", { ascending: false });
    setAllCommitDates((allCommits || []).map((c) => c.created_at));
  }, [resumes]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleCreate = async (name: string, source?: string) => {
    const resume = await createResume(name, source);
    if (resume) {
      router.push(`/resume/${resume.id}`);
    }
  };

  const handleUploadTex = async (resumeId: string, content: string) => {
    await supabase.from("commits").insert({
      resume_id: resumeId,
      message: "Uploaded .tex file",
      latex_source: content,
    });
    await refetch();
    await fetchMeta();
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--surface-text)]">Your Resumes</h1>
            <p className="text-sm text-[var(--surface-text-secondary)] mt-1">
              Version-controlled LaTeX resumes with Git-like operations
            </p>
          </div>
          <NewResumeDialog onCreate={handleCreate} />
        </div>

        {allCommitDates.length > 0 && (
          <div className="mb-6">
            <CommitHeatmap commitDates={allCommitDates} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-[var(--surface-card)]" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-[var(--surface-border)] mb-4" />
            <h2 className="text-lg font-medium text-[var(--surface-text-secondary)] mb-2">No resumes yet</h2>
            <p className="text-sm text-[var(--surface-text-muted)] mb-6">
              Create your first resume to get started
            </p>
            <NewResumeDialog onCreate={handleCreate} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                commitCount={commitCounts[resume.id] || 0}
                lastUpdated={lastUpdated[resume.id] || "just now"}
                onDelete={deleteResume}
                onUploadTex={handleUploadTex}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
