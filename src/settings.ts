import { App, PluginSettingTab, Setting } from "obsidian";
import type SelectFolderPlugin from "./main";

export interface SelectFolderSettings {
	/** When ON and a folder is focused, new notes are created inside it. */
	newNotesInSelectedFolder: boolean;
	/**
	 * Extra width (px) added to the RIGHT of the fold triangle that still
	 * counts as an expand/collapse click. Larger = the small ▶ is easier to
	 * hit; clicks past it select the folder instead.
	 */
	expandHitAreaPx: number;
}

export const DEFAULT_SETTINGS: SelectFolderSettings = {
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
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.expandHitAreaPx = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
