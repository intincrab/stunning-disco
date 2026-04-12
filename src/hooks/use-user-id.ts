"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/user";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  return userId;
}
