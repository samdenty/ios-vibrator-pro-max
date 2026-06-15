export function throttle(func: VoidFunction, limitMs: number) {
	let lastRun = 0;
	let timeoutId: NodeJS.Timeout | null = null;

	return () => {
		const now = Date.now();
		const timeElapsed = now - lastRun;

		if (timeElapsed < limitMs) {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			const timeRemaining = limitMs - timeElapsed;

			timeoutId = setTimeout(() => {
				lastRun = Date.now();
				func();
			}, timeRemaining);

			return;
		}

		lastRun = now;
		func();
	};
}
