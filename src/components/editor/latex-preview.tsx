"use client";

import { useMemo } from "react";

interface LatexPreviewProps {
  source: string;
}

export function LatexPreview({ source }: LatexPreviewProps) {
  const html = useMemo(() => parseLatexToHtml(source), [source]);

  return (
    <div
      className="print-area bg-white text-black p-8 min-h-full font-serif text-[11pt] leading-relaxed overflow-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Find the matching closing brace starting at position `start` (which should point to the opening `{`).
 *  Returns the index after the closing `}`, or -1 if not found. */
function findMatchingBrace(str: string, start: number): number {
  if (str[start] !== "{") return -1;
  let depth = 1;
  let i = start + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === "{" && str[i - 1] !== "\\") depth++;
    if (str[i] === "}" && str[i - 1] !== "\\") depth--;
    i++;
  }
  return depth === 0 ? i : -1;
}

/** Extract N brace-delimited arguments after a position in str.
 *  Returns null if not enough args found, otherwise { args: string[], endIndex: number } */
function extractArgs(str: string, pos: number, numArgs: number): { args: string[]; endIndex: number } | null {
  const args: string[] = [];
  let i = pos;
  for (let a = 0; a < numArgs; a++) {
    // skip whitespace
    while (i < str.length && /\s/.test(str[i])) i++;
    if (i >= str.length || str[i] !== "{") return null;
    const end = findMatchingBrace(str, i);
    if (end === -1) return null;
    args.push(str.slice(i + 1, end - 1));
    i = end;
  }
  return { args, endIndex: i };
}

