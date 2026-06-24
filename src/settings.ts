import { App, PluginSettingTab, Setting } from "obsidian";
import type FinderTreeExplorerPlugin from "./main";

export interface FinderTreeSettings {
	/** When ON and a folder is focused, new notes are created inside it. */
	newNotesInSelectedFolder: boolean;
}

export const DEFAULT_SETTINGS: FinderTreeSettings = {
	newNotesInSelectedFolder: true,
};

export class FinderTreeSettingTab extends PluginSettingTab {
	plugin: FinderTreeExplorerPlugin;

	constructor(app: App, plugin: FinderTreeExplorerPlugin) {
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
	}
}
