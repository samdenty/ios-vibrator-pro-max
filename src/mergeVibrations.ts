export type Vibration = [number, number[]];

export function mergeVibrations(...patterns: Vibration[]): number[] {
  if (patterns.length === 0) {
    return [];
  }

  // Normalize patterns to millisecond precision
  const normalizedPatterns: Vibration[] = patterns.map(([start, intervals]) => [
    Math.round(start),
    intervals.map((interval) => Math.max(0, Math.round(interval))), // Ensure at least 1ms
  ]);

  // Find the latest start time
  const startTime = Math.max(...normalizedPatterns.map(([start]) => start));

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
        const toIndex = Math.min(
          timeline.length,
          currentTime - startTime + interval
        );

        // Mark the vibration period in the timeline
        for (let i = fromIndex; i < toIndex; i++) {
          timeline[i] = true;
        }
      }
      currentTime += interval;
      isVibrating = !isVibrating;
    }
  });

  // Convert timeline back to intervals
  const result: number[] = [];
  let currentState = timeline[0];
  let currentCount = 0;

  // Process the timeline including the final state transition
  for (let i = 0; i <= timeline.length; i++) {
    const newState = i < timeline.length ? timeline[i] : !currentState;

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
