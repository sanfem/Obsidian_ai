import type { ApiMessage } from '../types';

export interface ChatCompletionRequest {
	model: string;
	messages: ApiMessage[];
	temperature?: number;
	max_tokens?: number;
	stream?: boolean;
}

export interface ChatCompletionChunk {
	choices?: Array<{
		delta?: { content?: string };
		text?: string;
		finish_reason?: string | null;
	}>;
}

export interface ChatCompletionResponse {
	choices?: Array<{
		message?: { content?: string };
		text?: string;
	}>;
}