function parseLatexToHtml(source: string): string {
  // ── Step 1: Expand user-defined \newcommand macros ──
  const macros: { name: string; numArgs: number; body: string }[] = [];

  let macroSource = source;
  const newCmdRegex = /\\newcommand\{\\([a-zA-Z]+)\}(?:\[(\d)\])?\{/g;
  let m: RegExpExecArray | null;
  const indicesToRemove: [number, number][] = [];

  while ((m = newCmdRegex.exec(macroSource)) !== null) {
    const name = m[1];
    const numArgs = m[2] ? parseInt(m[2]) : 0;
    const bodyStart = m.index + m[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < macroSource.length && depth > 0) {
      if (macroSource[i] === "{" && macroSource[i - 1] !== "\\") depth++;
      if (macroSource[i] === "}" && macroSource[i - 1] !== "\\") depth--;
      i++;
    }
    const body = macroSource.slice(bodyStart, i - 1);
    macros.push({ name, numArgs, body });
    indicesToRemove.push([m.index, i]);
  }

  for (let idx = indicesToRemove.length - 1; idx >= 0; idx--) {
    macroSource = macroSource.slice(0, indicesToRemove[idx][0]) + macroSource.slice(indicesToRemove[idx][1]);
  }

  // Also handle \renewcommand
  const renewCmdRegex = /\\renewcommand\{\\([a-zA-Z]+)\}(?:\[(\d)\])?\{/g;
  const renewIndicesToRemove: [number, number][] = [];
  while ((m = renewCmdRegex.exec(macroSource)) !== null) {
    const bodyStart = m.index + m[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < macroSource.length && depth > 0) {
      if (macroSource[i] === "{" && macroSource[i - 1] !== "\\") depth++;
      if (macroSource[i] === "}" && macroSource[i - 1] !== "\\") depth--;
      i++;
    }
    renewIndicesToRemove.push([m.index, i]);
  }
  for (let idx = renewIndicesToRemove.length - 1; idx >= 0; idx--) {
    macroSource = macroSource.slice(0, renewIndicesToRemove[idx][0]) + macroSource.slice(renewIndicesToRemove[idx][1]);
  }

  source = macroSource;

  // Expand macros — use proper brace-matching for arguments
  for (let pass = 0; pass < 6; pass++) {
    for (const macro of macros) {
      if (macro.numArgs === 0) {
        // Zero-arg macro: simple text replacement
        source = source.split("\\" + macro.name).join(macro.body);
      } else {
        // Macro with args: find each occurrence and extract brace-delimited args
        let result = "";
        let searchFrom = 0;
        const pattern = "\\" + macro.name;
        while (true) {
          const idx = source.indexOf(pattern, searchFrom);
          if (idx === -1) {
            result += source.slice(searchFrom);
            break;
          }
          // Make sure it's not part of a longer command name
          const afterCmd = idx + pattern.length;
          if (afterCmd < source.length && /[a-zA-Z]/.test(source[afterCmd])) {
            result += source.slice(searchFrom, afterCmd);
            searchFrom = afterCmd;
            continue;
          }
          result += source.slice(searchFrom, idx);
          const extracted = extractArgs(source, afterCmd, macro.numArgs);
          if (extracted) {
            let expanded = macro.body;
            for (let a = 0; a < macro.numArgs; a++) {
              // Use a regex replacement to ensure \small#1 becomes \small ARG (with space)
              const paramToken = "#" + (a + 1);
              expanded = expanded.split(paramToken).join(extracted.args[a]);
            }
            result += expanded;
            searchFrom = extracted.endIndex;
          } else {
            // Couldn't extract args, leave the command as-is
            result += pattern;
            searchFrom = afterCmd;
          }
        }
        source = result;
      }
    }
  }

  // Fix \small/\tiny/etc. concatenated with text (e.g. \smallBachelor → \small Bachelor)
  source = source.replace(/\\(small|tiny|footnotesize|scriptsize|normalsize|large|Large|LARGE|huge|Huge)([A-Z])/g, "\\$1 $2");

  // Extract content between the LAST \begin{document} and \end{document}
  const docMatches = [...source.matchAll(/\\begin\{document\}/g)];
  let content: string;
  if (docMatches.length > 0) {
    const lastBegin = docMatches[docMatches.length - 1].index! + docMatches[docMatches.length - 1][0].length;
    const endMatch = source.lastIndexOf("\\end{document}");
    content = endMatch > lastBegin ? source.slice(lastBegin, endMatch) : source.slice(lastBegin);
  } else {
    content = source;
  }

  // Remove comments
  content = content.replace(/%.*$/gm, "");

  // Strip preamble commands
  content = content.replace(/\\documentclass(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\usepackage(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\setlength\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\setcounter\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\addtolength\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\titleformat\{[^}]*\}(?:\{[^}]*\}|\[[^\]]*\])*/g, "");
  content = content.replace(/\\titlespacing\*?\{[^}]*\}(?:\{[^}]*\})*/g, "");
  content = content.replace(/\\pagestyle\{[^}]*\}/g, "");
  content = content.replace(/\\thispagestyle\{[^}]*\}/g, "");
  content = content.replace(/\\pagenumbering\{[^}]*\}/g, "");
  content = content.replace(/\\epsfxsize[^\\{\n]*/g, "");
  content = content.replace(/\\input\{[^}]*\}/g, "");
  content = content.replace(/\\pdfgentounicode\s*=\s*\d+/g, "");
  content = content.replace(/\\urlstyle\{[^}]*\}/g, "");
  content = content.replace(/\\raggedbottom/g, "");
  content = content.replace(/\\raggedright/g, "");
  content = content.replace(/\\fancyhf\{[^}]*\}/g, "");
  content = content.replace(/\\fancyfoot\{?\}?/g, "");
  content = content.replace(/\\begin\{document\}/g, "");
  content = content.replace(/\\end\{document\}/g, "");

  // ── Environments ──

  // center — process \\ line breaks and \vspace inside
  content = content.replace(
    /\\begin\{center\}([\s\S]*?)\\end\{center\}/g,
    (_, inner) => {
      inner = inner.replace(/\\\\(\[\d+[a-z]*\])?/g, "<br/>");
      inner = inner.replace(/\\vspace\*?\{[^}]*\}/g, "");
      return `<div style="text-align:center">${processInline(inner)}</div>`;
    }
  );

  // figure
  content = content.replace(
    /\\begin\{figure\}(\[.*?\])?([\s\S]*?)\\end\{figure\}/g,
    (_, _opts, inner) => {
      const caption = inner.match(/\\caption\{([^}]*)\}/);
      return `<div style="text-align:center;margin:16px 0;padding:12px;border:1px dashed #999;color:#666"><em>[Figure${caption ? ": " + caption[1] : ""}]</em></div>`;
    }
  );

  // table
  content = content.replace(
    /\\begin\{table\}(\[.*?\])?([\s\S]*?)\\end\{table\}/g,
    (_, _opts, inner) => `<div style="margin:12px 0">${inner}</div>`
  );

  // tabular / tabular* — process these BEFORE itemize so expanded macro content works
  content = processAllTabulars(content);

  // Process lists from innermost outward to handle nesting properly
  // Tag resume-style lists (label={}) so we can treat them differently
  content = content.replace(
    /\\begin\{itemize\}\[leftmargin[^\]]*label\s*=\s*\{\}\]/g,
    "\\begin{resumelist}"
  );

  // Process all itemize environments innermost-first using a loop
  for (let pass = 0; pass < 10; pass++) {
    const before = content;

    // Process innermost regular itemize (ones with no nested \begin{itemize} inside)
    content = content.replace(
      /\\begin\{itemize\}(\[.*?\])?((?:(?!\\begin\{itemize\}|\\begin\{resumelist\})[\s\S])*?)\\end\{itemize\}/g,
      (_, _opts, inner) => {
        let cleaned = inner.replace(/\\vspace\*?\{[^}]*\}/g, "");
        const items = cleaned
          .split(/\\item\s*/)
          .filter((s: string) => s.trim())
          .map((s: string) => `<li style="margin-bottom:1px;font-size:10pt">${processInline(s.trim())}</li>`)
          .join("");
        return `<ul style="margin:2px 0;padding-left:18px;list-style-type:disc">${items}</ul>`;
      }
    );

    // Process innermost resumelist (ones with no nested lists inside)
    content = content.replace(
      /\\begin\{resumelist\}((?:(?!\\begin\{itemize\}|\\begin\{resumelist\})[\s\S])*?)\\end\{itemize\}/g,
      (_, inner) => {
        let cleaned = inner.replace(/\\vspace\*?\{[^}]*\}/g, "");
        const items = cleaned
          .split(/\\item\s*/)
          .filter((s: string) => s.trim())
          .map((s: string) => `<div style="margin-bottom:4px">${s.trim()}</div>`)
          .join("");
        return `<div style="margin:0;padding:0">${items}</div>`;
      }
    );

    if (content === before) break;
  }

  // enumerate
  content = content.replace(
    /\\begin\{enumerate\}(\[.*?\])?([\s\S]*?)\\end\{enumerate\}/g,
    (_, _opts, inner) => {
      const items = inner
        .split(/\\item\s*/)
        .filter((s: string) => s.trim())
        .map((s: string) => `<li style="margin-bottom:2px">${processInline(s.trim())}</li>`)
        .join("");
      return `<ol style="margin:4px 0;padding-left:20px">${items}</ol>`;
    }
  );

  // description
  content = content.replace(
    /\\begin\{description\}([\s\S]*?)\\end\{description\}/g,
    (_, inner) => {
      const items = inner
        .split(/\\item\s*/)
        .filter((s: string) => s.trim())
        .map((s: string) => {
          const labelMatch = s.match(/^\[([^\]]*)\]\s*/);
          if (labelMatch) {
            return `<dt style="font-weight:bold">${processInline(labelMatch[1])}</dt><dd style="margin-left:20px;margin-bottom:4px">${processInline(s.slice(labelMatch[0].length).trim())}</dd>`;
          }
          return `<dd style="margin-left:20px;margin-bottom:4px">${processInline(s.trim())}</dd>`;
        })
        .join("");
      return `<dl style="margin:4px 0">${items}</dl>`;
    }
  );

  // equation/eqnarray/align/displaymath/gather
  content = content.replace(
    /\\begin\{(equation|eqnarray|align|displaymath|gather)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, _env, inner) => {
      const cleaned = inner.replace(/\\label\{[^}]*\}/g, "").replace(/\\nonumber/g, "").trim();
      return `<div style="text-align:center;margin:12px 0;font-family:serif;font-style:italic;padding:8px;background:#f9f9f9;border-radius:4px">${escapeHtml(cleaned)}</div>`;
    }
  );

  // verbatim
  content = content.replace(
    /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
    (_, inner) => `<pre style="font-family:monospace;background:#f5f5f5;padding:8px;margin:8px 0;white-space:pre-wrap">${escapeHtml(inner)}</pre>`
  );

  // quote/quotation
  content = content.replace(
    /\\begin\{(quote|quotation)\}([\s\S]*?)\\end\{\1\}/g,
    (_, _env, inner) => `<blockquote style="margin:8px 20px;padding-left:12px;border-left:3px solid #ccc">${processInline(inner)}</blockquote>`
  );

  // flushleft/flushright
  content = content.replace(
    /\\begin\{flushleft\}([\s\S]*?)\\end\{flushleft\}/g,
    (_, inner) => `<div style="text-align:left">${processInline(inner)}</div>`
  );
  content = content.replace(
    /\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g,
    (_, inner) => `<div style="text-align:right">${processInline(inner)}</div>`
  );

  // minipage
  content = content.replace(
    /\\begin\{minipage\}(\[.*?\])?\{[^}]*\}([\s\S]*?)\\end\{minipage\}/g,
    (_, _opts, inner) => `<div style="display:inline-block;vertical-align:top">${processInline(inner)}</div>`
  );

  // comment environment
  content = content.replace(
    /\\begin\{comment\}([\s\S]*?)\\end\{comment\}/g,
    ""
  );

  // Strip remaining unknown environments
  content = content.replace(/\\begin\{[^}]*\}(\[.*?\])?(\{[^}]*\})?/g, "");
  content = content.replace(/\\end\{[^}]*\}/g, "");

  // ── Sections ──
  content = content.replace(
    /\\part\*?\{([^}]*)\}/g,
    (_, title) => `<h1 style="font-size:20px;font-weight:bold;text-align:center;margin:24px 0 12px 0">${processInline(title)}</h1>`
  );
  content = content.replace(
    /\\section\*?\{([^}]*)\}/g,
    (_, title) =>
      `<h2 style="font-size:13px;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:2px;margin:14px 0 6px 0;letter-spacing:0.5px">${processInline(title)}</h2>`
  );
  content = content.replace(
    /\\subsection\*?\{([^}]*)\}/g,
    (_, title) =>
      `<h3 style="font-size:12px;font-weight:bold;margin:12px 0 4px 0">${processInline(title)}</h3>`
  );
  content = content.replace(
    /\\subsubsection\*?\{([^}]*)\}/g,
    (_, title) =>
      `<h4 style="font-size:11px;font-weight:bold;margin:10px 0 4px 0">${processInline(title)}</h4>`
  );
  content = content.replace(
    /\\paragraph\*?\{([^}]*)\}/g,
    (_, title) =>
      `<span style="font-weight:bold">${processInline(title)}</span> `
  );

  // Process inline commands
  content = processInline(content);

  // Line breaks: \\ or \\[Xpt]
  content = content.replace(/\\\\(\[\d+[a-z]*\])?/g, "<br/>");

  // Double newlines → paragraph breaks
  content = content.replace(/\n\s*\n/g, "<br/><br/>");

  // Cleanup remaining commands
  content = content.replace(/\\(?:vspace|hspace)\*?\{[^}]*\}/g, "");
  content = content.replace(/\\(?:vfill|newpage|clearpage|pagebreak|linebreak)/g, "<br/>");
  content = content.replace(/\\noindent\s*/g, "");
  content = content.replace(/\\(?:maketitle|tableofcontents|makeatletter|makeatother|centering|raggedright|raggedleft)/g, "");
  content = content.replace(/\\(?:protect|relax|strut|null|phantom\{[^}]*\})/g, "");
  content = content.replace(/\\(?:parindent|parskip|baselineskip|lineskip)\s*[=]?\s*\d*[a-z]*/g, "");
  content = content.replace(/\\color\{[^}]*\}/g, "");
  content = content.replace(/\\titlerule/g, "");

  // Strip \item that leaked from macro expansion (outside any list env)
  content = content.replace(/\\item\s*/g, "");

  // Strip remaining \command{arg} — but be careful not to strip HTML tags
  content = content.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  // Strip remaining \command with no args
  content = content.replace(/\\[a-zA-Z]+/g, "");

  // Clean up stray braces from macro expansion (groups like {text} → text)
  // Use a function that properly handles nested braces and HTML content
  content = cleanStrayBraces(content);

  // Clean excessive breaks
  content = content.replace(/(<br\s*\/?>){4,}/g, "<br/><br/>");

  // Remove stray & that leaked from tabular
  content = content.replace(/\s*&\s*(?=<br|$)/gm, "");

  return content.trim();
}

