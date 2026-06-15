export function blockingWait(ms: number) {
	if (ms < 0) {
		return ms;
	}

	const start = Date.now();

	// vite removes this while loop for some reason
	// so we use eval instead
	new Function("start", "ms", "while (Date.now() - start < ms) {}")(start, ms);

	return 0;
}

export async function asyncWait(ms: number) {
	const start = Date.now();

	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

	return ms - (Date.now() - start);
}
