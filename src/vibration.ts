import { type Vibration, trimVibrations } from "./utils";

export const ignoredElements = new WeakSet<HTMLElement>([]);
export const rootTrigger = createVibrationTrigger();
export const hiddenTrigger = createVibrationTrigger();

hiddenTrigger?.label.appendChild(hiddenTrigger?.input);

let vibration: Vibration = [Date.now(), []];

export function setVibration(patterns: number[]) {
	vibration = [Date.now(), patterns];

	return patterns;
}

export function getVibration() {
	setVibration(trimVibrations(Date.now() - vibration[0], vibration[1]));

	return vibration[1];
}

export function shouldVibrate() {
	const vibration = getVibration();

	return vibration[0] > 0;
}

export function createVibrationTrigger() {
	if (typeof document === "undefined") {
		return null;
	}

	const label = document.createElement("label");

	const input = document.createElement("input");
	input.type = "checkbox";
	input.setAttribute("switch", "");
	input.setAttribute("style", "display: none !important");

	setTimeout(() => {
		label.tabIndex = -1;
		input.tabIndex = -1;
	});

	ignoredElements.add(label);
	ignoredElements.add(input);

	return { label, input };
}
