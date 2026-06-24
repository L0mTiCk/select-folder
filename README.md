# Select Folder

An Obsidian plugin that gives the built-in file explorer **Finder-like** behavior,
without replacing it — drag-and-drop, the right-click menu, and live vault sync all
keep working.

## What it changes

| Action | Stock Obsidian | With this plugin |
| --- | --- | --- |
| Click the `>` triangle | Expand / collapse | Expand / collapse (unchanged) |
| Click a folder's **name** | Expand / collapse | **Selects** the folder (highlight) |
| Click a file | Opens it | Opens it (unchanged) |
| Cmd/Ctrl+N with a folder selected | New note in default location | New note **inside the selected folder** |

It works by hijacking the existing `file-explorer` view:

- A capture-phase click listener splits "click the triangle" (expand/collapse) from
  "click the folder name" (select).
- `app.fileManager.getNewFileParent` is patched (via `monkey-around`) so the
  standard *Create new note* command targets the selected folder. No new hotkey —
  your existing Cmd/Ctrl+N binding just gets smarter.

Both are uninstalled cleanly when the plugin is disabled.

## Settings

- **New notes go into the selected folder** (default: on)
- **Clear selection when opening a file** (default: on)

## Develop

```bash
npm install
npm run dev      # esbuild watch -> main.js
npm run build    # type-check + production bundle
```

Then symlink/copy `main.js`, `manifest.json`, and `styles.css` into
`<vault>/.obsidian/plugins/select-folder/` and enable the plugin.
