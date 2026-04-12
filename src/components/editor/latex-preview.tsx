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
  // Extract content between the LAST \begin{document} and \end{document}
  const docMatches = [...source.matchAll(/\\begin\{document\}/g)];
  let content: string;
  if (docMatches.length > 0) {
    const lastBegin = docMatches[docMatches.length - 1].index! + docMatches[docMatches.length - 1][0].length;
    const endMatch = source.lastIndexOf("\\end{document}");
    content = endMatch > lastBegin ? source.slice(lastBegin, endMatch) : source.slice(lastBegin);
  } else {
    // No \begin{document} — strip preamble commands and render what's left
    content = source;
  }

  // Remove comments
  content = content.replace(/%.*$/gm, "");

  // Strip preamble commands that might leak through
  content = content.replace(/\\documentclass(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\usepackage(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\renewcommand\{[^}]*\}(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\newcommand\{[^}]*\}(\[.*?\])?\{[^}]*\}/g, "");
  content = content.replace(/\\setlength\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\setcounter\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\addtolength\{[^}]*\}\{[^}]*\}/g, "");
  content = content.replace(/\\titleformat\{[^}]*\}(?:\{[^}]*\}|\[[^\]]*\])*/g, "");
  content = content.replace(/\\titlespacing\*?\{[^}]*\}(?:\{[^}]*\})*/g, "");
  content = content.replace(/\\pagestyle\{[^}]*\}/g, "");
  content = content.replace(/\\thispagestyle\{[^}]*\}/g, "");
  content = content.replace(/\\pagenumbering\{[^}]*\}/g, "");
  content = content.replace(/\\epsfxsize[^\\{\n]*/g, "");

  // Remove remaining \begin{document} / \end{document} if any leaked
  content = content.replace(/\\begin\{document\}/g, "");
  content = content.replace(/\\end\{document\}/g, "");

  // Process environments BEFORE inline processing

  // Process centered blocks
  content = content.replace(
    /\\begin\{center\}([\s\S]*?)\\end\{center\}/g,
    (_, inner) => `<div style="text-align:center">${inner}</div>`
  );

  // Process figure environments — show placeholder
  content = content.replace(
    /\\begin\{figure\}(\[.*?\])?([\s\S]*?)\\end\{figure\}/g,
    (_, _opts, inner) => {
      const caption = inner.match(/\\caption\{([^}]*)\}/);
      return `<div style="text-align:center;margin:16px 0;padding:12px;border:1px dashed #999;color:#666"><em>[Figure${caption ? ': ' + caption[1] : ''}]</em></div>`;
    }
  );

  // Process table environments
  content = content.replace(
    /\\begin\{table\}(\[.*?\])?([\s\S]*?)\\end\{table\}/g,
    (_, _opts, inner) => `<div style="margin:12px 0">${inner}</div>`
  );

  // Process tabular environments
  content = content.replace(
    /\\begin\{tabular\*?\}(\{[^}]*\})?([\s\S]*?)\\end\{tabular\*?\}/g,
    (_, _cols, inner) => {
      const rows = inner.split(/\\\\\s*(?:\[.*?\])?/).filter((r: string) => r.trim() && !r.trim().startsWith("\\hline"));
      const tableRows = rows.map((row: string) => {
        const cells = row.split(/&/).map((c: string) => {
          let cell = c.trim().replace(/\\hline/g, "").replace(/\\cline\{[^}]*\}/g, "");
          const multicolMatch = cell.match(/\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}/);
          if (multicolMatch) {
            return `<td colspan="${multicolMatch[1]}" style="padding:4px 8px;border-bottom:1px solid #ddd">${processInline(multicolMatch[2].trim())}</td>`;
          }
          return `<td style="padding:4px 8px;border-bottom:1px solid #ddd">${processInline(cell)}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      });
      return `<table style="border-collapse:collapse;margin:8px 0;width:100%">${tableRows.join("")}</table>`;
    }
  );

  // Process itemize environments
  content = content.replace(
    /\\begin\{itemize\}(\[.*?\])?([\s\S]*?)\\end\{itemize\}/g,
    (_, _opts, inner) => {
      const items = inner
        .split(/\\item\s*/)
        .filter((s: string) => s.trim())
        .map((s: string) => `<li style="margin-bottom:2px">${processInline(s.trim())}</li>`)
        .join("");
      return `<ul style="margin:4px 0;padding-left:20px">${items}</ul>`;
    }
  );

  // Process enumerate
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

  // Process description
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

  // Process equation/eqnarray/math environments as monospace blocks
  content = content.replace(
    /\\begin\{(equation|eqnarray|align|displaymath|gather)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, _env, inner) => {
      const cleaned = inner.replace(/\\label\{[^}]*\}/g, "").replace(/\\nonumber/g, "").trim();
      return `<div style="text-align:center;margin:12px 0;font-family:serif;font-style:italic;padding:8px;background:#f9f9f9;border-radius:4px">${escapeHtml(cleaned)}</div>`;
    }
  );

  // Process verbatim
  content = content.replace(
    /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
    (_, inner) => `<pre style="font-family:monospace;background:#f5f5f5;padding:8px;margin:8px 0;white-space:pre-wrap">${escapeHtml(inner)}</pre>`
  );

  // Process quote/quotation
  content = content.replace(
    /\\begin\{(quote|quotation)\}([\s\S]*?)\\end\{\1\}/g,
    (_, _env, inner) => `<blockquote style="margin:8px 20px;padding-left:12px;border-left:3px solid #ccc">${processInline(inner)}</blockquote>`
  );

  // Process flushleft/flushright
  content = content.replace(
    /\\begin\{flushleft\}([\s\S]*?)\\end\{flushleft\}/g,
    (_, inner) => `<div style="text-align:left">${processInline(inner)}</div>`
  );
  content = content.replace(
    /\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g,
    (_, inner) => `<div style="text-align:right">${processInline(inner)}</div>`
  );

  // Process minipage
  content = content.replace(
    /\\begin\{minipage\}(\[.*?\])?\{[^}]*\}([\s\S]*?)\\end\{minipage\}/g,
    (_, _opts, inner) => `<div style="display:inline-block;vertical-align:top">${processInline(inner)}</div>`
  );

  // Strip any remaining unknown environments
  content = content.replace(/\\begin\{[^}]*\}(\[.*?\])?(\{[^}]*\})?/g, "");
  content = content.replace(/\\end\{[^}]*\}/g, "");

  // Process sections
  content = content.replace(
    /\\part\*?\{([^}]*)\}/g,
    (_, title) => `<h1 style="font-size:20px;font-weight:bold;text-align:center;margin:24px 0 12px 0">${processInline(title)}</h1>`
  );
  content = content.replace(
    /\\section\*?\{([^}]*)\}/g,
    (_, title) =>
      `<h2 style="font-size:14px;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:3px;margin:16px 0 8px 0;letter-spacing:0.5px">${processInline(title)}</h2>`
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

  // Process remaining inline commands
  content = processInline(content);

  // Convert line breaks: \\ or \\[Xpt] to <br>
  content = content.replace(/\\\\(\[\d+[a-z]*\])?/g, "<br/>");

  // Convert double newlines to paragraph breaks
  content = content.replace(/\n\s*\n/g, "<br/><br/>");

  // Clean up remaining commands
  content = content.replace(/\\(?:vspace|hspace)\*?\{[^}]*\}/g, "");
  content = content.replace(/\\(?:vfill|newpage|clearpage|pagebreak|linebreak)/g, "<br/>");
  content = content.replace(/\\noindent\s*/g, "");
  content = content.replace(/\\(?:maketitle|tableofcontents|makeatletter|makeatother|centering|raggedright|raggedleft)/g, "");
  content = content.replace(/\\(?:protect|relax|strut|null|phantom\{[^}]*\})/g, "");
  content = content.replace(/\\(?:parindent|parskip|baselineskip|lineskip)\s*[=]?\s*\d*[a-z]*/g, "");

  // Strip any remaining \command{arg} that wasn't handled
  content = content.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  // Strip any remaining \command with no args
  content = content.replace(/\\[a-zA-Z]+/g, "");

  // Clean up excessive whitespace/breaks
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
  // \textrm{...}
  text = text.replace(/\\textrm\{([^}]*)\}/g, '$1');
  // \textsf{...}
  text = text.replace(/\\textsf\{([^}]*)\}/g, '<span style="font-family:sans-serif">$1</span>');
  // \text{...} (inside math)
  text = text.replace(/\\text\{([^}]*)\}/g, '$1');
  // \mbox{...}
  text = text.replace(/\\mbox\{([^}]*)\}/g, '$1');
  // \makebox{...}
  text = text.replace(/\\makebox(\[.*?\])?\{([^}]*)\}/g, '$2');
  // \fbox{...}
  text = text.replace(/\\fbox\{([^}]*)\}/g, '<span style="border:1px solid #333;padding:2px 4px">$1</span>');
  // \colorbox{color}{text}
  text = text.replace(/\\colorbox\{[^}]*\}\{([^}]*)\}/g, '$1');
  // \textcolor{color}{text}
  text = text.replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/g, '$1');

  // Size switches inside braces: {\LARGE ...}
  text = text.replace(/\{\\LARGE\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:22px;font-weight:bold">$1</div>');
  text = text.replace(/\{\\Large\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:18px;font-weight:bold">$1</div>');
  text = text.replace(/\{\\large\s*\\bfseries\s+([^}]*)\}/g, '<div style="font-size:16px;font-weight:bold">$1</div>');
  text = text.replace(/\{\\Huge\s+([^}]*)\}/g, '<div style="font-size:28px">$1</div>');
  text = text.replace(/\{\\huge\s+([^}]*)\}/g, '<div style="font-size:24px">$1</div>');
  text = text.replace(/\{\\LARGE\s+([^}]*)\}/g, '<div style="font-size:22px">$1</div>');
  text = text.replace(/\{\\Large\s+([^}]*)\}/g, '<div style="font-size:18px">$1</div>');
  text = text.replace(/\{\\large\s+([^}]*)\}/g, '<div style="font-size:16px">$1</div>');
  text = text.replace(/\{\\small\s+([^}]*)\}/g, '<span style="font-size:10px">$1</span>');
  text = text.replace(/\{\\footnotesize\s+([^}]*)\}/g, '<span style="font-size:9px">$1</span>');
  text = text.replace(/\{\\scriptsize\s+([^}]*)\}/g, '<span style="font-size:8px">$1</span>');
  text = text.replace(/\{\\tiny\s+([^}]*)\}/g, '<span style="font-size:7px">$1</span>');

  // Old-style font switches in braces: {\bf text}, {\it text}, {\em text}, {\tt text}
  text = text.replace(/\{\\bf\s+([^}]*)\}/g, '<strong>$1</strong>');
  text = text.replace(/\{\\bfseries\s+([^}]*)\}/g, '<strong>$1</strong>');
  text = text.replace(/\{\\it\s+([^}]*)\}/g, '<em>$1</em>');
  text = text.replace(/\{\\itshape\s+([^}]*)\}/g, '<em>$1</em>');
  text = text.replace(/\{\\em\s+([^}]*)\}/g, '<em>$1</em>');
  text = text.replace(/\{\\tt\s+([^}]*)\}/g, '<code style="font-family:monospace">$1</code>');
  text = text.replace(/\{\\ttfamily\s+([^}]*)\}/g, '<code style="font-family:monospace">$1</code>');
  text = text.replace(/\{\\sc\s+([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  text = text.replace(/\{\\scshape\s+([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  text = text.replace(/\{\\sf\s+([^}]*)\}/g, '<span style="font-family:sans-serif">$1</span>');
  text = text.replace(/\{\\rm\s+([^}]*)\}/g, '$1');

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

  // \leftline{...}
  text = text.replace(/\\leftline\{([^}]*)\}/g, '<div style="text-align:left">$1</div>');
  // \centerline{...}
  text = text.replace(/\\centerline\{([^}]*)\}/g, '<div style="text-align:center">$1</div>');
  // \rightline{...}
  text = text.replace(/\\rightline\{([^}]*)\}/g, '<div style="text-align:right">$1</div>');

  // \footnote{...}
  text = text.replace(/\\footnote\{([^}]*)\}/g, '<sup style="font-size:8px;color:#666" title="$1">[*]</sup>');
  // \label{...} and \ref{...}
  text = text.replace(/\\label\{[^}]*\}/g, "");
  text = text.replace(/\\ref\{([^}]*)\}/g, '<span style="color:#666">[ref]</span>');
  // \cite{...}
  text = text.replace(/\\cite\{([^}]*)\}/g, '<span style="color:#666">[$1]</span>');

  // \rule{width}{height}
  text = text.replace(/\\rule\{([^}]*)\}\{([^}]*)\}/g, '<hr style="border:none;border-top:1px solid #333;margin:4px 0"/>');

  // \epsfig{...}
  text = text.replace(/\\epsfig\{[^}]*\}/g, '<span style="color:#999">[image]</span>');
  // \includegraphics
  text = text.replace(/\\includegraphics(\[.*?\])?\{[^}]*\}/g, '<span style="color:#999">[image]</span>');

  // \hfill
  text = text.replace(/\\hfill\s*/g, '<span style="float:right">');
  // Close hfill spans at line breaks
  text = text.replace(/<span style="float:right">(.*?)(?=<br|<\/div|$)/g, '<span style="float:right">$1</span>');

  // Spacing commands
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
  text = text.replace(/\\,/g, " ");
  text = text.replace(/~/g, "&nbsp;");
  text = text.replace(/---/g, "&mdash;");
  text = text.replace(/--/g, "&ndash;");
  text = text.replace(/``/g, "\u201C");
  text = text.replace(/''/g, "\u201D");
  text = text.replace(/`/g, "\u2018");
  text = text.replace(/'/g, "\u2019");

  // Inline math $...$ — render as italic serif
  text = text.replace(/\$([^$]+)\$/g, '<span style="font-style:italic;font-family:serif">$1</span>');

  // \title{...}
  text = text.replace(/\\title\{([^}]*)\}/g, '<div style="font-size:20px;font-weight:bold;text-align:center;margin:16px 0">$1</div>');
  // \author{...}
  text = text.replace(/\\author\{([^}]*)\}/g, '<div style="text-align:center;margin:8px 0">$1</div>');
  // \date{...}
  text = text.replace(/\\date\{([^}]*)\}/g, '<div style="text-align:center;color:#666;margin:4px 0">$1</div>');

  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
