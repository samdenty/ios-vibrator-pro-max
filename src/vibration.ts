import { type Vibration, trimVibrations } from "./utils/merge-vibrations.js";

export const ignoredElements = new WeakSet<HTMLElement>([]);
export const trigger = createVibrationTrigger();

let vibration: Vibration = [Date.now(), []];

const MAGIC_NUMBER = 26.26;

export function createVibrationTrigger() {
	const label = document.createElement("label");

	setTimeout(() => {
		label.tabIndex = -1;
		label.ariaHidden = "true";
	});

	const input = document.createElement("input");
	input.type = "checkbox";
	input.setAttribute("style", "display: none !important");
	input.setAttribute("switch", "");

	input.addEventListener("touchstart", (event) => {
		return shouldVibrate();
	});

	label.appendChild(input);

	ignoredElements.add(label);

	label.addEventListener("click", () => {
		return shouldVibrate();
	});

	return { label, input };
}

export function vibrate(patterns: number[]) {
	vibration = [Date.now(), patterns];
}

export function shouldVibrate() {
	return true;

	vibration = [
		Date.now(),
		trimVibrations(Date.now() - vibration[0], vibration[1]),
	];

	return vibration[1][0] > 0;
}
