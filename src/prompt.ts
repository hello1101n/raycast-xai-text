const OUTPUT_RULE = "Return only the resulting text. Do not add quotes, labels, explanations, or commentary.";

export function resolveTargetLanguage(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Russian";
}

export function buildTranslatePrompt(text: string, targetLanguage: string, instructions?: string): string {
  return assemble(
    [`Translate the text below into ${targetLanguage}.`, "Keep the meaning.", OUTPUT_RULE],
    instructions,
    text,
  );
}

export function buildImprovePrompt(text: string, instructions?: string): string {
  return assemble(
    [
      "Rewrite the text below into clear, natural, correct English.",
      "Keep the original meaning and tone.",
      OUTPUT_RULE,
    ],
    instructions,
    text,
  );
}

function assemble(rules: string[], instructions: string | undefined, text: string): string {
  const lines = [...rules];
  const extra = instructions?.trim();
  if (extra) {
    lines.push("", "Additional instructions:", extra);
  }
  lines.push("", "Text:", text);
  return lines.join("\n");
}

const QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['"', '"'],
  ["'", "'"],
  ["“", "”"],
  ["‘", "’"],
];

export function cleanModelOutput(raw: string): string {
  let text = stripAnsi(raw).replace(/\r\n/g, "\n").trim();
  const fenced = text.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  if (fenced?.[1] !== undefined) {
    text = fenced[1].trim();
  }
  for (const [open, close] of QUOTE_PAIRS) {
    if (text.startsWith(open) && text.endsWith(close) && text.length > open.length + close.length) {
      text = text.slice(open.length, text.length - close.length).trim();
      break;
    }
  }
  return text.trim();
}

function stripAnsi(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) === 27 && value[index + 1] === "[") {
      index += 2;
      while (index < value.length && !isAnsiFinal(value.charCodeAt(index))) {
        index += 1;
      }
      continue;
    }
    output += value[index];
  }
  return output;
}

function isAnsiFinal(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
