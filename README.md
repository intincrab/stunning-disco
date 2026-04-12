# ResumeGit

A version-controlled LaTeX resume manager with Git-like operations (commit, stash, diff, restore). Built with Next.js 14, Supabase, Tailwind CSS, and shadcn/ui.

## Features

- Create and manage multiple LaTeX resumes
- Monaco editor with LaTeX syntax highlighting
- Live HTML preview of your LaTeX resume
- Git-like operations: commit, stash, pop stash, restore
- Side-by-side diff view comparing any two commits
- Export resume as PDF via browser print
- Fully responsive dark theme (GitHub-inspired)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** for database
- **Tailwind CSS** + **shadcn/ui** for UI components
- **Monaco Editor** for LaTeX source editing
- **diff** + **diff2html** for side-by-side diffs
- **Phosphor Icons** for all iconography
- **Geist** font family

## Database Schema

The app uses two Supabase tables:

- `resumes` - stores resume metadata and stash content
- `commits` - stores commit snapshots with messages and LaTeX source

No authentication required - uses a UUID stored in localStorage to scope data per user.
