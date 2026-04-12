"use client";

import { GitBranch, Sun, Moon } from "@phosphor-icons/react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-[var(--surface-border)] bg-[var(--surface-card)] shrink-0">
      <div className="px-4 sm:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <GitBranch size={24} weight="bold" className="text-[var(--accent-color)]" />
          <span className="text-lg font-semibold text-[var(--surface-text)]">ResumeGit</span>
        </Link>
        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-[var(--surface-border)] transition-colors text-[var(--surface-text-secondary)]"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
