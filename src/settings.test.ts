import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isConfigured, mergeSettings } from './settings';

describe('mergeSettings', () => {
	it('returns defaults when given nothing', () => {
		expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
		expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
	});

	it('overrides only the provided fields', () => {
		const merged = mergeSettings({ model: 'deepseek-chat' });
		expect(merged.model).toBe('deepseek-chat');
		expect(merged.baseUrl).toBe(DEFAULT_SETTINGS.baseUrl);
		expect(merged.apiKey).toBe(DEFAULT_SETTINGS.apiKey);
	});

	it('does not mutate the defaults object', () => {
		mergeSettings({ apiKey: 'sk-test' });
		expect(DEFAULT_SETTINGS.apiKey).toBe('');
	});
});

describe('isConfigured', () => {
	it('requires a base URL and model', () => {
		expect(isConfigured({ ...DEFAULT_SETTINGS, baseUrl: '', model: 'gpt' })).toBe(false);
		expect(isConfigured({ ...DEFAULT_SETTINGS, baseUrl: 'https://x/v1', model: '' })).toBe(false);
		expect(isConfigured(DEFAULT_SETTINGS)).toBe(true);
	});

	it('treats whitespace-only values as empty', () => {
		expect(
			isConfigured({ ...DEFAULT_SETTINGS, baseUrl: '   ', model: '   ' }),
		).toBe(false);
	});
});
