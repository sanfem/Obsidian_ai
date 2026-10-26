import { describe, expect, it } from 'vitest';
import { ChatStore, estimateTokens } from './ChatStore';

function makeStore(): ChatStore {
	let n = 0;
	return new ChatStore(() => {
		n += 1;
		return `id-${n}`;
	});
}

describe('ChatStore', () => {
	it('assigns ids and appends messages in order', () => {
		const store = makeStore();
		store.add('user', 'hello');
		store.add('assistant', 'hi');
		expect(store.all().map((m) => m.content)).toEqual(['hello', 'hi']);
		expect(store.all().map((m) => m.id)).toEqual(['id-1', 'id-2']);
	});

	it('appends deltas only to assistant messages', () => {
		const store = makeStore();
		const user = store.add('user', 'hello');
		const assistant = store.add('assistant', '');
		store.append(user.id, 'should not apply');
		store.append(assistant.id, 'part 1 ');
		store.append(assistant.id, 'part 2');
		expect(store.get(user.id)?.content).toBe('hello');
		expect(store.get(assistant.id)?.content).toBe('part 1 part 2');
	});

	it('updates and removes messages', () => {
		const store = makeStore();
		const message = store.add('assistant', 'old');
		store.update(message.id, 'new');
		expect(store.get(message.id)?.content).toBe('new');

		expect(store.remove(message.id)).toBe(true);
		expect(store.get(message.id)).toBeUndefined();
		expect(store.remove('missing')).toBe(false);
	});

	it('clears all messages', () => {
		const store = makeStore();
		store.add('user', 'a');
		store.add('assistant', 'b');
		store.clear();
		expect(store.all()).toEqual([]);
	});

	it('maps to API messages with role and content', () => {
		const store = makeStore();
		store.add('user', 'q');
		store.add('assistant', 'a');
		expect(store.toApiMessages()).toEqual([
			{ role: 'user', content: 'q' },
			{ role: 'assistant', content: 'a' },
		]);
	});
});

describe('estimateTokens', () => {
	it('returns 0 for empty input', () => {
		expect(estimateTokens('')).toBe(0);
	});

	it('approximates tokens at ~4 characters each', () => {
		expect(estimateTokens('abcd')).toBe(1);
		expect(estimateTokens('abcdefghi')).toBe(3);
	});
});
