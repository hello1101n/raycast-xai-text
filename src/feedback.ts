import { open, showToast, Toast } from "@raycast/api";
import { GrokFailure, INSTALL_DOCS_URL } from "./grok";

export async function showGrokFailure(error: unknown, toast?: Toast): Promise<void> {
  const info = describe(error);
  const target = toast ?? (await showToast({ style: Toast.Style.Failure, title: info.title }));
  target.style = Toast.Style.Failure;
  target.title = info.title;
  target.message = info.message;
  if (info.openDocs) {
    target.primaryAction = {
      title: "Open Install Docs",
      onAction: () => {
        void open(INSTALL_DOCS_URL);
      },
    };
  }
}

function describe(error: unknown): { title: string; message: string; openDocs: boolean } {
  if (error instanceof GrokFailure) {
    switch (error.kind) {
      case "no-selection":
        return { title: "No text selected", message: error.message, openDocs: false };
      case "not-found":
        return { title: "Grok CLI not found", message: error.message, openDocs: true };
      case "not-signed-in":
        return { title: "Not signed in to Grok", message: error.message, openDocs: false };
      case "timeout":
        return { title: "Grok timed out", message: error.message, openDocs: false };
      default:
        return { title: "Grok failed", message: error.message, openDocs: false };
    }
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return { title: "Grok failed", message, openDocs: false };
}
