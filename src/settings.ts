import { App, PluginSettingTab, Setting } from "obsidian";
import type SelectFolderPlugin from "./main";

export interface SelectFolderSettings {
	/** When ON and a folder is focused, new notes are created inside it. */
	newNotesInSelectedFolder: boolean;
}

export const DEFAULT_SETTINGS: SelectFolderSettings = {
	newNotesInSelectedFolder: true,
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
	}
}
