import { App, PluginSettingTab, Setting } from "obsidian";
import type SelectFolderPlugin from "./main";

/**
 * How a plain single click on a folder's name behaves:
 * - `select`: select only — non-destructive. The triangle (or a double-click)
 *   handles folding. This is the plugin's original Finder-style behavior.
 * - `toggle`: the whole row is one control — a single click both selects AND
 *   expands/collapses, with the triangle and the name behaving the same.
 */
export type FolderClickMode = "select" | "toggle";

export interface SelectFolderSettings {
	/** What a plain single click on a folder name does. */
	clickMode: FolderClickMode;
	/** When ON and a folder is focused, new notes are created inside it. */
	newNotesInSelectedFolder: boolean;
	/**
	 * Extra width (px) added to the RIGHT of the fold triangle that still
	 * counts as an expand/collapse click. Larger = the small ▶ is easier to
	 * hit; clicks past it select the folder instead. Only used in `select` mode.
	 */
	expandHitAreaPx: number;
}

export const DEFAULT_SETTINGS: SelectFolderSettings = {
	clickMode: "select",
	newNotesInSelectedFolder: true,
	expandHitAreaPx: 8,
};

export class SelectFolderSettingTab extends PluginSettingTab {
	plugin: SelectFolderPlugin;

	constructor(app: App, plugin: SelectFolderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ---- Section 1: how clicking a folder behaves --------------------
		new Setting(containerEl).setName("Folder click behavior").setHeading();

		new Setting(containerEl)
			.setName("When you click a folder name")
			.setDesc(
				"Choose what a plain single click on a folder's name does.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption(
						"select",
						"Select it — triangle or double-click folds",
					)
					.addOption(
						"toggle",
						"Select it and expand/collapse",
					)
					.setValue(this.plugin.settings.clickMode)
					.onChange(async (value) => {
						this.plugin.settings.clickMode =
							value as FolderClickMode;
						await this.plugin.saveSettings();
						// Re-render: the hit-area slider only applies to
						// "select" mode, so show/hide it to match.
						this.display();
					}),
			);

		// The widened triangle hit area is only meaningful when a click on the
		// name selects (rather than also folding), so hide it in "toggle" mode.
		if (this.plugin.settings.clickMode === "select") {
			new Setting(containerEl)
				.setName("Expand/collapse hit area")
				.setDesc(
					"Extra width (in pixels) to the right of the fold triangle " +
						"that still expands/collapses the folder. Increase it if " +
						"the triangle is hard to click. Clicks past this width " +
						"select the folder instead.",
				)
				.addSlider((slider) =>
					slider
						.setLimits(0, 40, 1)
						.setValue(this.plugin.settings.expandHitAreaPx)
						.onChange(async (value) => {
							this.plugin.settings.expandHitAreaPx = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		// ---- Section 2: new notes ----------------------------------------
		new Setting(containerEl).setName("New notes").setHeading();

		new Setting(containerEl)
			.setName("New notes go into the selected folder")
			.setDesc(
				"When a folder is selected in the file explorer, the standard " +
					"\"Create new note\" command (e.g. Cmd/Ctrl+N) creates the note " +
					"inside that folder instead of the default location.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.newNotesInSelectedFolder)
					.onChange(async (value) => {
						this.plugin.settings.newNotesInSelectedFolder = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
