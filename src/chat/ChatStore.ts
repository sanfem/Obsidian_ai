import type { ApiMessage, ChatMessage, ChatRole } from '../types';
import { createId } from '../utils/ids';

/**
 * In-memory conversation state. Deliberately free of any Obsidian or DOM
 * dependencies so it can be unit tested without a running Obsidian instance.
 */
export class ChatStore {
	private messages: ChatMessage[] = [];

	constructor(private readonly generateId: () => string = createId) {}

	add(role: ChatRole, content: string, timestamp = Date.now()): ChatMessage {
		const message: ChatMessage = {
			id: this.generateId(),
			role,
			content,
			timestamp,
		};
		this.messages.push(message);
		return message;
	}

	get(id: string): ChatMessage | undefined {
		return this.messages.find((message) => message.id === id);
	}

	all(): readonly ChatMessage[] {
		return this.messages;
	}

	append(id: string, delta: string): void {
		const message = this.get(id);
		if (message && message.role === 'assistant') {
			message.content += delta;
		}
	}

	update(id: string, content: string): void {
		const message = this.get(id);
		if (message) {
			message.content = content;
		}
	}

	remove(id: string): boolean {
		const index = this.messages.findIndex((message) => message.id === id);
		if (index === -1) {
			return false;
		}
		this.messages.splice(index, 1);
		return true;
	}

	clear(): void {
		this.messages = [];
	}

	/** Maps the stored conversation to the shape the API expects (no system prompt). */
	toApiMessages(): ApiMessage[] {
		return this.messages.map((message) => ({
			role: message.role,
			content: message.content,
		}));
	}
}

/** Rough token estimate (≈4 chars/token) used for context budgeting only. */
export function estimateTokens(text: string): number {
	if (text.length === 0) {
		return 0;
	}
	return Math.ceil(text.length / 4);
}
