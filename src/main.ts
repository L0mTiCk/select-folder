import { around } from "monkey-around";
import {
	Plugin,
	TFolder,
	View,
	WorkspaceLeaf,
	type TAbstractFile,
} from "obsidian";
import {
	DEFAULT_SETTINGS,
	SelectFolderSettingTab,
	type SelectFolderSettings,
} from "./settings";

const FILE_EXPLORER_TYPE = "file-explorer";

/**
 * Minimal shape of an item in the explorer tree (a FolderItem / FileItem).
 * Not part of the public `obsidian` typings — kept narrow so breakage from an
 * Obsidian update is easy to spot.
 */
interface TreeItem {
	file?: TAbstractFile;
	selfEl?: HTMLElement;
	el?: HTMLElement;
	/** FolderItem only: current fold state and its toggle. */
	collapsed?: boolean;
	setCollapsed?(collapsed: boolean, animate?: boolean): void;
}

/** Minimal shape of the explorer's internal tree. */
interface ExplorerTree {
	focusedItem: TreeItem | null;
	/** Anchor item used to extend Shift / Option range-selections. */
	activeDom: TreeItem | null;
	setFocusedItem(item: TreeItem | null, scrollIntoView?: boolean): void;
	/** Clears the multi-selection: removes `is-selected` and empties the set. */
	clearSelectedDoms(): void;
}

/** Minimal shape of the internal file-explorer view. */
interface FileExplorerView extends View {
	fileItems?: Record<string, TreeItem>;
	tree?: ExplorerTree;
}

/** Minimal shape of the internal FileManager method we patch. */
interface PatchableFileManager {
	getNewFileParent(sourcePath: string): TFolder;
}

export default class SelectFolderPlugin extends Plugin {
	// Assigned in onload() via loadSettings(), before any other use.
	settings!: SelectFolderSettings;

