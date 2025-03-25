export type Vibration = [number, number[]];

export function mergeVibrations(
	patterns: Vibration[],
	startAtTime: "first" | "latest" | number = "latest",
): number[] {
	if (patterns.length === 0) {
		return [];
	}

	// Normalize patterns to millisecond precision
	const normalizedPatterns: Vibration[] = patterns.map(([start, intervals]) => [
		Math.round(start),
		intervals.map((interval) => Math.max(0, Math.round(interval))), // Ensure at least 1ms
	]);

	const startTimes = normalizedPatterns.map(([start]) => start);

	const startTime =
		typeof startAtTime === "number"
			? startAtTime
			: startAtTime === "first"
				? Math.min(...startTimes)
				: Math.max(...startTimes);

	// Calculate the maximum end time
	const endTimes = normalizedPatterns.map(([start, pattern]) => {
		return start + pattern.reduce((sum, dur) => sum + dur, 0);
	});
	const maxEndTime = Math.max(...endTimes);

	// Create millisecond-precise timeline
	const timeline = new Array(maxEndTime - startTime).fill(false);

	// Fill timeline with vibration states
	normalizedPatterns.forEach(([patternStart, intervals]) => {
		let currentTime = patternStart;
		let isVibrating = true;

		for (const interval of intervals) {
			if (isVibrating) {
				// Calculate the effective range for this vibration interval
				const fromIndex = Math.max(0, currentTime - startTime);
				const toIndex = Math.max(
					0,
					Math.min(timeline.length, currentTime - startTime + interval),
				);

				timeline.fill(true, fromIndex, toIndex);
			}
			currentTime += interval;
			isVibrating = !isVibrating;
		}
	});

	// Convert timeline back to intervals
	const result: number[] = [];
	const length = timeline.length;
	let currentState = timeline[0];
	let currentCount = 0;

	// Process the timeline including the final state transition
	for (let i = 0; i <= length; i++) {
		const newState = i < length ? timeline[i] : !currentState;

		if (newState !== currentState) {
			if (currentCount > 0) {
				result.push(currentCount);
			}
			currentState = newState;
			currentCount = 1;
		} else {
			currentCount++;
		}
	}

	if (result.length > 0 && !timeline[0]) {
		result.unshift(0);
	}

	if (result.length > 0 && !timeline[timeline.length - 1]) {
		result.pop();
	}

	return result;
}

export function trimVibrations(amount: number, patterns: number[]): number[] {
	// Initialize result array
	const result: number[] = [];

	// Apply remaining amount to the first element
	let remainingAmount = amount;

	// Process each vibration in the pattern
	for (let i = 0; i < patterns.length; i++) {
		const currentVibration = patterns[i];

		// If we still have amount to trim
		if (remainingAmount > 0) {
			// Calculate what's left after trimming
			const remaining = currentVibration - remainingAmount;

			// If there's duration left, add it to the result
			if (remaining > 0) {
				if (!result.length && i % 2) {
					result.push(0);
				}

				result.push(remaining);
				remainingAmount = 0; // Used all the trim amount
			} else {
				// This vibration was completely consumed
				remainingAmount = Math.abs(remaining); // Carry over the remaining amount
			}
		} else {
			if (!result.length && i % 2) {
				result.push(0);
			}

			// No more trimming needed, add the vibration as is
			result.push(currentVibration);
		}
	}

	return result;
}
