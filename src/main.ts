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
	FinderTreeSettingTab,
	type FinderTreeSettings,
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
}

/** Minimal shape of the explorer's internal tree. */
interface ExplorerTree {
	focusedItem: TreeItem | null;
	setFocusedItem(item: TreeItem | null, scrollIntoView?: boolean): void;
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

export default class FinderTreeExplorerPlugin extends Plugin {
	settings: FinderTreeSettings;

	/** Leaves we have attached our click interceptor to. */
	private patchedLeaves = new WeakSet<WorkspaceLeaf>();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FinderTreeSettingTab(this.app, this));

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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
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
		const plugin = this;
		const fileManager = this.app
			.fileManager as unknown as PatchableFileManager;

		const uninstall = around(fileManager, {
			getNewFileParent(original) {
				return function (this: unknown, sourcePath: string): TFolder {
					if (plugin.settings.newNotesInSelectedFolder) {
						const folder = plugin.focusedFolder();
						if (folder) return folder;
					}
					return original.call(this, sourcePath);
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
			this.patchedLeaves.add(leaf);
		}
	}

	private onExplorerClick(leaf: WorkspaceLeaf, evt: MouseEvent) {
		// Only left-click selects; let modified clicks / middle-click pass.
		if (evt.button !== 0 || evt.metaKey || evt.ctrlKey || evt.shiftKey) {
			return;
		}

		const target = evt.target as HTMLElement | null;
		if (!target) return;

		// Clicking the ">" triangle: let Obsidian expand/collapse as usual.
		if (target.closest(".collapse-icon")) return;

		const folderTitle = target.closest<HTMLElement>(".nav-folder-title");
		if (!folderTitle) return; // files and empty space: native behavior.

		// A folder name was clicked. Suppress the default collapse-toggle and
		// instead make this folder the tree's focused item — the same native
		// selection state used by arrow-key navigation, so rename (F2 / Enter),
		// the context menu, and "new note here" all target it.
		const item = this.resolveItem(leaf, folderTitle);
		if (!item) return;

		evt.stopPropagation();
		evt.preventDefault();

		const view = leaf.view as FileExplorerView;
		view.tree?.setFocusedItem(item, false);
		// Focus the explorer pane so its keyboard scope (F2/Enter rename) is live.
		this.app.workspace.setActiveLeaf(leaf, { focus: true });
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
