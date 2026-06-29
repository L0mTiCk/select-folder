# Select Folder

Click a folder to **select** it — like Finder — without losing anything
Obsidian's file explorer already does.

Stock Obsidian only expands/collapses a folder when you click its name, with no
lightweight way to say "I'm working in *this* folder." Select Folder fixes that
in place: drag-and-drop, the right-click menu, multi-select, and live sync all
keep working.

## What it does

- **Click a folder's name to select it** — native selection highlight. This is
  the whole point.
- **The triangle still expands/collapses** — unchanged.
- **Double-click a folder name to expand/collapse it**, Finder-style.
- **Multi-select is untouched** — `Shift` / `Cmd` / `Ctrl` / `Option`+click all
  behave exactly as in stock Obsidian.

### Click modes

Choose how a single click behaves in settings:

| Mode | Single click | Expand / collapse |
| --- | --- | --- |
| **Select** *(default)* | selects only (non-destructive) | triangle or double-click |
| **Select + expand/collapse** | selects **and** toggles | the same single click |

### Bonus: new notes follow the selection

With a folder selected, *Create new note* (`Cmd`/`Ctrl`+N) puts the note inside
it instead of the default location. Turn it off in settings if you prefer.

## Settings

- **When you click a folder name** — pick a click mode (above).
- **Expand/collapse hit area** *(Select mode)* — widen the triangle's click
  target if it's hard to hit.
- **New notes go into the selected folder** *(default: on)*.

## Installation

Copy `main.js`, `manifest.json`, and `styles.css` from a release into
`<vault>/.obsidian/plugins/select-folder/`, then enable it under
**Settings → Community plugins**.

## Compatibility

Obsidian **1.4.0+**. Desktop and mobile.

## Docs & license

Design notes in [`docs/TECHNICAL.md`](docs/TECHNICAL.md), history in
[`CHANGELOG.md`](CHANGELOG.md). MIT.
