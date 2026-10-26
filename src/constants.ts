export interface ProviderPreset {
	id: string;
	name: string;
	baseUrl: string;
	model: string;
}

/**
 * A curated list of OpenAI-compatible endpoints. Users can also enter a fully
 * custom base URL and model from the settings tab.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
	{ id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
	{ id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
	{ id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
	{ id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
	{ id: 'ollama', name: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1' },
];

export const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_MODEL = 'gpt-4o-mini';
