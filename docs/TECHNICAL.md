# Technical documentation

Internal design notes for the **Select Folder** plugin. For user-facing usage
see [`README.md`](../README.md); for the release history see
[`CHANGELOG.md`](../CHANGELOG.md).

## Goal

Give Obsidian's built-in `file-explorer` view Finder-like behavior **without
replacing it**, so drag-and-drop, the context menu, and live vault sync all keep
working. The plugin layers two small, cleanly-uninstallable patches on top of
the stock explorer.

## Architecture

The plugin touches the explorer in two places, both registered in `onload` and
torn down automatically when the plugin is disabled.

### A. Finder-style click handling

A **capture-phase** `click` listener is attached to each file-explorer leaf's
`containerEl` (`attachToExplorers` / `onExplorerClick`). Capture phase lets it
run before Obsidian's own row handler, so it can decide whether to take over a
click or let the native behavior proceed.

Decision flow in `onExplorerClick`:

1. **Any modifier or non-left button → bail.** If `button !== 0` or any of
   `metaKey` / `ctrlKey` / `shiftKey` / `altKey` is held, the event is a native
   multi-select gesture (`Cmd`/`Ctrl` toggle, `Shift` range, `Option`/`Alt`
   add-remove) or a middle-click — return immediately and let Obsidian handle
   it. **Forgetting `altKey` here is what broke add/remove-select in 0.1.0;**
   see [`CHANGELOG.md`](../CHANGELOG.md).
2. **Click on the `.collapse-icon` triangle → bail.** Native expand/collapse is
   preserved.
3. **Click not on a `.nav-folder-title` → bail.** Files and empty space keep
   native behavior.
4. **Otherwise** (a plain left-click on a folder name): resolve the row back to
   its tree item, then `preventDefault` + `stopPropagation` the native
   collapse-toggle and instead call `tree.setFocusedItem(item, false)`. This
   reuses the same native focus state that arrow-key navigation uses, so rename
   (`F2`/`Enter`), the context menu, and "new note here" all target the folder.
   The explorer leaf is then activated with focus so its keyboard scope is live.

Leaves are tracked in a `WeakSet` (`patchedLeaves`) so re-running
`attachToExplorers` on `layout-change` never double-binds a listener.

### B. `getNewFileParent` patch

`app.fileManager.getNewFileParent` is wrapped with
[`monkey-around`](https://github.com/pjeby/monkey-around)
(`patchGetNewFileParent`). When the **New notes go into the selected folder**
setting is on and a folder is focused, it returns that folder; otherwise it
falls through to the original. This makes the stock *Create new note* command
(e.g. `Cmd`/`Ctrl`+N) target the selected folder with no new hotkey. The
returned uninstaller is handed to `this.register`, so the patch is removed when
the plugin unloads.

## Obsidian internals used

These are **not** part of the public `obsidian` typings and are modeled with
narrow local interfaces (`TreeItem`, `ExplorerTree`, `FileExplorerView`,
`PatchableFileManager`) so breakage from an Obsidian update is easy to spot:

- `FileExplorerView.fileItems: Record<path, TreeItem>` — maps a `data-path` to
  its tree item.
- `FileExplorerView.tree.focusedItem` / `tree.setFocusedItem(item, scroll?)` —
  the native single-item focus state.
- `FileExplorerView.tree.clearSelectedDoms()` — empties the multi-selection and
  removes the `is-selected` highlight; we call it on a plain folder click to
  replicate what native does (otherwise you stay stuck in multi-select mode).
- `FileExplorerView.tree.activeDom` — the anchor a subsequent `Shift`/`Option`
  range-select extends from; we set it to the clicked folder, as native does.
- `app.fileManager.getNewFileParent(sourcePath)` — patched per above.

### Reverse-engineering reference

Because these internals are undocumented, the relevant slice of Obsidian's
minified renderer (`tree.handleItemSelection` and friends) was extracted from
`obsidian.asar` and de-minified into annotated notes. That material lives in a
**local, gitignored `reverse/` folder** (`reverse/NOTES.md` for the annotated
walkthrough, `reverse/snippets.txt` for verbatim evidence, `reverse/obsidian-app.js`
for the full bundle) — it is kept out of version control but on hand as context
for future changes. Captured against Obsidian **1.12.7**.

## Styling

None of its own. Folder selection reuses Obsidian's native `.has-focus`
tree-item state, which the app already styles (see `styles.css`).

## Build

```bash
npm install
npm run dev      # esbuild watch -> main.js
npm run build    # tsc -noEmit type-check + production esbuild bundle
```

`main.js` is a generated esbuild bundle of `src/`. After editing `src/*.ts`,
**always rebuild** so `main.js` (the file Obsidian actually loads) reflects the
change. Deploy by copying/symlinking `main.js`, `manifest.json`, and
`styles.css` into `<vault>/.obsidian/plugins/select_folder/`.
