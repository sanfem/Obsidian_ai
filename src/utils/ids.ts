let counter = 0;

/**
 * Generates a reasonably unique, collision-resistant id without relying on
 * `crypto.randomUUID` (which is unavailable in some Obsidian mobile webviews).
 */
export function createId(prefix = 'msg'): string {
	counter += 1;
	return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
