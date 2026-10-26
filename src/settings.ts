import { DEFAULT_BASE_URL, DEFAULT_MODEL } from './constants';

export interface AIChatSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	systemPrompt: string;
	temperature: number;
	maxTokens: number;
}

export const DEFAULT_SETTINGS: AIChatSettings = {
	apiKey: '',
	baseUrl: DEFAULT_BASE_URL,
	model: DEFAULT_MODEL,
	systemPrompt: 'You are a helpful assistant.',
	temperature: 0.7,
	maxTokens: 2048,
};

/**
 * Merge user-persisted data over the defaults. Kept free of any Obsidian
 * imports so it can be unit tested in isolation.
 */
export function mergeSettings(
	data: Partial<AIChatSettings> | null | undefined,
): AIChatSettings {
	return {
		...DEFAULT_SETTINGS,
		...(data ?? {}),
	};
}

export function isConfigured(settings: AIChatSettings): boolean {
	return (
		settings.baseUrl.trim().length > 0 &&
		settings.model.trim().length > 0
	);
}
