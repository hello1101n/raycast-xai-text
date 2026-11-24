# Grok Text

A free Raycast extension for two jobs that otherwise need Raycast Pro AI. It shells out to the official [Grok CLI](https://docs.x.ai/build/overview) (`grok`, from [xai-org/grok-build](https://github.com/xai-org/grok-build)) already logged in with your SuperGrok or X Premium subscription. It does not use an xAI API key.

## Commands

**Translate Selection.** Reads the selected text, translates it into your target language, and shows the result. Press Enter to paste it over the selection, or use Copy Translation. Esc closes the window and leaves the selection alone. While Grok is working, the view stays in a loading state and an animated toast says “Translating…”.

**Improve English.** A no-view command. It reads the selection, rewrites it into clear, natural, correct English (same meaning and tone), and pastes the result over the selection. An animated toast says “Improving English…”, then a short HUD says “English improved”. Failures stay on a toast. There is no preview and no Enter step.

Both prompts tell Grok to return only the resulting text, with no quotes or commentary.

## Install the Grok CLI

macOS or Linux:

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

The installer puts the binary in `~/.grok/bin` and, when it can, symlinks it into `~/.local/bin` or `/usr/local/bin`. Open a new terminal, then sign in:

```bash
grok login
```

On a machine without a browser, use `grok login --device-code`.

## Import into Raycast

```bash
npm install
npm run dev
```

Raycast opens its import dialog. Accept it to load the extension in development mode.

## Hotkeys

Raycast does not ship hotkeys inside the extension. Bind them in Raycast Settings → Extensions → Grok Text:

| Command | Suggested shortcut |
| --- | --- |
| Translate Selection | ⌘⌥3 |
| Improve English | ⌘⌥2 |

## Preferences

Set these in Raycast Settings → Extensions → Grok Text:

| Preference | Default | What it does |
| --- | --- | --- |
| Target Language | Russian | Language used by Translate Selection. An empty value still means Russian. |
| Grok CLI Path | empty | Absolute path to `grok`. Leave empty to search `PATH`, Homebrew (`/opt/homebrew/bin`, `/usr/local/bin`), npm (`~/.npm-global/bin`), `~/.local/bin`, and `~/.grok/bin`. Raycast’s own `PATH` is short, so those locations are checked even when they are missing from it. |
| Model | empty | Passed as `--model`. Leave empty to use the CLI default. |
| Translation Instructions | empty | Extra guidance for translation, such as tone, formality, or terms to keep in English. Appended to the translate prompt when set. |
| English Instructions | empty | Extra guidance for Improve English, such as “keep it casual” or “British spelling”. Appended to that prompt when set. |

If something goes wrong, a toast explains it: no selection, the `grok` binary was not found (with a link to the install docs), you are not signed in (`grok login`), the CLI timed out, or another failure.

## Checks

```bash
npm test
npm run lint
npm run build
```

`ray lint` also checks that `author` in `package.json` is an existing Raycast username. This repo uses `hello1101n`. If the store does not have that handle yet, change `author` to yours.