	/** Leaves we have attached our click interceptor to. */
	private patchedLeaves = new WeakSet<WorkspaceLeaf>();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SelectFolderSettingTab(this.app, this));

		// B. Re-route "new file" location to the focused folder.
		this.patchGetNewFileParent();

		// A. Attach the Finder-style click interceptor to the explorer(s).
		this.app.workspace.onLayoutReady(() => this.attachToExplorers());
		this.registerEvent(
			this.app.workspace.on("layout-change", () =>
				this.attachToExplorers(),
			),
		);
	}

	async loadSettings() {
		const data = (await this.loadData()) as
			| Partial<SelectFolderSettings>
			| null
			| undefined;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ---- Explorer plumbing --------------------------------------------

	private getFileExplorerView(): FileExplorerView | null {
		const leaf = this.app.workspace.getLeavesOfType(
			FILE_EXPLORER_TYPE,
		)[0];
		return (leaf?.view as FileExplorerView) ?? null;
	}

	/** The folder currently focused in the explorer, if any. */
	private focusedFolder(): TFolder | null {
		const view = this.getFileExplorerView();
		const file = view?.tree?.focusedItem?.file;
		return file instanceof TFolder ? file : null;
	}

	// ---- B. getNewFileParent patch ------------------------------------

	private patchGetNewFileParent() {
		const fileManager = this.app
			.fileManager as unknown as PatchableFileManager;

		// Resolved via a lexical arrow so we don't alias `this` to a local:
		// inside the patched function below, `this` is the FileManager.
		const overrideParent = (): TFolder | null =>
			this.settings.newNotesInSelectedFolder
				? this.focusedFolder()
				: null;

		const uninstall = around(fileManager, {
			getNewFileParent(original) {
				return function (this: unknown, sourcePath: string): TFolder {
					return (
						overrideParent() ?? original.call(this, sourcePath)
					);
				};
			},
		});

		this.register(uninstall);
	}

	// ---- A. Finder-style click handling -------------------------------

	private attachToExplorers() {
		for (const leaf of this.app.workspace.getLeavesOfType(
			FILE_EXPLORER_TYPE,
		)) {
			if (this.patchedLeaves.has(leaf)) continue;
			const containerEl = leaf.view.containerEl;
			if (!containerEl) continue;

			// Capture phase so we run before Obsidian's own row handler.
			const handler = (evt: MouseEvent) => this.onExplorerClick(leaf, evt);
			containerEl.addEventListener("click", handler, true);
			this.register(() =>
				containerEl.removeEventListener("click", handler, true),
			);

			// Double-click a folder name to expand/collapse it, Finder-style.
			const dblHandler = (evt: MouseEvent) =>
				this.onExplorerDblClick(leaf, evt);
			containerEl.addEventListener("dblclick", dblHandler, true);
			this.register(() =>
				containerEl.removeEventListener("dblclick", dblHandler, true),
			);

			this.patchedLeaves.add(leaf);
		}
	}

	private onExplorerClick(leaf: WorkspaceLeaf, evt: MouseEvent) {
		// Only a plain left-click selects. Any modifier (Cmd/Ctrl toggle,
		// Shift range, Option/Alt add-remove) or middle-click is a native
		// multi-select gesture — let it through untouched.
		if (
			evt.button !== 0 ||
			evt.metaKey ||
			evt.ctrlKey ||
			evt.shiftKey ||
			evt.altKey
		) {
			return;
		}

		const target = evt.target as HTMLElement | null;
		if (!target) return;

		const folderTitle = target.closest<HTMLElement>(".nav-folder-title");
		if (!folderTitle) return; // files and empty space: native behavior.

		const toggleMode = this.settings.clickMode === "toggle";

		// "select" mode: clicking the ">" triangle — plus a configurable margin
		// to its right — expands/collapses as usual (the triangle is tiny, so
		// this widens its hit area); clicks past the margin select. "toggle"
		// mode treats the whole row as one control, so we never defer to native.
		if (!toggleMode && this.clickedOnExpandToggle(folderTitle, evt)) return;

		// A folder name was clicked. Suppress the default collapse-toggle and
		// instead make this folder the tree's focused item — the same native
		// selection state used by arrow-key navigation, so rename (F2 / Enter),
		// the context menu, and "new note here" all target it.
		const item = this.resolveItem(leaf, folderTitle);
		if (!item) return;

		evt.stopPropagation();
		evt.preventDefault();

		const view = leaf.view as FileExplorerView;
		const tree = view.tree;
		// A plain click is a single-select. Obsidian's native plain click calls
		// clearSelectedDoms() before collapsing; since we suppress that native
		// handler, we must clear the multi-selection ourselves — otherwise the
		// highlighted rows linger and you stay stuck in multi-select mode.
		tree?.clearSelectedDoms?.();
		tree?.setFocusedItem(item, false);
		// Make this folder the range anchor (native sets `activeDom` here too),
		// so a following Shift / Option click extends from this folder.
		if (tree) tree.activeDom = item;
		// Focus the explorer pane so its keyboard scope (F2/Enter rename) is live.
		this.app.workspace.setActiveLeaf(leaf, { focus: true });

		// "toggle" mode: the same click also folds. Every click toggles so rapid
		// clicking stays responsive (no `detail` guard — suppressing the 2nd/3rd
		// click of a fast sequence made folding feel sticky). A double-click is
		// just two toggles; onExplorerDblClick bails in this mode so it adds none.
		if (toggleMode && typeof item.setCollapsed === "function") {
			item.setCollapsed(!item.collapsed, true);
		}
	}

	private onExplorerDblClick(leaf: WorkspaceLeaf, evt: MouseEvent) {
		// In "toggle" mode a single click already folds, so a double-click has
		// no extra role — let its two clicks act without adding a third toggle.
		if (this.settings.clickMode === "toggle") return;

		// Mirror the single-click modifier guard: any modifier or non-left
		// button is a native gesture, so we stay out of the way.
		if (
			evt.button !== 0 ||
			evt.metaKey ||
			evt.ctrlKey ||
			evt.shiftKey ||
			evt.altKey
		) {
			return;
		}

		const target = evt.target as HTMLElement | null;
		if (!target) return;

		const folderTitle = target.closest<HTMLElement>(".nav-folder-title");
		if (!folderTitle) return;

		// Double-clicking the triangle's hit area keeps the native behavior —
		// the single-click handler already let it through, so do the same here.
		if (this.clickedOnExpandToggle(folderTitle, evt)) return;

		const item = this.resolveItem(leaf, folderTitle);
		if (!item || typeof item.setCollapsed !== "function") return;

		// Double-click on the name toggles fold state, Finder-style. The two
		// single-clicks of the gesture have already selected the folder; this
		// just adds the open/close. preventDefault suppresses the native text
		// selection that a double-click would otherwise trigger.
		evt.preventDefault();
		evt.stopPropagation();
		item.setCollapsed(!item.collapsed, true);
	}

	/**
	 * Whether the event lands on the fold triangle or the configurable margin
	 * to its right — the area reserved for native expand/collapse. Returns
	 * false (i.e. "this is the name") when the row has no triangle.
	 */
	private clickedOnExpandToggle(
		folderTitle: HTMLElement,
		evt: MouseEvent,
	): boolean {
		const icon = folderTitle.querySelector<HTMLElement>(".collapse-icon");
		if (!icon) return false;
		const rect = icon.getBoundingClientRect();
		return evt.clientX <= rect.right + this.settings.expandHitAreaPx;
	}

	/** Map a `.nav-folder-title` element back to its tree item. */
	private resolveItem(
		leaf: WorkspaceLeaf,
		folderTitle: HTMLElement,
	): TreeItem | null {
		const path = folderTitle.getAttribute("data-path");
		if (path == null) return null;
		const view = leaf.view as FileExplorerView;
		const item = view.fileItems?.[path];
		return item && item.file instanceof TFolder ? item : null;
	}
}
