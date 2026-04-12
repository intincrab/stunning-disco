"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Resume, Commit } from "@/types";

export function useResume(id: string) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latestCommit, setLatestCommit] = useState<Commit | null>(null);
  const [commitCount, setCommitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchResume = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .single();
    setResume(data);

    const { data: commits, count } = await supabase
      .from("commits")
      .select("*", { count: "exact" })
      .eq("resume_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    setLatestCommit(commits?.[0] || null);
    setCommitCount(count || 0);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const stash = async (currentSource: string) => {
    if (!resume) return;
    await supabase
      .from("resumes")
      .update({ stash_content: currentSource })
      .eq("id", id);
    await fetchResume();
    return latestCommit?.latex_source || "";
  };

  const popStash = async () => {
    if (!resume?.stash_content) return null;
    const content = resume.stash_content;
    await supabase
      .from("resumes")
      .update({ stash_content: null })
      .eq("id", id);
    await fetchResume();
    return content;
  };

  return { resume, latestCommit, commitCount, loading, stash, popStash, refetch: fetchResume };
}
