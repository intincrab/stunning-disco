export interface Resume {
  id: string;
  user_id: string;
  name: string;
  stash_content: string | null;
  created_at: string;
}

export interface Commit {
  id: string;
  resume_id: string;
  message: string;
  latex_source: string;
  created_at: string;
}
