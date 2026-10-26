import { describe, expect, it } from 'vitest';
import { AiClient, ApiError } from './AiClient';
import type { AIChatSettings } from '../settings';
import type { ApiMessage } from '../types';

const settings: AIChatSettings = {
	apiKey: 'sk-test',
	baseUrl: 'https://api.example.com/v1',
	model: 'test-model',
	systemPrompt: '',
	temperature: 0.7,
	maxTokens: 100,
};

function sseResponse(payload: string): Response {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(payload));
			controller.close();
		},
	});
	return new Response(stream, { status: 200 });
}

async function collect(
	client: AiClient,
	messages: ApiMessage[],
): Promise<Array<{ type: string; text?: string }>> {
	const events: Array<{ type: string; text?: string }> = [];
	for await (const event of client.streamChat(messages, 'You are helpful.')) {
		events.push(event);
	}
	return events;
}

describe('AiClient.streamChat', () => {
	it('streams deltas and finishes with done', async () => {
		const fetchFn: typeof fetch = async () =>
			sseResponse(
				'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n' +
					'data: {"choices":[{"delta":{"content":" world"}}]}\n\n' +
					'data: [DONE]\n\n',
			);
		const client = new AiClient(settings, fetchFn);
		const events = await collect(client, [{ role: 'user', content: 'hi' }]);

		expect(events).toEqual([
			{ type: 'delta', text: 'Hello' },
			{ type: 'delta', text: ' world' },
			{ type: 'done' },
		]);
	});

	it('prepends the system prompt to the request body', async () => {
		let capturedBody: string | undefined;
		const fetchFn: typeof fetch = async (_url, init) => {
			capturedBody = init?.body as string;
			return sseResponse('data: [DONE]\n\n');
		};
		const client = new AiClient(settings, fetchFn);
		await collect(client, [{ role: 'user', content: 'hi' }]);

		const body = JSON.parse(capturedBody ?? '{}') as {
			model: string;
			stream: boolean;
			messages: ApiMessage[];
		};
		expect(body.model).toBe('test-model');
		expect(body.stream).toBe(true);
		expect(body.messages).toEqual([
			{ role: 'system', content: 'You are helpful.' },
			{ role: 'user', content: 'hi' },
		]);
	});

	it('throws ApiError with the status on a non-2xx response', async () => {
		const fetchFn: typeof fetch = async () =>
			new Response('Unauthorized', { status: 401 });
		const client = new AiClient(settings, fetchFn);

		await expect(
			collect(client, [{ role: 'user', content: 'hi' }]),
		).rejects.toThrowError(ApiError);
	});
});
