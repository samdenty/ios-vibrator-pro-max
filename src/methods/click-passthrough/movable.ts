import { debugMode } from ".";
import { registerStyleUpdater } from "../../utils";
import { shouldVibrate } from "../../vibration";
import { clickableTriggers } from "./clickable";
import { isInputRangeElement } from "./inputable";
import { clonePointerEvent } from "./pointer";

export function isNativeMovableElement(element: HTMLElement) {
	const tagName = element.tagName.toLowerCase();
	const switchAttribute = element.getAttribute("switch");

	return (
		tagName === "input" &&
		(element as HTMLInputElement).type === "checkbox" &&
		switchAttribute !== null &&
		switchAttribute !== "false"
	);
}

export const MOVABLE_ROLES = new Set(["slider", "range"]);

export function isMovableElement(element: HTMLElement) {
	if (MOVABLE_ROLES.has(element.role ?? "")) {
		return true;
	}

	return isInputRangeElement(element);
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

	let angleDeg360 = 0;

	let flipDirection = false;

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

		const deltaX = pageX - x;
		const deltaY = pageY - y;

		const angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

		angleDeg360 = ((angleDeg % 360) + 360) % 360;
		touchMove = true;
		flipDirection = !flipDirection;

		if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 3) {
			x = pageX;
			y = pageY;
		}

		updateClipStyles();
	};

	const onTouchEnd = () => {
		console.log("onTouchEnd");

		if (!touchMove && touchStart) {
			console.log("trigger synthetic click on ", trigger.label);

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
				"position: absolute",
				"top: 50%",
				"left: 50%",
				`transform: translate(-50%, -50%) ${touchStart ? "" : "scale(200%)"}`,
			];
		},
	);

	const [updateClipStyles, disposeClipStyles] = registerStyleUpdater(
		trigger.clip,
		() => {
			const opacity = debugMode ? 0.4 : 0;

			if (!touchStart) {
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

			const scale = 1;
			const height = 31 * scale;
			const width = 70 * scale;

			const vibrate = shouldVibrate();

			const top = (vibrate ? startY : y) - height / 2;
			const left = (vibrate ? startX : x) - width / 2;

			return [
				"all: unset",
				"position: fixed",
				"overflow: hidden",
				`height: ${height}px`,
				`width: ${width}px`,
				"top: 0",
				"left: 0",
				`direction: ${vibrate && flipDirection ? "rtl" : "ltr"}`,
				`transform: translate(${left}px, ${top}px) rotate(${angleDeg360}deg) ${vibrate ? "" : "translateX(100px)"}`,
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
