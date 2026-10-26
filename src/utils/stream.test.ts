import { describe, expect, it } from 'vitest';
import { SSEParser } from './stream';

describe('SSEParser', () => {
	it('parses a single complete delta', () => {
		const parser = new SSEParser();
		const events = parser.push(
			'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
		);
		expect(events).toEqual([{ type: 'delta', text: 'Hello' }]);
	});

	it('handles [DONE]', () => {
		const parser = new SSEParser();
		const events = parser.push('data: [DONE]\n\n');
		expect(events).toEqual([{ type: 'done' }]);
	});

	it('buffers lines split across chunks', () => {
		const parser = new SSEParser();
		const first = parser.push('data: {"choices":[{"delta":{"con');
		expect(first).toEqual([]);
		const second = parser.push('tent":"world"}}]}\n\n');
		expect(second).toEqual([{ type: 'delta', text: 'world' }]);
	});

	it('ignores comments and non-data lines', () => {
		const parser = new SSEParser();
		const events = parser.push(': keep-alive\n\nevent: message\n\ndata: {"choices":[{"delta":{"content":"ok"}}]}\n\n');
		expect(events).toEqual([{ type: 'delta', text: 'ok' }]);
	});

	it('falls back to choices[0].text', () => {
		const parser = new SSEParser();
		const events = parser.push('data: {"choices":[{"text":"legacy"}]}\n\n');
		expect(events).toEqual([{ type: 'delta', text: 'legacy' }]);
	});

	it('emits an error event for malformed JSON', () => {
		const parser = new SSEParser();
		const events = parser.push('data: {not-json}\n\n');
		expect(events).toHaveLength(1);
		expect(events[0]?.type).toBe('error');
	});

	it('handles CRLF line endings', () => {
		const parser = new SSEParser();
		const events = parser.push('data: {"choices":[{"delta":{"content":"hi"}}]}\r\n\r\n');
		expect(events).toEqual([{ type: 'delta', text: 'hi' }]);
	});
});
