import { execFile } from "child_process";
import { accessSync, constants } from "fs";
import { homedir, tmpdir } from "os";
import { delimiter, join } from "path";
import { cleanModelOutput } from "./prompt";

export const INSTALL_DOCS_URL = "https://docs.x.ai/build/overview";
const TIMEOUT_MS = 60_000;
const NOT_FOUND_MESSAGE = "Install the Grok CLI, then run grok login.";

// Tool ids accepted by grok 1.0.92. Unknown names only warn, so they are omitted.
const DISALLOWED_TOOLS = [
  "read_file",
  "grep",
  "grep_files",
  "list_dir",
  "search_replace",
  "apply_patch",
  "write",
  "bash",
  "run_terminal_cmd",
  "run_terminal_command",
  "web_search",
  "web_fetch",
  "x_search",
  "todo_write",
  "task",
  "kill_task",
  "get_task_output",
  "search_tool",
  "use_tool",
  "lsp",
  "spawn_subagent",
  "Agent",
  "read",
  "edit",
  "glob",
  "view_image",
  "ask_user_question",
  "skill",
].join(",");

export type GrokFailureKind = "no-selection" | "not-found" | "not-signed-in" | "timeout" | "failed";

export class GrokFailure extends Error {
  readonly kind: GrokFailureKind;

  constructor(kind: GrokFailureKind, message: string) {
    super(message);
    this.name = "GrokFailure";
    this.kind = kind;
  }
}

export interface GrokRunOptions {
  grokPath?: string;
  model?: string;
}

export function findGrokBinary(
  explicitPath: string | undefined,
  pathEnv = process.env.PATH ?? "",
  home = homedir(),
): string | undefined {
  const explicit = explicitPath?.trim();
  if (explicit) {
    return isExecutable(explicit) ? explicit : undefined;
  }

  const dirs = [...pathEnv.split(delimiter).filter(Boolean), ...commonBinDirs(home)];
  const seen = new Set<string>();
  for (const dir of dirs) {
    const candidate = join(dir, "grok");
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    if (isExecutable(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function buildGrokArgs(prompt: string, model: string | undefined, cwd: string): string[] {
  const args = [
    "--no-auto-update",
    "--no-alt-screen",
    "--output-format",
    "plain",
    "--max-turns",
    "1",
    "--permission-mode",
    "dontAsk",
    "--no-plan",
    "--no-subagents",
    "--no-memory",
    "--disable-web-search",
    "--verbatim",
    "--cwd",
    cwd,
    "--disallowed-tools",
    DISALLOWED_TOOLS,
  ];
  const chosen = model?.trim();
  if (chosen) {
    args.push("--model", chosen);
  }
  // One argv so a prompt that starts with "-" is not parsed as a flag.
  args.push(`-p=${prompt}`);
  return args;
}

export function runGrok(prompt: string, options: GrokRunOptions): Promise<string> {
  const binary = findGrokBinary(options.grokPath);
  if (!binary) {
    return Promise.reject(new GrokFailure("not-found", NOT_FOUND_MESSAGE));
  }

  const cwd = tmpdir();
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      buildGrokArgs(prompt, options.model, cwd),
      {
        cwd,
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
        env: childEnv(),
      },
      (error, stdout, stderr) => {
        try {
          resolve(interpretGrokResult(error, stdout.toString(), stderr.toString()));
        } catch (failure) {
          reject(failure);
        }
      },
    );
  });
}

function commonBinDirs(home: string): string[] {
  return [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    join(home, ".local", "bin"),
    join(home, ".grok", "bin"),
    join(home, ".npm-global", "bin"),
  ];
}

function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // Use the grok login session. Do not fall back to an API key.
  delete env.XAI_API_KEY;
  env.GROK_DISABLE_AUTOUPDATER = "1";
  env.PATH = [...commonBinDirs(homedir()), env.PATH ?? ""].filter(Boolean).join(delimiter);
  return env;
}

function isExecutable(filePath: string): boolean {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

type GrokProcessError = {
  message: string;
  killed?: boolean;
  code?: string | number;
};

export function interpretGrokResult(error: GrokProcessError | null, stdout: string, stderr: string): string {
  if (error) {
    if (isNotSignedIn(`${stderr}\n${error.message}`)) {
      throw new GrokFailure("not-signed-in", "Run `grok login` in a terminal, then try again.");
    }
    if (isTimeout(error)) {
      throw new GrokFailure("timeout", "The Grok CLI took too long. Try again.");
    }
    if (error.code === "ENOENT") {
      throw new GrokFailure("not-found", NOT_FOUND_MESSAGE);
    }
    throw new GrokFailure("failed", failureDetail(stderr, error.message));
  }
  const cleaned = cleanModelOutput(stdout);
  if (!cleaned) {
    throw new GrokFailure("failed", "Grok returned no text.");
  }
  return cleaned;
}

function isNotSignedIn(output: string): boolean {
  return /not signed in/i.test(output);
}

function isTimeout(error: GrokProcessError): boolean {
  return error.killed === true || error.code === "ETIMEDOUT" || /timed out/i.test(error.message);
}

function failureDetail(stderr: string, fallback: string): string {
  const line = stderr
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 0 && !item.startsWith("warning:"));
  const detail = line ?? fallback;
  return detail.length > 180 ? `${detail.slice(0, 177)}...` : detail;
}
