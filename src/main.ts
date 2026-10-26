import { Plugin, WorkspaceLeaf } from 'obsidian';
import type { AIChatSettings } from './settings';
import { mergeSettings } from './settings';
import { AIChatSettingTab } from './settings-tab';
import { AI_CHAT_VIEW_TYPE, AIChatView } from './chat/ChatView';

export default class AIChatPlugin extends Plugin {
	settings!: AIChatSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			AI_CHAT_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new AIChatView(leaf, this),
		);

		this.addRibbonIcon('message-square', 'Open AI chat', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-ai-chat',
			name: 'Open AI chat',
			callback: () => void this.activateView(),
		});

		this.addSettingTab(new AIChatSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(AI_CHAT_VIEW_TYPE);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(AI_CHAT_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getRightLeaf(false) ?? undefined;
			if (leaf) {
				await leaf.setViewState({ type: AI_CHAT_VIEW_TYPE, active: true });
			}
		}

		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = mergeSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
