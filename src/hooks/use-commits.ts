"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Commit } from "@/types";

export function useCommits(resumeId: string) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommits = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("commits")
      .select("*")
      .eq("resume_id", resumeId)
      .order("created_at", { ascending: false });
    setCommits(data || []);
    setLoading(false);
  }, [resumeId]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  const createCommit = async (message: string, latexSource: string) => {
    const { error } = await supabase.from("commits").insert({
      resume_id: resumeId,
      message,
      latex_source: latexSource,
    });
    if (!error) await fetchCommits();
    return !error;
  };

  const getCommit = async (commitId: string): Promise<Commit | null> => {
    const { data } = await supabase
      .from("commits")
      .select("*")
      .eq("id", commitId)
      .single();
    return data;
  };

  return { commits, loading, createCommit, getCommit, refetch: fetchCommits };
}
