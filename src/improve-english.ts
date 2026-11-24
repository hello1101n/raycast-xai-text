import { Clipboard, closeMainWindow, getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import { showGrokFailure } from "./feedback";
import { runGrok } from "./grok";
import { buildImprovePrompt } from "./prompt";
import { readSelection } from "./selection";

export default async function Command() {
  const selection = readSelection();
  const toast = await showToast({ style: Toast.Style.Animated, title: "Improving English…" });
  try {
    const text = await selection;
    const preferences = getPreferenceValues<Preferences>();
    const improved = await runGrok(buildImprovePrompt(text, preferences.improveInstructions), preferences);
    await closeMainWindow();
    await Clipboard.paste(improved);
    await toast.hide();
    await showHUD("English improved");
  } catch (error) {
    await showGrokFailure(error, toast);
  }
}
