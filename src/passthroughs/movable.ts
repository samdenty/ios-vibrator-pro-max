import { registerStyleUpdater } from "../utils/index.js";
import { shouldVibrate } from "../vibration.js";
import { clickableTriggers } from "./clickable.js";
import { isInputRangeElement } from "./inputable.js";
import { cloneMouseEvent } from "./mouse.js";

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

export function isMovableElement(element: HTMLElement) {
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
	let angleDeg360 = 0;

	let checked = trigger.input.checked;

	function onTouchStart(event: TouchEvent) {
		const { pageX, pageY } = event.touches[0];
		startX = pageX;
		startY = pageY;
		touchMove = false;
		touchStart = event;

		updateInputStyles();
	}

	const onTouchMove = (event: TouchEvent) => {
		const { pageX, pageY } = event.touches[0];

		const deltaX = pageX - startX;
		const deltaY = pageY - startY;

		const angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

		angleDeg360 = ((angleDeg % 360) + 360) % 360;
		touchMove = true;
		startX = pageX;
		startY = pageY;
		checked = !checked;

		updateClipStyles();
	};

	const onTouchEnd = () => {
		console.log("onTouchEnd");

		if (!touchMove && touchStart) {
			console.log("trigger synthetic click on ", trigger.label);

			trigger.label.dispatchEvent(
				cloneMouseEvent("click", {
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

		checked = false;
		touchMove = false;
		touchStart = null;

		updateClipStyles();

		requestAnimationFrame(() => {
			checked = false;
			trigger.input.checked = false;

			updateClipStyles();
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
			if (!touchStart) {
				if (isInputRange) {
					return ["overflow: hidden", "opacity: 0.4"];
				}

				return [
					"all: unset",
					"width: 100%",
					"height: 100%",
					"overflow: hidden",
					"opacity: 0.4",
				];
			}

			const scale = 3;
			const height = 31 * scale;
			const width = 70 * scale;

			const top = startY - height / 2;
			const left = startX - width / 2;

			const vibrate = shouldVibrate();

			return [
				"all: unset",
				"position: fixed",
				"overflow: hidden",
				`height: ${height}px`,
				`width: ${width}px`,
				`top: ${top}px`,
				`left: ${left}px`,
				`transform: rotate(${angleDeg360}deg) translateX(${vibrate ? (checked ? width : -width) / 3 : width}px)`,
				"opacity: 1",
			];
		},
	);

	return () => {
		disposeClipStyles();
		disposeInputStyles();

		trigger.input.removeEventListener("touchstart", onTouchStart);
		trigger.input.removeEventListener("touchmove", onTouchMove);
		trigger.input.removeEventListener("touchend", onTouchEnd);
	};
}
