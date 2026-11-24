import { getSelectedText } from "@raycast/api";
import { GrokFailure } from "./grok";

export async function readSelection(): Promise<string> {
  try {
    const text = await getSelectedText();
    if (text.trim()) {
      return text;
    }
  } catch {
    // Raycast throws when the frontmost app has no selection.
  }
  throw new GrokFailure("no-selection", "Select some text, then run the command again.");
}
