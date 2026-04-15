```
 ____                                 ____ _ _
|  _ \ ___  ___ _   _ _ __ ___   ___ / ___(_) |_
| |_) / _ \/ __| | | | '_ ` _ \ / _ \ |  _| | __|
|  _ <  __/\__ \ |_| | | | | | |  __/ |_| | | |_
|_| \_\___||___/\__,_|_| |_| |_|\___|\____|_|\__|

    < LaTeX · Version Control · AI Editing />
```

# ResumeGit

A LaTeX resume editor with Git-like version control, AI-assisted editing, and live preview.

## Features

### Resume Management

- Create multiple resumes per user
- Choose from built-in LaTeX templates (blank, Jake's Resume, Academic CV, Minimalist)
- Upload existing `.tex` files to create or update resumes
- Delete resumes from the dashboard
- Commit activity heatmap showing contributions over the last 20 weeks

### LaTeX Editor

- Monaco-based code editor with custom LaTeX syntax highlighting
- Custom dark theme optimized for LaTeX editing
- Live HTML preview of your resume as you type
- Word and character count in the status bar
- Keyboard shortcuts:
  - `Ctrl/Cmd + S` - Open commit dialog
  - `Ctrl/Cmd + Shift + S` - Stash current changes
- Resizable editor and preview panels

### Version Control

- Git-style commit system with custom messages
- Full commit history with timeline view
- Stash and pop functionality for temporary changes
- Restore any previous commit (creates a new commit, preserving history)
- Compare any two commits side-by-side
- Auto-save drafts every 30 seconds

### Diff and Comparison

- Dedicated diff page for comparing commits
- Side-by-side rendered preview comparison
- Side-by-side source code diff with syntax highlighting
- Unified diff view powered by diff2html

### AI-Assisted Editing

- Built-in AI chat panel for natural language editing
- Describe changes in plain English
- Preview proposed changes before applying
- Accept or reject AI suggestions
- Powered by MiniMax AI

### Export Options

- Export to PDF via browser print
- Export to Word (.docx) format
- Print-optimized CSS for clean PDF output

### User Interface

- Dark and light theme with toggle
- Responsive design for desktop and mobile
- Resizable panels (editor, preview, history sidebar)
- Loading skeletons for smooth experience
- Tooltips on all toolbar actions

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Monaco Editor
- Supabase (database)
- MiniMax AI API
- diff / diff2html
- Phosphor Icons
- Geist Font

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MINIMAX_API_KEY=your_minimax_api_key
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the required environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses two main tables in Supabase:

**resumes**
- `id` - UUID primary key
- `user_id` - Anonymous user identifier
- `name` - Resume name
- `stash_content` - Stashed/draft content
- `created_at` - Timestamp

**commits**
- `id` - UUID primary key
- `resume_id` - Foreign key to resumes
- `message` - Commit message
- `latex_source` - Full LaTeX source at this commit
- `created_at` - Timestamp

## License

MIT
