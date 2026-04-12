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

function parseLatexToHtml(source: string): string {
  // ── Step 1: Expand user-defined \newcommand macros ──
  // Collect \newcommand definitions and remove them from source
  const macros: { name: string; numArgs: number; body: string }[] = [];

  // Match \newcommand{\name}[numArgs]{body}  (handles nested braces for body)
  let macroSource = source;
  const newCmdRegex = /\\newcommand\{\\([a-zA-Z]+)\}(?:\[(\d)\])?\{/g;
  let m: RegExpExecArray | null;
  const indicesToRemove: [number, number][] = [];

  while ((m = newCmdRegex.exec(macroSource)) !== null) {
    const name = m[1];
    const numArgs = m[2] ? parseInt(m[2]) : 0;
    // Find the matching closing brace for the body
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

  // Remove \newcommand definitions from source (reverse order to preserve indices)
  for (let idx = indicesToRemove.length - 1; idx >= 0; idx--) {
    macroSource = macroSource.slice(0, indicesToRemove[idx][0]) + macroSource.slice(indicesToRemove[idx][1]);
  }

  // Also handle \renewcommand the same way
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

  // Now expand macros in the source — do multiple passes for nested macros
  for (let pass = 0; pass < 4; pass++) {
    for (const macro of macros) {
      if (macro.numArgs === 0) {
        source = source.split("\\" + macro.name).join(macro.body);
      } else {
        // Build a regex that captures the right number of brace-delimited args
        const escapedName = macro.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const argPattern = "\\{([^}]*)\\}".repeat(macro.numArgs);
        const regex = new RegExp("\\\\" + escapedName + "\\s*" + argPattern, "g");
        source = source.replace(regex, (...args) => {
          let result = macro.body;
          for (let a = 0; a < macro.numArgs; a++) {
            result = result.split("#" + (a + 1)).join(args[a + 1] || "");
          }
          return result;
        });
      }
    }
  }

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

  // Strip preamble commands that might leak through
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
  content = content.replace(/\\setlength\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\fancyhf\{[^}]*\}/g, "");
  content = content.replace(/\\fancyfoot\{?\}?/g, "");

  // Remove \begin{document} / \end{document} leaks
  content = content.replace(/\\begin\{document\}/g, "");
  content = content.replace(/\\end\{document\}/g, "");

  // ── Environments ──

  // center
  content = content.replace(
    /\\begin\{center\}([\s\S]*?)\\end\{center\}/g,
    (_, inner) => `<div style="text-align:center">${inner}</div>`
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

  // tabular / tabular*
  content = content.replace(
    /\\begin\{tabular\*?\}(?:\{[^}]*\})?(?:\[[^\]]*\])?(?:\{[^}]*\})?([\s\S]*?)\\end\{tabular\*?\}/g,
    (_, inner) => {
      const rows = inner.split(/\\\\\s*(?:\[.*?\])?/).filter((r: string) => r.trim() && !r.trim().startsWith("\\hline"));
      const tableRows = rows.map((row: string) => {
        const cells = row.split(/&/).map((c: string) => {
          let cell = c.trim().replace(/\\hline/g, "").replace(/\\cline\{[^}]*\}/g, "");
          // strip @{...} column specs that leak
          cell = cell.replace(/@\{[^}]*\}/g, "");
          const multicolMatch = cell.match(/\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}/);
          if (multicolMatch) {
            return `<td colspan="${multicolMatch[1]}" style="padding:2px 4px">${processInline(multicolMatch[2].trim())}</td>`;
          }
          return `<td style="padding:2px 4px">${processInline(cell)}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      });
      return `<table style="border-collapse:collapse;margin:4px 0;width:100%">${tableRows.join("")}</table>`;
    }
  );

  // itemize
  content = content.replace(
    /\\begin\{itemize\}(\[.*?\])?([\s\S]*?)\\end\{itemize\}/g,
    (_, _opts, inner) => {
      const items = inner
        .split(/\\item\s*/)
        .filter((s: string) => s.trim())
        .map((s: string) => `<li style="margin-bottom:2px;font-size:10pt">${processInline(s.trim())}</li>`)
        .join("");
      return `<ul style="margin:2px 0;padding-left:18px;list-style-type:disc">${items}</ul>`;
    }
  );

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

  // comment environment (hide contents)
  content = content.replace(
    /\\begin\{comment\}([\s\S]*?)\\end\{comment\}/g,
    ""
  );

  // Strip any remaining unknown environments
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

  // Strip remaining \command{arg}
  content = content.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  // Strip remaining \command with no args
  content = content.replace(/\\[a-zA-Z]+/g, "");

  // Clean excessive breaks
  content = content.replace(/(<br\s*\/?>){4,}/g, "<br/><br/>");

  return content.trim();
}

function processInline(text: string): string {
  // \textbf{...}
  text = text.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
  // \textit{...}
  text = text.replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
  // \emph{...}
  text = text.replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>");
  // \underline{...}
  text = text.replace(/\\underline\{([^}]*)\}/g, "<u>$1</u>");
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

  // \hfill
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
  text = text.replace(/\$\|?\$\s*/g, " | "); // $|$ separator pattern common in resumes
  text = text.replace(/\$([^$]+)\$/g, '<span style="font-style:italic;font-family:serif">$1</span>');

  // \title, \author, \date
  text = text.replace(/\\title\{([^}]*)\}/g, '<div style="font-size:20px;font-weight:bold;text-align:center;margin:16px 0">$1</div>');
  text = text.replace(/\\author\{([^}]*)\}/g, '<div style="text-align:center;margin:8px 0">$1</div>');
  text = text.replace(/\\date\{([^}]*)\}/g, '<div style="text-align:center;color:#666;margin:4px 0">$1</div>');

  // \scshape as standalone
  text = text.replace(/\\scshape\s*/g, "");

  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
