import { describe, expect, it } from 'vitest';
import { buildChatCompletionsUrl, normalizeBaseUrl } from './provider';

describe('normalizeBaseUrl', () => {
	it('trims whitespace and trailing slashes', () => {
		expect(normalizeBaseUrl('  https://api.openai.com/v1/  ')).toBe(
			'https://api.openai.com/v1',
		);
		expect(normalizeBaseUrl('https://api.openai.com/v1///')).toBe(
			'https://api.openai.com/v1',
		);
	});

	it('leaves a clean URL unchanged', () => {
		expect(normalizeBaseUrl('https://api.openai.com/v1')).toBe(
			'https://api.openai.com/v1',
		);
	});
});

describe('buildChatCompletionsUrl', () => {
	it('appends /chat/completions to a base URL', () => {
		expect(buildChatCompletionsUrl('https://api.openai.com/v1')).toBe(
			'https://api.openai.com/v1/chat/completions',
		);
	});

	it('does not double-append when already present', () => {
		expect(
			buildChatCompletionsUrl('https://api.openai.com/v1/chat/completions'),
		).toBe('https://api.openai.com/v1/chat/completions');
	});

	it('handles a root base URL without a version segment', () => {
		expect(buildChatCompletionsUrl('http://localhost:11434')).toBe(
			'http://localhost:11434/chat/completions',
		);
	});
});
