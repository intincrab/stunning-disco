"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Resume } from "@/types";

export function useResumes(userId: string | null) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setResumes(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const createResume = async (name: string, initialSource?: string) => {
    if (!userId) return null;
    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({ user_id: userId, name })
      .select()
      .single();
    if (error || !resume) return null;

    if (initialSource) {
      await supabase
        .from("commits")
        .insert({
          resume_id: resume.id,
          message: "Initial commit",
          latex_source: initialSource,
        });
    }

    await fetchResumes();
    return resume as Resume;
  };

  const deleteResume = async (id: string) => {
    await supabase.from("resumes").delete().eq("id", id);
    await fetchResumes();
  };

  return { resumes, loading, createResume, deleteResume, refetch: fetchResumes };
}
