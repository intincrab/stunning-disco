#!/usr/bin/env node

/**
 * ResumeGit CLI — sync local .tex files with your ResumeGit instance.
 *
 * Usage:
 *   resumegit push <file.tex> --resume <id> --message "commit message"
 *   resumegit log  --resume <id>
 *   resumegit pull --resume <id> --out <file.tex>
 *   resumegit list
 *
 * Environment:
 *   RESUMEGIT_URL     — Supabase project URL
 *   RESUMEGIT_KEY     — Supabase anon key
 *   RESUMEGIT_USER    — Your user UUID (from localStorage in the web app)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── Config ──────────────────────────────────────────────────────────

function loadEnv() {
  // Try .env.resumegit first, then .env.local
  const candidates = [
    resolve(process.cwd(), ".env.resumegit"),
    resolve(process.cwd(), ".env.local"),
  ];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const match = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim();
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.RESUMEGIT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.RESUMEGIT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USER_ID = process.env.RESUMEGIT_USER;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Error: Missing Supabase credentials.\n" +
    "Set RESUMEGIT_URL and RESUMEGIT_KEY environment variables,\n" +
    "or create a .env.resumegit file in your working directory.\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ─────────────────────────────────────────────────────────

function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function dim(s) { return `\x1b[2m${s}\x1b[0m`; }
function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] || true;
      i++;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

// ── Commands ────────────────────────────────────────────────────────

async function cmdList() {
  if (!USER_ID) {
    console.error("Error: Set RESUMEGIT_USER to your user UUID.");
    process.exit(1);
  }

  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: false });

  if (error) { console.error("Error:", error.message); process.exit(1); }

  if (!resumes || resumes.length === 0) {
    console.log("No resumes found.");
    return;
  }

  console.log(bold("Your Resumes\n"));
  for (const r of resumes) {
    const { count } = await supabase
      .from("commits")
      .select("*", { count: "exact", head: true })
      .eq("resume_id", r.id);

    console.log(
      `  ${green(r.id.slice(0, 8))}  ${bold(r.name)}  ${dim(`${count || 0} commits`)}  ${dim(formatDate(r.created_at))}`
    );
  }
  console.log();
}

async function cmdLog(flags) {
  const resumeId = flags.resume;
  if (!resumeId) {
    console.error("Error: --resume <id> is required.");
    process.exit(1);
  }

  const { data: commits, error } = await supabase
    .from("commits")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) { console.error("Error:", error.message); process.exit(1); }

  if (!commits || commits.length === 0) {
    console.log("No commits found.");
    return;
  }

  console.log(bold("Commit History\n"));
  for (const c of commits) {
    console.log(`  ${yellow(c.id.slice(0, 7))}  ${c.message}  ${dim(formatDate(c.created_at))}`);
  }
  console.log();
}

async function cmdPush(positional, flags) {
  const filePath = positional[0];
  const resumeId = flags.resume;
  const message = flags.message || flags.m || `Push from CLI`;

  if (!filePath) {
    console.error("Error: Provide a .tex file path.\n  resumegit push <file.tex> --resume <id>");
    process.exit(1);
  }
  if (!resumeId) {
    console.error("Error: --resume <id> is required.");
    process.exit(1);
  }

  const absPath = resolve(process.cwd(), filePath);
  if (!existsSync(absPath)) {
    console.error(`Error: File not found: ${absPath}`);
    process.exit(1);
  }

  const source = readFileSync(absPath, "utf-8");

  const { data, error } = await supabase
    .from("commits")
    .insert({
      resume_id: resumeId,
      message,
      latex_source: source,
    })
    .select()
    .single();

  if (error) { console.error("Error:", error.message); process.exit(1); }

  console.log(
    `${green("Pushed!")} ${yellow(data.id.slice(0, 7))} ${dim("—")} ${message}\n` +
    `  ${dim(`${source.length} chars → resume ${resumeId.slice(0, 8)}`)}`
  );
}

async function cmdPull(flags) {
  const resumeId = flags.resume;
  const outFile = flags.out || flags.o;

  if (!resumeId) {
    console.error("Error: --resume <id> is required.");
    process.exit(1);
  }

  const { data: commit, error } = await supabase
    .from("commits")
    .select("*")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !commit) {
    console.error("Error: No commits found for this resume.");
    process.exit(1);
  }

  if (outFile) {
    const absPath = resolve(process.cwd(), outFile);
    writeFileSync(absPath, commit.latex_source, "utf-8");
    console.log(
      `${green("Pulled!")} ${yellow(commit.id.slice(0, 7))} ${dim("→")} ${outFile}\n` +
      `  ${dim(commit.message)} ${dim(`(${formatDate(commit.created_at)})`)}`
    );
  } else {
    // Print to stdout
    process.stdout.write(commit.latex_source);
  }
}

// ── Main ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];
const { flags, positional } = parseArgs(args.slice(1));

const HELP = `
${bold("ResumeGit CLI")} — sync local .tex files with ResumeGit

${bold("Commands:")}
  ${green("list")}                              List all your resumes
  ${green("log")}   --resume <id>               Show commit history
  ${green("push")}  <file.tex> --resume <id>    Push a .tex file as a new commit
          [--message "msg"]
  ${green("pull")}  --resume <id> [--out f.tex] Pull latest commit to file or stdout

${bold("Setup:")}
  Create ${yellow(".env.resumegit")} in your project directory:
    RESUMEGIT_URL=https://your-project.supabase.co
    RESUMEGIT_KEY=your-anon-key
    RESUMEGIT_USER=your-uuid-from-localstorage
`;

switch (command) {
  case "list":
    await cmdList();
    break;
  case "log":
    await cmdLog(flags);
    break;
  case "push":
    await cmdPush(positional, flags);
    break;
  case "pull":
    await cmdPull(flags);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`Unknown command: ${command}\nRun "resumegit --help" for usage.`);
    process.exit(1);
}
