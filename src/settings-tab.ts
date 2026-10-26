import { App, PluginSettingTab, Setting } from 'obsidian';
import type AIChatPlugin from './main';
import { PROVIDER_PRESETS } from './constants';

export class AIChatSettingTab extends PluginSettingTab {
	plugin: AIChatPlugin;

	constructor(app: App, plugin: AIChatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('API key').setHeading();

		new Setting(containerEl)
			.setName('API key')
			.setDesc('Stored locally in this vault. Sent only to the configured endpoint.')
			.addText((text) =>
				text
					.setPlaceholder('sk-…')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName('Model').setHeading();

		new Setting(containerEl)
			.setName('Provider preset')
			.setDesc('Fill in the base URL and model from a known OpenAI-compatible provider.')
			.addDropdown((dropdown) => {
				dropdown.addOption('', 'Custom');
				for (const preset of PROVIDER_PRESETS) {
					dropdown.addOption(preset.id, preset.name);
				}
				dropdown.setValue('').onChange(async (id) => {
					const preset = PROVIDER_PRESETS.find((p) => p.id === id);
					if (!preset) {
						return;
					}
					this.plugin.settings.baseUrl = preset.baseUrl;
					this.plugin.settings.model = preset.model;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName('Base URL')
			.setDesc('Any OpenAI-compatible endpoint, e.g. https://api.openai.com/v1')
			.addText((text) =>
				text
					.setPlaceholder('https://api.openai.com/v1')
					.setValue(this.plugin.settings.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.baseUrl = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Model identifier accepted by the endpoint above.')
			.addText((text) =>
				text
					.setPlaceholder('gpt-4o-mini')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName('Behaviour').setHeading();

		new Setting(containerEl)
			.setName('System prompt')
			.setDesc('Instructions prepended to every conversation.')
			.addTextArea((text) =>
				text
					.setPlaceholder('You are a helpful assistant.')
					.setValue(this.plugin.settings.systemPrompt)
					.onChange(async (value) => {
						this.plugin.settings.systemPrompt = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Higher values produce more random output (0–2).')
			.addSlider((slider) =>
				slider
					.setLimits(0, 2, 0.1)
					.setValue(this.plugin.settings.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Max tokens')
			.setDesc('Maximum number of tokens to generate per response.')
			.addText((text) =>
				text
					.setPlaceholder('2048')
					.setValue(String(this.plugin.settings.maxTokens))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						this.plugin.settings.maxTokens = Number.isFinite(parsed)
							? Math.max(1, parsed)
							: this.plugin.settings.maxTokens;
						await this.plugin.saveSettings();
					}),
			);
	}
}
