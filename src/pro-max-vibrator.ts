// Sorry Tim Cook, PWAs deserve some love too...

import { type Vibration, trimVibrations } from "./mergeVibrations.js";

const SAFARI_VERSION = getSafariVersion();
const MAGIC_NUMBER = 26.26;
const GRANT_TIMEOUT = 850;

const polyfillKind =
	SAFARI_VERSION && !navigator.vibrate
		? SAFARI_VERSION >= 18.4
			? "granted"
			: SAFARI_VERSION >= 18
				? "full"
				: null
		: null;

let trigger: HTMLLabelElement;
let timer: any;
let lastGrant: number | null = null;
let vibration: Vibration = [Date.now(), []];
let blockMainThread = false;
let backgroundPopup: "connected" | boolean = false;

const uuid =
	globalThis?.localStorage?.getItem("pro-max-vibrator-uuid") || uuidv4();
globalThis?.localStorage?.setItem("pro-max-vibrator-uuid", uuid);

export function enableMainThreadBlocking(enabled = true) {
	blockMainThread = enabled;
}

export function enableBackgroundPopup(enabled = true) {
	if (polyfillKind === "granted") {
		backgroundPopup = enabled;

		if (enabled) {
			teachSafariHowToVibe(0);
		}
	}
}

function teachSafariHowToVibe(
	rawPatterns: Iterable<number> | VibratePattern,
): boolean {
	const patterns =
		typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

	if (
		!patterns.length ||
		patterns.some((pattern) => typeof pattern !== "number")
	) {
		return false;
	}

	vibration = [Date.now(), patterns];

	if (backgroundPopup) {
		fetch(`https://vibrator.samdenty.workers.dev/${uuid}`, {
			method: "POST",
			body: JSON.stringify(vibration),
		}).then((res) => {
			backgroundPopup = res.ok ? "connected" : true;
		});
	}

	return true;
}

async function allowVibrationsDuringGrant() {
	let adjustment = 0;
	let lastFetch = 0;

	// Tracking variables for adaptive polling
	const networkLatencies = [100]; // Initial assumption: 100ms latency
	let avgLatency = 100;
	let noVibrationCount = 0;
	const MAX_NO_VIBRATION_WAIT = 40; // Max wait time when no vibrations (ms)

	function fetchLatest() {
		try {
			lastFetch = Date.now();

			const xhr = new XMLHttpRequest();
			xhr.open("GET", `https://vibrator.samdenty.workers.dev/${uuid}`, false); // false makes the request synchronous
			xhr.send(null);

			const response = JSON.parse(xhr.responseText);

			// Check if this was a successful update with new vibration data
			const [start, newPatterns] = response;

			// We got new vibration data
			noVibrationCount = 0;
			vibration = [Date.now(), trimVibrations(Date.now() - start, newPatterns)];
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

	while (true) {
		vibration = [
			Date.now(),
			trimVibrations(Date.now() - vibration[0], vibration[1]),
		];

		const [vibrateMs, waitMs] = vibration[1] as (number | undefined)[];

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

		const vibrate = vibrateMs > 0;
		const waitTime = (vibrate ? MAGIC_NUMBER : (waitMs ?? 0)) + adjustment;

		if (vibrate) {
			trigger.click();
		}

		// If the wait time is long enough, schedule another fetch during it
		if (!vibrate && backgroundPopup === true && waitTime > avgLatency * 1.5) {
			adjustment = fetchLatest();
			adjustment = blockingWait(waitTime + adjustment);
		} else {
			adjustment = await wait(waitTime);
		}
	}
}

function getTimeUntilGrantExpires(): number {
	if (polyfillKind === "full" || backgroundPopup === "connected") {
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

function blockingWait(ms: number) {
	if (ms < 0) {
		return ms;
	}

	const start = Date.now();
	while (Date.now() - start < ms) {}

	return 0;
}

async function asyncWait(ms: number) {
	const start = Date.now();

	await new Promise<void>((resolve) => {
		clearTimeout(timer);
		timer = setTimeout(resolve, ms);
	});

	return ms - (Date.now() - start);
}

if (polyfillKind) {
	navigator.vibrate = teachSafariHowToVibe;

	// Setup trigger elements
	trigger = document.createElement("label");
	trigger.ariaHidden = "true";
	trigger.style.display = "none";

	const triggerInput = document.createElement("input");
	triggerInput.type = "checkbox";
	triggerInput.setAttribute("switch", "");
	trigger.appendChild(triggerInput);

	// Authorization handler
	async function authorizeVibrations({ target }: UIEvent) {
		if (
			target === trigger ||
			target === triggerInput ||
			(backgroundPopup === true && lastGrant)
		) {
			return;
		}

		lastGrant = Date.now();

		allowVibrationsDuringGrant();

		if (backgroundPopup === true) {
			blockMainThread = true;

			const newTab = document.createElement("a");
			newTab.href = location.href;
			newTab.target = "_blank";
			newTab.click();

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
	}

	// Add event listeners
	window.addEventListener("click", authorizeVibrations);
	window.addEventListener("touchend", authorizeVibrations);
	window.addEventListener("keyup", authorizeVibrations);
	window.addEventListener("keypress", authorizeVibrations);

	window.addEventListener("unload", () => {
		navigator.sendBeacon(
			`https://vibrator.samdenty.workers.dev/${uuid}`,
			JSON.stringify([Date.now(), []]),
		);
	});

	// Add trigger to document
	if (document.head) {
		document.head.appendChild(trigger);
	} else {
		setTimeout(() => document.head.appendChild(trigger), 0);
	}
}

function getSafariVersion() {
	if (typeof navigator === "undefined") {
		return null;
	}

	const userAgent = navigator.userAgent;

	if (
		userAgent.indexOf("Safari") !== -1 &&
		userAgent.indexOf("Chrome") === -1
	) {
		const versionRegex = /Version\/(\d+(\.\d+)?)/;
		const match = userAgent.match(versionRegex);

		if (match?.[1]) {
			return Number.parseFloat(match[1]);
		}
	}

	return null;
}

function uuidv4() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
		(
			+c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
		).toString(16),
	);
}
