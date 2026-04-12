"use client";

import { GitBranch } from "@phosphor-icons/react";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[#2e2e2e] bg-[#1c1c1c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <GitBranch size={24} weight="bold" className="text-[#3ECF8E]" />
          <span className="text-lg font-semibold text-white">ResumeGit</span>
        </Link>
      </div>
    </header>
  );
}
