import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildGrokArgs, findGrokBinary } from "../src/grok";
import { buildImprovePrompt, buildTranslatePrompt, cleanModelOutput, resolveTargetLanguage } from "../src/prompt";

describe("prompts", () => {
  it("asks for a bare translation into the target language", () => {
    const prompt = buildTranslatePrompt("Hello", "Russian");
    assert.match(prompt, /into Russian/);
    assert.match(prompt, /Do not add quotes, labels, explanations, or commentary/);
    assert.match(prompt, /Text:\nHello$/);
    assert.doesNotMatch(prompt, /Additional instructions/);
  });

  it("appends translation instructions only when they are set", () => {
    const withExtra = buildTranslatePrompt("Hello", "Russian", "  Keep names in English.  ");
    assert.match(withExtra, /Additional instructions:\nKeep names in English\.\n\nText:\nHello$/);
    assert.ok(withExtra.indexOf("Additional instructions:") < withExtra.indexOf("Text:"));

    assert.doesNotMatch(buildTranslatePrompt("Hello", "Russian", "   "), /Additional instructions/);
  });

  it("asks for natural English and keeps meaning and tone", () => {
    const prompt = buildImprovePrompt("this are wrong");
    assert.match(prompt, /clear, natural, correct English/);
    assert.match(prompt, /Keep the original meaning and tone/);
    assert.match(prompt, /Text:\nthis are wrong$/);
    assert.doesNotMatch(prompt, /Additional instructions/);
  });

  it("appends English instructions only when they are set", () => {
    const prompt = buildImprovePrompt("hello", "Use British spelling.");
    assert.match(prompt, /Additional instructions:\nUse British spelling\.\n\nText:\nhello$/);
  });

  it("defaults the target language to Russian", () => {
    assert.equal(resolveTargetLanguage(undefined), "Russian");
    assert.equal(resolveTargetLanguage("  "), "Russian");
    assert.equal(resolveTargetLanguage(" French "), "French");
  });
});

describe("cleanModelOutput", () => {
  it("trims plain text and strips ansi codes", () => {
    assert.equal(cleanModelOutput("  \u001b[32mHello\u001b[0m  "), "Hello");
  });

  it("strips one pair of wrapping quotes", () => {
    assert.equal(cleanModelOutput('"Привет"'), "Привет");
    assert.equal(cleanModelOutput("“Hello”"), "Hello");
    assert.equal(cleanModelOutput("'Hello'"), "Hello");
    assert.equal(cleanModelOutput("Say \"hello\" today"), 'Say "hello" today');
    assert.equal(cleanModelOutput('"unterminated'), '"unterminated');
  });

  it("strips a surrounding code fence and then wrapping quotes", () => {
    assert.equal(cleanModelOutput("```text\n\"Hello\"\n```"), "Hello");
    assert.equal(cleanModelOutput("```\nline one\nline two\n```"), "line one\nline two");
  });
});

describe("grok invocation", () => {
  it("builds a text-only headless argv and keeps a dashed prompt intact", () => {
    const args = buildGrokArgs("--help me", "  grok-4  ", "/tmp/work");
    assert.equal(args.at(-1), "-p=--help me");
    assert.deepEqual(pair(args, "--output-format"), "plain");
    assert.deepEqual(pair(args, "--model"), "grok-4");
    assert.deepEqual(pair(args, "--max-turns"), "1");
    assert.deepEqual(pair(args, "--permission-mode"), "dontAsk");
    assert.deepEqual(pair(args, "--cwd"), "/tmp/work");
    assert.ok(args.includes("--verbatim"));
    assert.ok(args.includes("--no-auto-update"));
    assert.ok(args.includes("--no-alt-screen"));
    assert.ok(args.includes("--no-plan"));
    assert.ok(args.includes("--no-subagents"));
    assert.ok(args.includes("--no-memory"));
    assert.ok(args.includes("--disable-web-search"));
    assert.match(pair(args, "--disallowed-tools") ?? "", /read_file,grep/);
    assert.equal(buildGrokArgs("Hello", "  ", "/tmp").includes("--model"), false);
  });

  it("uses an explicit binary and otherwise searches common locations", () => {
    const home = mkdtempSync(join(tmpdir(), "grok-home-"));
    const missing = join(home, "missing-grok");
    assert.equal(findGrokBinary(missing, "", home), undefined);

    const explicit = join(home, "grok");
    writeFileSync(explicit, "");
    chmodSync(explicit, 0o755);
    assert.equal(findGrokBinary(explicit, "", home), explicit);

    const binDir = join(home, ".grok", "bin");
    mkdirSync(binDir, { recursive: true });
    const detected = join(binDir, "grok");
    writeFileSync(detected, "");
    chmodSync(detected, 0o755);
    assert.equal(findGrokBinary(undefined, "", home), detected);

    const pathDir = mkdtempSync(join(tmpdir(), "grok-path-"));
    const onPath = join(pathDir, "grok");
    writeFileSync(onPath, "");
    chmodSync(onPath, 0o755);
    assert.equal(findGrokBinary("  ", pathDir, mkdtempSync(join(tmpdir(), "empty-home-"))), onPath);
  });
});

function pair(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}
