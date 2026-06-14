// Sorry Tim Cook, PWAs deserve some love too...

import { getSafariVersion, uuidv4 } from "./utils/index.js";
import { vibrate } from "./vibration.js";

const SAFARI_VERSION = getSafariVersion();

export const polyfillKind =
	SAFARI_VERSION && !navigator.vibrate
		? SAFARI_VERSION >= 18.4
			? "granted"
			: SAFARI_VERSION >= 18
				? "full"
				: null
		: null;

export let blockMainThread = false;
export let backgroundPopup = false;

export const uuid =
	globalThis?.localStorage?.getItem("pro-max-vibrator-uuid") || uuidv4();

globalThis?.localStorage?.setItem("pro-max-vibrator-uuid", uuid);

export function enableMainThreadBlocking(enabled = true) {
	blockMainThread = enabled;
}

/**
 * Whether the background popup is connected to the server
 *
 * @returns `true` if the background popup is connected to the server, `false` if it's not, or `null` if the polyfill is not enabled
 */
export const hasBackgroundPopup = polyfillKind
	? fetch(`https://api.vibrator.dev/connected/${uuid}`).then(({ ok }) => ok)
	: null;

export function enableBackgroundPopup(enabled = true) {
	if (polyfillKind === "granted") {
		backgroundPopup = enabled;

		if (enabled) {
			vibrate([0]);
		}
	}
}
