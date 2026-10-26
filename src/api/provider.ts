/**
 * Resolves a user-supplied base URL to a concrete OpenAI-compatible
 * `/chat/completions` endpoint. Pure functions for easy unit testing.
 */
export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/, '');
}

export function buildChatCompletionsUrl(baseUrl: string): string {
	const normalized = normalizeBaseUrl(baseUrl);
	if (/\/chat\/completions$/i.test(normalized)) {
		return normalized;
	}
	return `${normalized}/chat/completions`;
}
