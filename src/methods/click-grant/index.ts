import { asyncWait, blockingWait, polyfillKind } from "../../utils";
import { getVibration, hiddenTrigger } from "../../vibration";
import {
	avgLatency,
	backgroundPopup,
	fetchLatest,
	MAX_NO_VIBRATION_WAIT,
	noVibrationCount,
	openBackgroundPopup,
	popupConnected,
} from "../background-popup";

export let blockMainThread = false;

export function enableMainThreadBlocking(enabled = true) {
	blockMainThread = enabled;
}

let lastGrant: number | null = null;
const MAGIC_NUMBER = 26.26;
const GRANT_TIMEOUT = 850;

// Authorization handler
export async function authorizeVibrations({ target, isTrusted }: UIEvent) {
	if (
		target === hiddenTrigger?.label ||
		target === hiddenTrigger?.input ||
		(backgroundPopup && !popupConnected && lastGrant) ||
		!isTrusted
	) {
		return;
	}

	lastGrant = Date.now();

	allowVibrationsDuringGrant();

	if (backgroundPopup && !popupConnected) {
		openBackgroundPopup();
	}
}

async function allowVibrationsDuringGrant() {
	let adjustment = 0;

	while (true) {
		const [vibrateMs, waitMs] = getVibration() as (number | undefined)[];

		if (vibrateMs == null) {
			// Determine wait time based on network conditions and vibration history
			const waitDuration =
				noVibrationCount > 5
					? Math.min(MAX_NO_VIBRATION_WAIT, avgLatency * 0.5) // Slower polling when no vibrations for a while
					: Math.min(MAX_NO_VIBRATION_WAIT * 0.5, avgLatency * 0.3); // More aggressive polling when we expect vibrations

			const adjustment = backgroundPopup === true ? fetchLatest() : 0;

			await wait(waitDuration + adjustment);

			continue;
		}

		const shouldVibrate = vibrateMs > 0;
		const waitTime =
			(shouldVibrate ? MAGIC_NUMBER : (waitMs ?? 0)) + adjustment;

		if (shouldVibrate) {
			hiddenTrigger?.label.click();
		}

		// If the wait time is long enough, schedule another fetch during it
		if (
			!shouldVibrate &&
			backgroundPopup === true &&
			waitTime > avgLatency * 1.5
		) {
			adjustment = fetchLatest();
			adjustment = blockingWait(waitTime + adjustment);
		} else {
			adjustment = await wait(waitTime);
		}
	}
}

function getTimeUntilGrantExpires(): number {
	if (polyfillKind === "full" || popupConnected) {
		return Number.POSITIVE_INFINITY;
	}

	if (!lastGrant) {
		return 0;
	}

	return Math.max(
		0,
		(backgroundPopup ? 250 : GRANT_TIMEOUT) - (Date.now() - lastGrant),
	);
}

async function wait(duration: number) {
	const grantTimeout = getTimeUntilGrantExpires();

	if (blockMainThread && grantTimeout <= 0) {
		return blockingWait(duration);
	}

	if (!blockMainThread || grantTimeout > duration) {
		return asyncWait(duration);
	}

	const adjustment = await asyncWait(grantTimeout);
	const wait = duration - grantTimeout - adjustment;
	return blockingWait(wait);
}
