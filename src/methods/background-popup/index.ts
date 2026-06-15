import { polyfillKind, trimVibrations } from "../../utils";
import { setVibration } from "../../vibration";
import { enableMainThreadBlocking } from "../click-grant";

export const uuid =
	globalThis?.localStorage?.getItem("pro-max-vibrator-uuid") || uuidv4();
globalThis?.localStorage?.setItem("pro-max-vibrator-uuid", uuid);

export let popupConnected = false;
export let backgroundPopup = false;

/**
 * Whether the background popup is connected to the server
 *
 * @returns `true` if the background popup is connected to the server, `false` if it's not, or `null` if the polyfill is not enabled
 */
let fetchConnected: VoidFunction;
export const hasBackgroundPopup =
	polyfillKind === "granted"
		? new Promise<void>((resolve) => {
				fetchConnected = resolve;
			}).then(() =>
				fetch(`https://api.vibrator.dev/connected/${uuid}`).then(
					({ ok }) => ok,
				),
			)
		: null;

export function enableBackgroundPopup(enabled = true) {
	if (polyfillKind !== "granted" || backgroundPopup === enabled) {
		return;
	}

	backgroundPopup = enabled;

	if (enabled) {
		fetchConnected();
		setBackgroundVibration([0]);
		window.addEventListener("unload", unload);
	} else {
		window.removeEventListener("unload", unload);
	}
}

export let lastFetch = 0;

// Tracking variables for adaptive polling
export const networkLatencies = [100]; // Initial assumption: 100ms latency
export let avgLatency = 100;
export let noVibrationCount = 0;
export const MAX_NO_VIBRATION_WAIT = 40; // Max wait time when no vibrations (ms)

export function setBackgroundVibration(patterns: number[]) {
	if (!backgroundPopup) {
		return;
	}

	fetch(`https://api.vibrator.dev/${uuid}`, {
		method: "POST",
		body: JSON.stringify(patterns),
	}).then((res) => {
		popupConnected = res.ok;
	});
}

export function openBackgroundPopup() {
	enableMainThreadBlocking(popupConnected);

	setVibration([]);

	window.open(
		`https://api.vibrator.dev/redirect#${location.href}`,
		"_blank",
		"noopener noreferrer",
	);

	document.body.innerText = "📳";
	document.body.style.all = "unset";
	document.body.style.display = "flex";
	document.body.style.justifyContent = "center";
	document.body.style.alignItems = "center";
	document.body.style.backgroundColor = "white";
	document.body.style.color = "white";
	document.body.style.fontSize = `${Math.min(window.innerWidth, window.innerHeight) / 2}px`;

	document.title = "ios-vibrator-pro-max 📳";
}

export function fetchLatest() {
	try {
		lastFetch = Date.now();

		const xhr = new XMLHttpRequest();
		xhr.open("GET", `https://api.vibrator.dev/${uuid}`, false); // false makes the request synchronous
		xhr.send(null);

		const response = JSON.parse(xhr.responseText);

		if (response === null) {
			window.close();
		}

		// Check if this was a successful update with new vibration data
		const [start, newPatterns] = response;

		// We got new vibration data
		noVibrationCount = 0;
		const vibration = trimVibrations(Date.now() - start, newPatterns);
		setVibration(vibration);
		if (!vibration.length) {
			setVibration(newPatterns);
		}
	} catch {
		// ignore
	} finally {
		const latency = Date.now() - lastFetch;

		// Update network latency tracking
		networkLatencies.push(latency);

		if (networkLatencies.length > 10) {
			networkLatencies.shift();
		}

		avgLatency =
			networkLatencies.reduce((sum, val) => sum + val, 0) /
			networkLatencies.length;

		return -latency;
	}
}

function unload() {
	navigator.sendBeacon(
		`https://api.vibrator.dev/${uuid}`,
		JSON.stringify(null),
	);
}

function uuidv4() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
		(
			+c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
		).toString(16),
	);
}
