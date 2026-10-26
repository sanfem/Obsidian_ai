import type { ApiMessage } from '../types';
import type { AIChatSettings } from '../settings';
import type { ChatCompletionResponse } from './types';
import { buildChatCompletionsUrl } from './provider';
import { buildChatRequestBody, buildRequestHeaders } from './request';
import { SSEParser, type StreamEvent } from '../utils/stream';

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status?: number,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Thin client for any OpenAI-compatible `/chat/completions` endpoint. The
 * `fetch` implementation is injectable so it can be tested without a network.
 */
export class AiClient {
	constructor(
		private readonly settings: AIChatSettings,
		private readonly fetchFn: typeof fetch = fetch,
	) {}

	async *streamChat(
		messages: ApiMessage[],
		systemPrompt?: string,
	): AsyncGenerator<StreamEvent> {
		const body = buildChatRequestBody(
			this.withSystemPrompt(messages, systemPrompt),
			{
				model: this.settings.model,
				temperature: this.settings.temperature,
				maxTokens: this.settings.maxTokens,
				stream: true,
			},
		);

		const response = await this.fetchFn(
			buildChatCompletionsUrl(this.settings.baseUrl),
			{
				method: 'POST',
				headers: buildRequestHeaders(this.settings.apiKey),
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			throw new ApiError(`Request failed with status ${response.status}`, response.status);
		}
		if (!response.body) {
			throw new ApiError('Response body is empty');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		const parser = new SSEParser();

		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			const chunk = decoder.decode(value, { stream: true });
			for (const event of parser.push(chunk)) {
				yield event;
			}
		}
	}

	async chat(messages: ApiMessage[], systemPrompt?: string): Promise<string> {
		const body = buildChatRequestBody(
			this.withSystemPrompt(messages, systemPrompt),
			{
				model: this.settings.model,
				temperature: this.settings.temperature,
				maxTokens: this.settings.maxTokens,
				stream: false,
			},
		);

		const response = await this.fetchFn(
			buildChatCompletionsUrl(this.settings.baseUrl),
			{
				method: 'POST',
				headers: buildRequestHeaders(this.settings.apiKey),
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			throw new ApiError(`Request failed with status ${response.status}`, response.status);
		}

		const json = (await response.json()) as ChatCompletionResponse;
		return json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? '';
	}

	private withSystemPrompt(
		messages: ApiMessage[],
		systemPrompt?: string,
	): ApiMessage[] {
		const prompt = systemPrompt?.trim();
		if (!prompt) {
			return messages;
		}
		return [{ role: 'system', content: prompt }, ...messages];
	}
}
