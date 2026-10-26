import type { ApiMessage } from '../types';
import type { ChatCompletionRequest } from './types';

export interface RequestOptions {
	model: string;
	temperature: number;
	maxTokens: number;
	stream: boolean;
}

export function buildChatRequestBody(
	messages: ApiMessage[],
	options: RequestOptions,
): ChatCompletionRequest {
	return {
		model: options.model,
		messages,
		temperature: options.temperature,
		max_tokens: options.maxTokens,
		stream: options.stream,
	};
}

export function buildRequestHeaders(apiKey: string): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};
	const key = apiKey.trim();
	if (key.length > 0) {
		headers['Authorization'] = `Bearer ${key}`;
	}
	return headers;
}
