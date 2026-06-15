import { debugMode } from ".";
import {
	registerStyleUpdater,
	isMovableTouchAction,
	getTouchActionCandidates,
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

	let touchStart: TouchEvent | null = null;
	let touchMove = false;

	let startX = 0;
	let startY = 0;

	let x = 0;
	let y = 0;

	let flippedDirection = false;

	function onTouchStart(event: TouchEvent) {
		const { pageX, pageY } = event.touches[0];

		startX = pageX;
		startY = pageY;

		x = pageX;
		y = pageY;

		touchMove = false;
		touchStart = event;

		updateClipStyles();
		updateInputStyles();
	}

	const onTouchMove = (event: TouchEvent) => {
		const { pageX, pageY } = event.touches[0];

		touchMove = true;
		flippedDirection = !flippedDirection;
		x = pageX;
		y = pageY;

		updateClipStyles();
	};

	const onTouchEnd = () => {
		if (!touchMove && touchStart) {
			trigger.simulateClick(
				clonePointerEvent("click", {
					altKey: touchStart.altKey,
					cancelable: touchStart.cancelable,
					ctrlKey: touchStart.ctrlKey,
					metaKey: touchStart.metaKey,
					shiftKey: touchStart.shiftKey,
					view: touchStart.view,
					detail: touchStart.detail,
					which: touchStart.which,
					composed: touchStart.composed,
					clientX: touchStart.touches[0].clientX,
					clientY: touchStart.touches[0].clientY,
					screenX: touchStart.touches[0].screenX,
					screenY: touchStart.touches[0].screenY,
				}),
			);

			if (!shouldVibrate()) {
				trigger.input.disabled = true;

				setTimeout(() => {
					trigger.input.disabled = false;
				});
			}
		}

		trigger.input.checked = false;
		touchMove = false;
		touchStart = null;

		updateClipStyles();
		updateInputStyles();

		requestAnimationFrame(() => {
			trigger.input.checked = false;

			updateClipStyles();
			updateInputStyles();
		});
	};

	trigger.input.addEventListener("touchstart", onTouchStart, true);
	trigger.input.addEventListener("touchmove", onTouchMove, true);
	trigger.input.addEventListener("touchend", onTouchEnd, true);

	const [updateInputStyles, disposeInputStyles] = registerStyleUpdater(
		trigger.input,
		() => {
			return [
				"all: revert",
				"width: 100%",
				"height: 100%",
				"touch-action: none",
			];
		},
	);

	const [updateClipStyles, disposeClipStyles] = registerStyleUpdater(
		trigger.clip,
		() => {
			const opacity = debugMode ? 0.4 : 0;

			if (!touchMove || !touchStart) {
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

			const scale = 0.2;
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
				"position: fixed",
				"overflow: hidden",
				`height: ${height}px`,
				`width: ${width}px`,
				"top: 0",
				"left: 0",
				`direction: ${!vibrate || flippedDirection ? "rtl" : "ltr"}`,
				`transform: translate(${left - window.scrollX}px, ${top - window.scrollY}px) rotate(${angleDeg360}deg) translateX(${vibrate ? 0 : 50}px)`,
				`opacity: ${opacity}`,
			];
		},
	);

	const setPointerCapture = element.setPointerCapture;
	const releasePointerCapture = element.releasePointerCapture;

	element.setPointerCapture = () => {};
	element.releasePointerCapture = () => {};

	return () => {
		disposeClipStyles();
		disposeInputStyles();

		element.setPointerCapture = setPointerCapture;
		element.releasePointerCapture = releasePointerCapture;

		trigger.input.removeEventListener("touchstart", onTouchStart);
		trigger.input.removeEventListener("touchmove", onTouchMove);
		trigger.input.removeEventListener("touchend", onTouchEnd);
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