/** Process all tabular/tabular* environments, handling nested braces properly */
function processAllTabulars(content: string): string {
  // Handle tabular* first, then tabular
  const tabularPattern = /\\begin\{tabular\*?\}/g;
  let match;
  let result = "";
  let lastIndex = 0;

  // Reset regex state
  const allMatches: { index: number; isTabularStar: boolean }[] = [];
  const regex = /\\begin\{(tabular\*?)\}/g;
  while ((match = regex.exec(content)) !== null) {
    allMatches.push({ index: match.index, isTabularStar: match[1] === "tabular*" });
  }

  // Process from last to first to avoid index shifting
  for (let mi = allMatches.length - 1; mi >= 0; mi--) {
    const m = allMatches[mi];
    const startTag = m.isTabularStar ? "\\begin{tabular*}" : "\\begin{tabular}";
    const endTag = m.isTabularStar ? "\\end{tabular*}" : "\\end{tabular}";

    // Find the end of the opening tag (skip column specs)
    let pos = m.index + startTag.length;
    // Skip optional {width} and [alignment] and {column spec} args
    while (pos < content.length) {
      if (content[pos] === "{") {
        const end = findMatchingBrace(content, pos);
        if (end === -1) break;
        pos = end;
      } else if (content[pos] === "[") {
        const bracketEnd = content.indexOf("]", pos);
        if (bracketEnd === -1) break;
        pos = bracketEnd + 1;
      } else {
        break;
      }
    }

    // Find the matching \end{tabular*} or \end{tabular}
    const endIdx = content.indexOf(endTag, pos);
    if (endIdx === -1) continue;

    const inner = content.slice(pos, endIdx);
    const tableHtml = renderTabular(inner);

    content = content.slice(0, m.index) + tableHtml + content.slice(endIdx + endTag.length);
  }

  return content;
}

