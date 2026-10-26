import { ItemView, MarkdownRenderer, WorkspaceLeaf, setIcon } from 'obsidian';
import type AIChatPlugin from '../main';
import type { ChatMessage } from '../types';
import { ApiError, AiClient } from '../api/AiClient';
import { ChatStore } from './ChatStore';

export const AI_CHAT_VIEW_TYPE = 'ai-chat-view';

export class AIChatView extends ItemView {
	private readonly store = new ChatStore();
	private readonly client: AiClient;

	private messagesEl!: HTMLElement;
	private inputEl!: HTMLTextAreaElement;
	private sendButtonEl!: HTMLElement;
	private activeContentEl: HTMLElement | null = null;
	private busy = false;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: AIChatPlugin,
	) {
		super(leaf);
		this.client = new AiClient(plugin.settings);
	}

	getViewType(): string {
		return AI_CHAT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'AI chat';
	}

	getIcon(): string {
		return 'message-square';
	}

	async onOpen(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass('ai-chat');

		const headerEl = root.createDiv({ cls: 'ai-chat-header' });
		headerEl.createSpan({ cls: 'ai-chat-title', text: 'AI chat' });

		const clearButtonEl = headerEl.createEl('button', {
			cls: 'ai-chat-clear clickable-icon',
		});
		clearButtonEl.setAttribute('aria-label', 'Clear conversation');
		setIcon(clearButtonEl, 'trash-2');
		clearButtonEl.addEventListener('click', () => this.clearConversation());

		this.messagesEl = root.createDiv({ cls: 'ai-chat-messages' });

		const inputBarEl = root.createDiv({ cls: 'ai-chat-input-bar' });
		this.inputEl = inputBarEl.createEl('textarea', {
			cls: 'ai-chat-input',
			attr: { placeholder: 'Ask anything…', rows: '1' },
		});
		this.inputEl.addEventListener('keydown', (evt) => {
			if (evt.key === 'Enter' && !evt.shiftKey) {
				evt.preventDefault();
				void this.sendMessage();
			}
		});

		this.sendButtonEl = inputBarEl.createEl('button', {
			cls: 'ai-chat-send clickable-icon',
		});
		this.sendButtonEl.setAttribute('aria-label', 'Send message');
		setIcon(this.sendButtonEl, 'arrow-up');
		this.sendButtonEl.addEventListener('click', () => void this.sendMessage());

		this.renderMessages();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	private clearConversation(): void {
		this.store.clear();
		this.activeContentEl = null;
		this.renderMessages();
	}

	private renderMessages(): void {
		this.messagesEl.empty();

		if (this.store.all().length === 0) {
			const emptyEl = this.messagesEl.createDiv({ cls: 'ai-chat-empty' });
			emptyEl.createDiv({ cls: 'ai-chat-empty-title', text: 'AI chat' });
			emptyEl.createDiv({
				cls: 'ai-chat-empty-subtitle',
				text: 'Ask a question to get started.',
			});
			return;
		}

		for (const message of this.store.all()) {
			this.renderMessage(message);
		}
		this.scrollToBottom();
	}

	private renderMessage(message: ChatMessage): void {
		const rowEl = this.messagesEl.createDiv({
			cls: `ai-chat-message ai-chat-message--${message.role}`,
		});
		const bubbleEl = rowEl.createDiv({ cls: 'ai-chat-bubble' });
		const contentEl = bubbleEl.createDiv({ cls: 'ai-chat-bubble-content' });

		if (message.content.length > 0) {
			void MarkdownRenderer.render(this.app, message.content, contentEl, '', this);
		}
	}

	private async sendMessage(): Promise<void> {
		const text = this.inputEl.value.trim();
		if (text.length === 0 || this.busy) {
			return;
		}

		this.inputEl.value = '';
		this.store.add('user', text);

		const apiMessages = this.store.toApiMessages();
		const assistant = this.store.add('assistant', '');
		this.renderMessages();
		this.setBusy(true);

		try {
			let received = false;
			for await (const event of this.client.streamChat(
				apiMessages,
				this.plugin.settings.systemPrompt,
			)) {
				if (event.type === 'delta') {
					received = true;
					this.store.append(assistant.id, event.text);
					this.updateActiveContent(assistant.id);
				} else if (event.type === 'error') {
					this.store.append(assistant.id, `\n\n_Error: ${event.message}_`);
				} else if (event.type === 'done') {
					break;
				}
			}

			if (!received) {
				this.store.update(assistant.id, '_(No response received.)_');
			}
		} catch (error) {
			const detail =
				error instanceof ApiError ? error.message : String(error);
			this.store.update(assistant.id, `_Request failed: ${detail}_`);
		} finally {
			this.finalizeActiveContent(assistant.id);
			this.setBusy(false);
			this.scrollToBottom();
		}
	}

	private updateActiveContent(id: string): void {
		const content = this.store.get(id)?.content ?? '';
		if (this.activeContentEl) {
			this.activeContentEl.setText(content);
			this.scrollToBottom();
		}
	}

	private async finalizeActiveContent(id: string): Promise<void> {
		if (!this.activeContentEl) {
			return;
		}
		const content = this.store.get(id)?.content ?? '';
		const el = this.activeContentEl;
		this.activeContentEl = null;
		el.empty();
		await MarkdownRenderer.render(this.app, content, el, '', this);
		this.scrollToBottom();
	}

	private setBusy(busy: boolean): void {
		this.busy = busy;
		this.sendButtonEl.toggleClass('is-busy', busy);
		this.contentEl.toggleClass('ai-chat--busy', busy);
	}

	private scrollToBottom(): void {
		this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
	}
}
