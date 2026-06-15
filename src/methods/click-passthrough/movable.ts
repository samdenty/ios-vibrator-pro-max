import { debugMode } from ".";
import {
	getTouchActionCandidates,
	isMovableTouchAction,
	registerStyleUpdater,
} from "../../utils";
import { shouldVibrate } from "../../vibration";
import { clickableTriggers } from "./clickable";
import { clonePointerEvent } from "./forward-events";
import { isInputRangeElement } from "./inputable";

const cachedIsMovable = new WeakMap<HTMLElement, boolean>();

export function isMovableElement(element: HTMLElement) {
	if (isInputRangeElement(element)) {
		return true;
	}

	if (!cachedIsMovable.has(element)) {
		if (!getTouchActionCandidates().has(element)) {
			return false;
		}

		const touchAction = getComputedStyle(element).touchAction;
		const isMovable = isMovableTouchAction(touchAction);

		cachedIsMovable.set(element, isMovable);

		requestAnimationFrame(() => {
			cachedIsMovable.delete(element);
		});
	}

	return cachedIsMovable.get(element)!;
}

export function handleMovable(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	const isInputRange = isInputRangeElement(element);

	if (!trigger || !isMovableElement(element)) {
		return;
	}

	let pointerDown: PointerEvent | null = null;
	let pointerMove = false;

	let startX = 0;
	let startY = 0;

	let x = 0;
	let y = 0;

	let flippedDirection = false;

	function onPointerDown(event: PointerEvent) {
		const box = element.getBoundingClientRect();

		startX = event.clientX - box.x;
		startY = event.clientY - box.y;

		x = startX;
		y = startY;

		pointerMove = false;
		pointerDown = event;

		updateClipStyles();
		updateInputStyles();
	}

	const onPointerMove = (event: PointerEvent) => {
		const box = element.getBoundingClientRect();

		x = event.clientX - box.x;
		y = event.clientY - box.y;

		pointerMove = true;
		flippedDirection = !flippedDirection;

		updateClipStyles();
	};

	const onPointerUp = () => {
		if (!pointerMove && pointerDown) {
			trigger.simulateClick(clonePointerEvent("click", pointerDown));

			if (!shouldVibrate()) {
				trigger.input.disabled = true;

				setTimeout(() => {
					trigger.input.disabled = false;
				});
			}
		}

		trigger.input.checked = false;
		pointerMove = false;
		pointerDown = null;

		updateClipStyles();
		updateInputStyles();

		requestAnimationFrame(() => {
			trigger.input.checked = false;

			updateClipStyles();
			updateInputStyles();
		});
	};

	const [updateInputStyles, disposeInputStyles] = registerStyleUpdater(
		trigger.input,
		() => {
			return [
				"all: revert",
				"position: absolute",
				"width: 100%",
				"height: 100%",
				"top: 50%",
				"left: 50%",
				"transform: translate(-50%, -50%)",
				"touch-action: none",
			];
		},
	);

	const [updateClipStyles, disposeClipStyles] = registerStyleUpdater(
		trigger.clip,
		() => {
			const opacity = debugMode ? 0.4 : 0;

			if (!pointerMove || !pointerDown) {
				const computedStyle = getComputedStyle(element);
				if (isInputRange) {
					return [
						"overflow: hidden",
						`opacity: ${opacity}`,
						`clip-path: inset(0 round ${computedStyle.borderRadius})`,
					];
				}

				return [
					"all: revert",
					"width: 100%",
					"height: 100%",
					"overflow: hidden",
					`opacity: ${opacity}`,
					`clip-path: inset(0 round ${computedStyle.borderRadius})`,
				];
			}

			const scale = 0.4;
			const height = 31 * scale;
			const width = 70 * scale;

			const vibrate = shouldVibrate();

			const top = (vibrate ? startY : y) - height / 2;
			const left = (vibrate ? startX : x) - width / 2;

			const deltaX = x - startX;
			const deltaY = y - startY;

			const angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
			const angleDeg360 = ((angleDeg % 360) + 360) % 360;

			return [
				"all: unset",
				"position: absolute",
				"overflow: hidden",
				`height: ${height}px`,
				`width: ${width}px`,
				"top: 0",
				"left: 0",
				`direction: ${!vibrate || flippedDirection ? "rtl" : "ltr"}`,
				`transform: translate(${left}px, ${top}px) rotate(${angleDeg360}deg) translateX(${vibrate ? 0 : 50}px)`,
				`opacity: ${opacity}`,
			];
		},
	);

	const setPointerCapture = element.setPointerCapture;
	const releasePointerCapture = element.releasePointerCapture;

	element.setPointerCapture = () => {};
	element.releasePointerCapture = () => {};

	trigger.input.addEventListener("pointerdown", onPointerDown, true);
	trigger.input.addEventListener("pointermove", onPointerMove, true);
	trigger.input.addEventListener("pointerup", onPointerUp, true);

	return () => {
		disposeClipStyles();
		disposeInputStyles();

		element.setPointerCapture = setPointerCapture;
		element.releasePointerCapture = releasePointerCapture;

		trigger.input.removeEventListener("pointerdown", onPointerDown);
		trigger.input.removeEventListener("pointermove", onPointerMove);
		trigger.input.removeEventListener("pointerup", onPointerUp);
	};
}

export function isNativeMovableElement(element: HTMLElement) {
	if (element.draggable) {
		return true;
	}

	const tagName = element.tagName.toLowerCase();
	const switchAttribute = element.getAttribute("switch");

	return (
		tagName === "input" &&
		(element as HTMLInputElement).type === "checkbox" &&
		switchAttribute !== null &&
		switchAttribute !== "false"
	);
}
