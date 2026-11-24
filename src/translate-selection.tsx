import {
  Action,
  ActionPanel,
  Clipboard,
  closeMainWindow,
  Detail,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { showGrokFailure } from "./feedback";
import { runGrok } from "./grok";
import { buildTranslatePrompt, resolveTargetLanguage } from "./prompt";
import { Preferences } from "./preferences";
import { readSelection } from "./selection";

export default function Command() {
  const [result, setResult] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const selection = readSelection();

    void (async () => {
      const toast = await showToast({ style: Toast.Style.Animated, title: "Translating…" });
      try {
        const text = await selection;
        const preferences = getPreferenceValues<Preferences>();
        const translated = await runGrok(
          buildTranslatePrompt(
            text,
            resolveTargetLanguage(preferences.targetLanguage),
            preferences.translateInstructions,
          ),
          preferences,
        );
        if (cancelled) {
          return;
        }
        setResult(translated);
        await toast.hide();
      } catch (error) {
        if (!cancelled) {
          await showGrokFailure(error, toast);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle="Translation"
      markdown={result ? fenced(result) : ""}
      actions={
        result ? (
          <ActionPanel>
            <Action title="Paste Translation" onAction={() => paste(result)} />
            <Action.CopyToClipboard title="Copy Translation" content={result} />
          </ActionPanel>
        ) : null
      }
    />
  );
}

async function paste(text: string): Promise<void> {
  await closeMainWindow();
  await Clipboard.paste(text);
}

function fenced(text: string): string {
  const fence = "`".repeat(Math.max(3, longestRun(text, "`") + 1));
  return `${fence}\n${text}\n${fence}`;
}

function longestRun(text: string, char: string): number {
  let longest = 0;
  let current = 0;
  for (const item of text) {
    if (item === char) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}
