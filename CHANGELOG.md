# Changelog

All notable changes to this plugin are documented here.

## 0.1.2

### Fixed

- **Plain-clicking a folder now exits multi-select mode.** After selecting
  several items, a plain (no-modifier) click on a folder left the previous
  selection highlighted — you stayed stuck in multi-select. Obsidian's native
  plain click calls `clearSelectedDoms()` before collapsing, but our capture-
  phase interceptor suppressed that handler. `onExplorerClick` now clears the
  multi-selection itself and sets the clicked folder as the range anchor
  (`tree.activeDom`), so a following `Shift`/`Option` click extends from it —
  matching native behavior.

## 0.1.1

### Fixed

- **Modifier-clicks on a folder no longer break native multi-select.** The
  capture-phase click interceptor (`onExplorerClick`) bailed out for
  `Cmd`/`Ctrl`/`Shift` clicks but not for `Option`/`Alt`. As a result an
  `Option`+click on a folder name was swallowed (`preventDefault` +
  `stopPropagation`), breaking Obsidian's native add/remove selection.
  The guard now passes through **any** modifier click — `Cmd`, `Ctrl`,
  `Shift`, and `Option`/`Alt` — so range-select (`Shift`+click) and
  add/remove-select (`Option`/`Cmd`+click) behave exactly as in stock
  Obsidian.

## 0.1.0

- Initial release: click a folder's name to select it, click the triangle to
  expand/collapse, and create new notes inside the selected folder.
