export type StreamEvent =
	| { type: 'delta'; text: string }
	| { type: 'done' }
	| { type: 'error'; message: string };

interface SseChoice {
	delta?: { content?: string };
	text?: string;
	finish_reason?: string | null;
}

interface SsePayload {
	choices?: SseChoice[];
}

/**
 * Incremental parser for Server-Sent Events as emitted by OpenAI-compatible
 * `/chat/completions` streaming endpoints. Feed it raw chunks; it buffers
 * partial lines and returns only complete events.
 */
export class SSEParser {
	private buffer = '';

	push(chunk: string): StreamEvent[] {
		this.buffer += chunk;
		const events: StreamEvent[] = [];

		let newlineIndex = this.buffer.indexOf('\n');
		while (newlineIndex !== -1) {
			const line = this.buffer.slice(0, newlineIndex).trim();
			this.buffer = this.buffer.slice(newlineIndex + 1);
			if (line.length > 0) {
				this.handleLine(line, events);
			}
			newlineIndex = this.buffer.indexOf('\n');
		}

		return events;
	}

	private handleLine(line: string, events: StreamEvent[]): void {
		if (!line.startsWith('data:')) {
			return;
		}

		const data = line.slice('data:'.length).trim();
		if (data === '[DONE]') {
			events.push({ type: 'done' });
			return;
		}
		if (data.length === 0) {
			return;
		}

		try {
			const payload = JSON.parse(data) as SsePayload;
			const choice = payload.choices?.[0];
			const text = choice?.delta?.content ?? choice?.text ?? '';
			if (text) {
				events.push({ type: 'delta', text });
			}
		} catch {
			events.push({ type: 'error', message: `Unable to parse SSE payload: ${data}` });
		}
	}
}
