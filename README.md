# Select Folder

Click a folder to **select** it — just like Finder — without giving up anything
Obsidian's file explorer already does.

In stock Obsidian, clicking a folder's name only expands or collapses it, and
there's no lightweight way to say "I'm working in *this* folder." **Select
Folder** fixes that by enhancing the built-in explorer in place: drag-and-drop,
the right-click menu, multi-select, and live vault sync all keep working exactly
as before.

## Features

- **Click a folder's name to select it.** The folder highlights using
  Obsidian's native selection style.
- **The triangle still expands/collapses.** Click the `>` icon for the usual
  behavior — nothing changes there.
- **New notes land in the selected folder.** With a folder selected, your normal
  *Create new note* shortcut (`Cmd`/`Ctrl`+N) creates the note inside it instead
  of the default location. No new hotkey to learn.
- **Native multi-select is untouched.** `Shift`+click (range),
  `Cmd`/`Ctrl`+click and `Option`+click (add/remove) all work just like stock
  Obsidian.

## At a glance

| Action | Stock Obsidian | With Select Folder |
| --- | --- | --- |
| Click the `>` triangle | Expand / collapse | Expand / collapse *(unchanged)* |
| Click a folder's **name** | Expand / collapse | **Selects** the folder |
| Click a file | Opens it | Opens it *(unchanged)* |
| `Cmd`/`Ctrl`+N with a folder selected | New note in default location | New note **inside the selected folder** |

## Settings

- **New notes go into the selected folder** *(default: on)* — toggle off if you
  want `Cmd`/`Ctrl`+N to always use Obsidian's default location.

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from a release.
2. Copy them into `<your vault>/.obsidian/plugins/select-folder/`.
3. In Obsidian, open **Settings → Community plugins**, reload, and enable
   **Select Folder**.

## Compatibility

Requires Obsidian **1.4.0+**. Works on desktop and mobile.

## Contributing & docs

Design notes and build instructions live in
[`docs/TECHNICAL.md`](docs/TECHNICAL.md). Release history is in
[`CHANGELOG.md`](CHANGELOG.md).

## License

MIT
