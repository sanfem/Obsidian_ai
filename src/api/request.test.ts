import { describe, expect, it } from 'vitest';
import { buildChatRequestBody, buildRequestHeaders } from './request';
import type { ApiMessage } from '../types';

describe('buildChatRequestBody', () => {
	it('includes model, messages, temperature, max_tokens and stream', () => {
		const messages: ApiMessage[] = [{ role: 'user', content: 'hi' }];
		const body = buildChatRequestBody(messages, {
			model: 'gpt-4o-mini',
			temperature: 0.7,
			maxTokens: 2048,
			stream: true,
		});
		expect(body).toEqual({
			model: 'gpt-4o-mini',
			messages,
			temperature: 0.7,
			max_tokens: 2048,
			stream: true,
		});
	});
});

describe('buildRequestHeaders', () => {
	it('adds a bearer token when an API key is present', () => {
		expect(buildRequestHeaders('  sk-abc  ')).toEqual({
			'Content-Type': 'application/json',
			Authorization: 'Bearer sk-abc',
		});
	});

	it('omits Authorization for an empty key', () => {
		expect(buildRequestHeaders('   ')).toEqual({
			'Content-Type': 'application/json',
		});
	});
});
