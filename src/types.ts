export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	timestamp: number;
}

export interface ApiMessage {
	role: ChatRole;
	content: string;
}
