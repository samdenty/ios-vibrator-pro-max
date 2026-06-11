import { getDefaultSwitchDimensions } from "../utils/styles/default-styles.js";
import { registerStyleUpdater } from "../utils/styles/update-styles.js";
import { clickableTriggers } from "./clickable.js";
import { isInputRangeElement } from "./inputable.js";

export function isMovableElement(element: HTMLElement) {
	return isInputRangeElement(element);
}

export function handleMovable(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	if (!trigger || !isMovableElement(element)) {
		return;
	}

	let moving = false;

	let startX = 0;
	let startY = 0;

	let transformX = 0;
	let transformY = 0;
	let checked = trigger.input.checked;

	function onTouchStart(event: TouchEvent) {
		const { clientX, clientY } = event.touches[0];
		startX = clientX;
		startY = clientY;
		transformX = 0;
		transformY = 0;
		moving = true;

		updateLabelStyles();
	}

	const onTouchEnd = () => {
		moving = false;
		transformX = 0;
		transformY = 0;

		updateInputStyles();
		updateLabelStyles();
		trigger.input.checked = checked;
	};

	const onTouchMove = (event: TouchEvent) => {
		const { clientX, clientY } = event.touches[0];

		const deltaX = clientX - startX;
		const deltaY = clientY - startY;

		if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 80) {
			startX = clientX;
			startY = clientY;

			transformX += deltaX;
			transformY += deltaY;
			checked = !checked;
		}

		updateInputStyles();
	};

	trigger.input.addEventListener("touchstart", onTouchStart, true);
	trigger.input.addEventListener("touchmove", onTouchMove, true);
	trigger.input.addEventListener("touchend", onTouchEnd, true);

	const [updateLabelStyles, disposeLabelStyles] = registerStyleUpdater(
		trigger.label,
		() => {
			return moving ? ["overflow: visible"] : [];
		},
	);

	const switchDimensions = getDefaultSwitchDimensions();

	const [updateInputStyles, disposeInputStyles] = registerStyleUpdater(
		trigger.input,
		() => {
			const { width, height } = trigger.label.getBoundingClientRect();

			return [
				"all: revert",
				"position: absolute",
				"width: 100%",
				"height: 100%",
				`transform: translate(${moving ? transformX : 0}px, ${moving ? transformY : 0}px) scale(100%)`,
				"opacity: 0.4",
			];
		},
	);

	return () => {
		disposeInputStyles();
		disposeLabelStyles();

		trigger.input.removeEventListener("touchstart", onTouchStart);
		trigger.input.removeEventListener("touchmove", onTouchMove);
		trigger.input.removeEventListener("touchend", onTouchEnd);
	};
}