function renderTabular(inner: string): string {
  const rows = inner
    .split(/\\\\\s*(?:\[.*?\])?\s*/)
    .filter((r: string) => r.trim() && !r.trim().match(/^\\hline$/));

  const tableRows = rows.map((row: string) => {
    // Remove \hline, \cline
    row = row.replace(/\\hline/g, "").replace(/\\cline\{[^}]*\}/g, "");
    if (!row.trim()) return "";

    // Protect escaped ampersands before splitting
    row = row.replace(/\\&/g, "%%AMP%%");
    const cells = row.split(/&/).map((c: string) => {
      c = c.replace(/%%AMP%%/g, "\\&");
      let cell = c.trim();
      // strip @{...} column specs
      cell = cell.replace(/@\{[^}]*\}/g, "");
      const multicolMatch = cell.match(/\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}/);
      if (multicolMatch) {
        return `<td colspan="${multicolMatch[1]}" style="padding:2px 4px">${processInline(multicolMatch[2].trim())}</td>`;
      }
      return `<td style="padding:2px 4px">${processInline(cell)}</td>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  }).filter(Boolean);

  return `<table style="border-collapse:collapse;margin:2px 0;width:100%">${tableRows.join("")}</table>`;
}

function processInline(text: string): string {
  // Special combo: \textbf{\Huge \scshape ...} — must come before generic \textbf
  text = text.replace(/\\textbf\{\\Huge\s*\\scshape\s+([^}]*)\}/g,
    '<span style="font-size:26px;font-variant:small-caps;font-weight:bold">$1</span>');
  text = text.replace(/\\textbf\{\\LARGE\s*\\scshape\s+([^}]*)\}/g,
    '<span style="font-size:22px;font-variant:small-caps;font-weight:bold">$1</span>');
  text = text.replace(/\\textbf\{\\Large\s+([^}]*)\}/g,
    '<span style="font-size:18px;font-weight:bold">$1</span>');

  // \textbf{...} — handle nested braces
  text = replaceCommandWithBraces(text, "textbf", (arg) => `<strong>${arg}</strong>`);
  // \textit{...}
  text = replaceCommandWithBraces(text, "textit", (arg) => `<em>${arg}</em>`);
  // \emph{...}
  text = replaceCommandWithBraces(text, "emph", (arg) => `<em>${arg}</em>`);
  // \underline{...}
  text = replaceCommandWithBraces(text, "underline", (arg) => `<u>${arg}</u>`);
  // \textsc{...}
  text = text.replace(/\\textsc\{([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  // \texttt{...}
  text = text.replace(/\\texttt\{([^}]*)\}/g, '<code style="font-family:monospace">$1</code>');
  // \textrm, \textsf, \text, \mbox, \makebox, \fbox, \colorbox, \textcolor
  text = text.replace(/\\textrm\{([^}]*)\}/g, "$1");
  text = text.replace(/\\textsf\{([^}]*)\}/g, '<span style="font-family:sans-serif">$1</span>');
  text = text.replace(/\\text\{([^}]*)\}/g, "$1");
  text = text.replace(/\\mbox\{([^}]*)\}/g, "$1");
  text = text.replace(/\\makebox(\[.*?\])?\{([^}]*)\}/g, "$2");
  text = text.replace(/\\fbox\{([^}]*)\}/g, '<span style="border:1px solid #333;padding:2px 4px">$1</span>');
  text = text.replace(/\\colorbox\{[^}]*\}\{([^}]*)\}/g, "$1");
  text = text.replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/g, "$1");

  // {\Huge \scshape Jake Ryan} style patterns
  text = text.replace(/\{\\Huge\s*\\scshape\s+([^}]*)\}/g, '<div style="font-size:26px;font-variant:small-caps;font-weight:bold">$1</div>');
  text = text.replace(/\{\\LARGE\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:22px;font-weight:bold">$1</div>');
  text = text.replace(/\{\\Large\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:18px;font-weight:bold">$1</div>');
  text = text.replace(/\{\\large\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:16px;font-weight:bold">$1</div>');

  // {\textbf{\Huge \scshape Name}} — nested pattern from Jake's resume
  text = text.replace(/\\textbf\{\\Huge\s*\\scshape\s+([^}]*)\}/g, '<div style="font-size:26px;font-variant:small-caps;font-weight:bold">$1</div>');

  // Size + scshape combos
  text = text.replace(/\{\\Huge\s+([^}]*)\}/g, '<div style="font-size:26px">$1</div>');
  text = text.replace(/\{\\huge\s+([^}]*)\}/g, '<div style="font-size:24px">$1</div>');
  text = text.replace(/\{\\LARGE\s+([^}]*)\}/g, '<div style="font-size:22px">$1</div>');
  text = text.replace(/\{\\Large\s+([^}]*)\}/g, '<div style="font-size:18px">$1</div>');
  text = text.replace(/\{\\large\s+([^}]*)\}/g, '<div style="font-size:16px">$1</div>');
  text = text.replace(/\{\\small\s+([^}]*)\}/g, '<span style="font-size:10px">$1</span>');
  text = text.replace(/\{\\footnotesize\s+([^}]*)\}/g, '<span style="font-size:9px">$1</span>');
  text = text.replace(/\{\\scriptsize\s+([^}]*)\}/g, '<span style="font-size:8px">$1</span>');
  text = text.replace(/\{\\tiny\s+([^}]*)\}/g, '<span style="font-size:7px">$1</span>');

  // Old-style font switches
  text = text.replace(/\{\\bf\s+([^}]*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\{\\bfseries\s+([^}]*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\{\\it\s+([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\{\\itshape\s+([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\{\\em\s+([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\{\\tt\s+([^}]*)\}/g, '<code style="font-family:monospace">$1</code>');
  text = text.replace(/\{\\ttfamily\s+([^}]*)\}/g, '<code style="font-family:monospace">$1</code>');
  text = text.replace(/\{\\sc\s+([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  text = text.replace(/\{\\scshape\s+([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  text = text.replace(/\{\\sf\s+([^}]*)\}/g, '<span style="font-family:sans-serif">$1</span>');
  text = text.replace(/\{\\rm\s+([^}]*)\}/g, "$1");

  // Standalone size switches (strip them, they just set font size contextually)
  text = text.replace(/\\(?:small|tiny|footnotesize|scriptsize|normalsize|large|Large|LARGE|huge|Huge)\b\s*/g, "");

  // \href{url}{text}
  text = text.replace(
    /\\href\{([^}]*)\}\{([^}]*)\}/g,
    '<a href="$1" style="color:#0969da;text-decoration:underline" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  // \url{...}
  text = text.replace(
    /\\url\{([^}]*)\}/g,
    '<a href="$1" style="color:#0969da;text-decoration:underline;font-family:monospace;font-size:10px" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // \leftline, \centerline, \rightline
  text = text.replace(/\\leftline\{([^}]*)\}/g, '<div style="text-align:left">$1</div>');
  text = text.replace(/\\centerline\{([^}]*)\}/g, '<div style="text-align:center">$1</div>');
  text = text.replace(/\\rightline\{([^}]*)\}/g, '<div style="text-align:right">$1</div>');

  // \footnote, \label, \ref, \cite
  text = text.replace(/\\footnote\{([^}]*)\}/g, '<sup style="font-size:8px;color:#666" title="$1">[*]</sup>');
  text = text.replace(/\\label\{[^}]*\}/g, "");
  text = text.replace(/\\ref\{([^}]*)\}/g, '<span style="color:#666">[ref]</span>');
  text = text.replace(/\\cite\{([^}]*)\}/g, '<span style="color:#666">[$1]</span>');

  // \rule{width}{height}
  text = text.replace(/\\rule\{([^}]*)\}\{([^}]*)\}/g, '<hr style="border:none;border-top:1px solid #333;margin:4px 0"/>');

  // \epsfig, \includegraphics
  text = text.replace(/\\epsfig\{[^}]*\}/g, '<span style="color:#999">[image]</span>');
  text = text.replace(/\\includegraphics(\[.*?\])?\{[^}]*\}/g, '<span style="color:#999">[image]</span>');

  // \hfill — use flexbox approach
  text = text.replace(/\\hfill\s*/g, '<span style="float:right">');
  text = text.replace(/<span style="float:right">(.*?)(?=<br|<\/div|<\/td|$)/g, '<span style="float:right">$1</span>');

  // Spacing
  text = text.replace(/\\quad/g, "&emsp;");
  text = text.replace(/\\qquad/g, "&emsp;&emsp;");
  text = text.replace(/\\enspace/g, "&ensp;");
  text = text.replace(/\\thinspace/g, "&thinsp;");
  text = text.replace(/\\,/g, "&thinsp;");
  text = text.replace(/\\;/g, "&ensp;");
  text = text.replace(/\\!/g, "");
  text = text.replace(/\\ /g, " ");

  // Vertical spacing
  text = text.replace(/\\medskip/g, '<div style="margin:8px 0"></div>');
  text = text.replace(/\\bigskip/g, '<div style="margin:16px 0"></div>');
  text = text.replace(/\\smallskip/g, '<div style="margin:4px 0"></div>');

  // Special characters
  text = text.replace(/\\%/g, "%");
  text = text.replace(/\\\$/g, "$");
  text = text.replace(/\\&/g, "&amp;");
  text = text.replace(/\\#/g, "#");
  text = text.replace(/\\_/g, "_");
  text = text.replace(/\\@/g, "");
  text = text.replace(/~/g, "&nbsp;");
  text = text.replace(/---/g, "&mdash;");
  text = text.replace(/--/g, "&ndash;");
  text = text.replace(/``/g, "\u201C");
  text = text.replace(/''/g, "\u201D");

  // Inline math $...$ — render as italic
  text = text.replace(/\$\|?\$\s*/g, " | "); // $|$ separator
  text = text.replace(/\$([^$]+)\$/g, '<span style="font-style:italic;font-family:serif">$1</span>');

  // \title, \author, \date
  text = text.replace(/\\title\{([^}]*)\}/g, '<div style="font-size:20px;font-weight:bold;text-align:center;margin:16px 0">$1</div>');
  text = text.replace(/\\author\{([^}]*)\}/g, '<div style="text-align:center;margin:8px 0">$1</div>');
  text = text.replace(/\\date\{([^}]*)\}/g, '<div style="text-align:center;color:#666;margin:4px 0">$1</div>');

  // \scshape as standalone
  text = text.replace(/\\scshape\s*/g, "");

  return text;
}

/** Replace a \command{arg} where arg may contain nested braces */
function replaceCommandWithBraces(text: string, cmd: string, replacer: (arg: string) => string): string {
  const pattern = "\\" + cmd + "{";
  let result = "";
  let searchFrom = 0;

  while (true) {
    const idx = text.indexOf(pattern, searchFrom);
    if (idx === -1) {
      result += text.slice(searchFrom);
      break;
    }
    result += text.slice(searchFrom, idx);
    const braceStart = idx + pattern.length - 1; // points to the {
    const braceEnd = findMatchingBrace(text, braceStart);
    if (braceEnd === -1) {
      result += pattern;
      searchFrom = idx + pattern.length;
      continue;
    }
    const arg = text.slice(braceStart + 1, braceEnd - 1);
    result += replacer(arg);
    searchFrom = braceEnd;
  }
  return result;
}

/** Remove stray { } braces that aren't part of HTML tags.
 *  Works from innermost braces outward, skipping braces inside HTML attributes. */
function cleanStrayBraces(text: string): string {
  for (let pass = 0; pass < 6; pass++) {
    const before = text;
    let result = "";
    let i = 0;
    while (i < text.length) {
      // Skip HTML tags entirely
      if (text[i] === "<") {
        const tagEnd = text.indexOf(">", i);
        if (tagEnd !== -1) {
          result += text.slice(i, tagEnd + 1);
          i = tagEnd + 1;
          continue;
        }
      }
      // Found an opening brace — try to find its matching close
      if (text[i] === "{") {
        const closeIdx = findClosingBraceSkippingHtml(text, i);
        if (closeIdx !== -1) {
          // Replace { content } with just content
          result += text.slice(i + 1, closeIdx);
          i = closeIdx + 1;
          continue;
        }
      }
      result += text[i];
      i++;
    }
    text = result;
    if (text === before) break;
  }
  return text;
}

/** Find the matching } for a { at position `start`, skipping over HTML tags. */
function findClosingBraceSkippingHtml(str: string, start: number): number {
  let depth = 1;
  let i = start + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === "<") {
      // Skip HTML tags
      const tagEnd = str.indexOf(">", i);
      if (tagEnd !== -1) {
        i = tagEnd + 1;
        continue;
      }
    }
    if (str[i] === "{") depth++;
    if (str[i] === "}") depth--;
    if (depth === 0) return i;
    i++;
  }
  return -1;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
