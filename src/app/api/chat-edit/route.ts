import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { latex, message } = await req.json();

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 500 });
  }

  // MiniMax uses Anthropic-compatible API format
  const response = await fetch("https://api.minimax.io/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "MiniMax-M2",
      max_tokens: 16000,
      temperature: 0.1,
      system: `You edit LaTeX resumes. You must follow these rules EXACTLY:

ABSOLUTE RULES - VIOLATION IS FAILURE:
1. Copy the ENTIRE original LaTeX source character-for-character
2. ONLY add, remove, or modify the SPECIFIC lines needed for the user's request
3. DO NOT rename existing sections (if "Technical Skills" exists, keep it as "Technical Skills")
4. DO NOT reformat, reindent, or reorganize ANY existing code
5. DO NOT change \\usepackage declarations or preamble unless explicitly asked
6. DO NOT "improve" or "clean up" anything — preserve everything exactly

OUTPUT FORMAT - Return ONLY this JSON, nothing else:
{"explanation": "Brief description of the minimal change made", "latex": "FULL LaTeX source with surgical edit"}

Example: If asked to "add a Hobbies section" to a document, you copy the entire document exactly and insert ONLY a new \\section{Hobbies} block in an appropriate location. Everything else stays identical.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here is the current LaTeX source:\n\n${latex}\n\nUser request: ${message}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    let friendlyError = `MiniMax API error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
      if (parsed.error?.message) {
        friendlyError = parsed.error.message;
      }
    } catch {
      // Leave default message
    }

    return NextResponse.json({ error: friendlyError }, { status: response.status });
  }

  const data = await response.json() as {
    content?: { type: string; text?: string; thinking?: string }[];
  };

  // MiniMax returns content blocks — find the text block
  const textBlock = data.content?.find((b) => b.type === "text");
  let text = textBlock?.text ?? "";

  // Also check if there's content in thinking blocks we need to handle
  if (!text) {
    // Try concatenating all text blocks
    text = data.content
      ?.filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("") ?? "";
  }

  if (!text) {
    return NextResponse.json({ 
      error: "No response content from MiniMax",
      debug: JSON.stringify(data.content?.slice(0, 2))
    }, { status: 500 });
  }

  // Aggressively extract JSON from the response
  // 1. Strip markdown code fences
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. If it doesn't start with {, try to find JSON object in the text
  if (!cleaned.startsWith("{")) {
    const jsonMatch = cleaned.match(/\{[\s\S]*"explanation"[\s\S]*"latex"[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
  }

  // 3. Try to parse directly
  try {
    const parsed = JSON.parse(cleaned) as { explanation: string; latex: string };
    if (!parsed.explanation || !parsed.latex) {
      throw new Error("Missing fields");
    }
    return NextResponse.json(parsed);
  } catch {
    // JSON.parse failed — try manual extraction
    // This handles cases where the JSON is valid but has edge cases
    
    // Extract explanation (text between "explanation": " and next ")
    const explanationMatch = cleaned.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    
    // Extract latex — find "latex": " then capture until the final "}
    // The latex field contains many escaped characters, so we need to be careful
    const latexStartMatch = cleaned.match(/"latex"\s*:\s*"/);
    
    if (explanationMatch && latexStartMatch) {
      const latexStartIndex = cleaned.indexOf(latexStartMatch[0]) + latexStartMatch[0].length;
      // Find the closing "} — the latex value ends with "} or "\n}
      let latexEndIndex = cleaned.lastIndexOf('"}');
      if (latexEndIndex === -1) {
        latexEndIndex = cleaned.lastIndexOf('"');
      }
      
      if (latexEndIndex > latexStartIndex) {
        const latexEscaped = cleaned.slice(latexStartIndex, latexEndIndex);
        try {
          // Parse as a JSON string to unescape \\n, \\t, etc.
          const latex = JSON.parse(`"${latexEscaped}"`);
          return NextResponse.json({
            explanation: explanationMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            latex,
          });
        } catch {
          // Last attempt: use the raw string with basic unescaping
          const latex = latexEscaped
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          return NextResponse.json({
            explanation: explanationMatch[1],
            latex,
          });
        }
      }
    }

    // Return error with truncated raw output for debugging
    const preview = text.length > 300 ? text.slice(0, 300) + "..." : text;
    return NextResponse.json(
      { error: `Could not parse AI response. Preview: ${preview}` },
      { status: 500 }
    );
  }
}
