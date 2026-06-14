import { registerStyleUpdater } from "../utils/index.js";
import {
	createVibrationTrigger,
	hiddenTrigger,
	ignoredElements,
	rootTrigger,
	shouldVibrate,
} from "../vibration.js";
import { cloneMouseEvent } from "./mouse.js";
import { isNativeMovableElement } from "./movable.js";

export const triggersRoot = document.createElement("div");
triggersRoot.setAttribute("for", "ios-vibrator-pro-max-content-triggers");
triggersRoot.appendChild(hiddenTrigger.label);
ignoredElements.add(triggersRoot);

export const CLICKABLE = ["button", "input", "textarea", "select", "label"];

export const clickableTriggers = new Map<
	HTMLElement,
	{
		label: HTMLLabelElement;
		input: HTMLInputElement;
		clip: HTMLDivElement;
	}
>();

function isClickableElement(element: HTMLElement) {
	const tagName = element.tagName.toLowerCase();
	if (element.draggable) {
		return;
	}

	if (element.role !== "button" && !CLICKABLE.includes(tagName)) {
		return false;
	}

	if (isNativeMovableElement(element)) {
		return false;
	}

	return true;
}

let anchorId = 1;
let ignoreRootClick = false;

rootTrigger.label.addEventListener("click", (event) => {
	if (event.target !== rootTrigger.label) {
		return;
	}

	console.log("clicked on root label", event.target);

	if (ignoreRootClick) {
		console.log("ignore root click");
		return;
	}

	if (shouldVibrate()) {
		console.log("vibrating");
		return;
	}

	if (isNativeMovableElement(event.target as HTMLElement)) {
		console.log(
			"not preventing vibration on root trigger because it is a native movable element",
			event.target,
		);
		return;
	}

	console.log("prevent vibration on root trigger");
	event.preventDefault();
});

export function handleClickable(element: HTMLElement) {
	if (!isClickableElement(element)) {
		return;
	}

	const trigger = createVibrationTrigger();
	const anchorName = `--ios-vibrator-pro-max-${anchorId++}`;

	let stopPointerEvents = false;

	function onTouchStart(event: TouchEvent) {
		const { clientX, clientY } = event.touches[0];

		stopPointerEvents = true;

		updateStyles();

		const touchedElement = document.elementFromPoint(clientX, clientY);

		if (touchedElement === element) {
			stopPointerEvents = false;
			updateStyles();
		}
	}

	function onTouchEnd() {
		stopPointerEvents = false;
		updateStyles();
	}

	function onClick(event: MouseEvent) {
		if (event.target !== trigger.label) {
			return;
		}

		console.log("trigger synthetic click on ", element);

		click(event);

		if (!shouldVibrate()) {
			event.preventDefault();
		}
	}

	function click(event: MouseEvent) {
		ignoreRootClick = true;
		element.dispatchEvent(cloneMouseEvent("click", event));
		ignoreRootClick = false;
	}

	trigger.label.addEventListener("touchstart", onTouchStart, true);
	trigger.label.addEventListener("touchend", onTouchEnd, true);
	trigger.label.addEventListener("click", onClick, true);

	const computedStyle = getComputedStyle(element);

	element.style.setProperty(
		"anchor-name",
		`${anchorName}${computedStyle.anchorName !== "none" ? `, ${computedStyle.anchorName}` : ""}`,
		"important",
	);

	const [updateStyles, disposeStyles] = registerStyleUpdater(
		trigger.label,
		() => {
			const computedStyle = getComputedStyle(element);
			const highlightColor = computedStyle.getPropertyValue(
				"-webkit-tap-highlight-color",
			);

			return [
				"all: unset",
				"position: fixed",
				"top: anchor(top)",
				"left: anchor(left)",
				"bottom: anchor(bottom)",
				"right: anchor(right)",
				`position-anchor: ${anchorName}`,
				`border-radius: ${computedStyle.borderRadius}`,
				`pointer-events: ${stopPointerEvents ? "none" : "auto"}`,
				`-webkit-tap-highlight-color: ${highlightColor}`,
			];
		},
	);

	const triggers = new Set<HTMLLabelElement>();
	triggers.add(trigger.label);

	clickableTriggers.set(element, trigger);
	triggersRoot.appendChild(trigger.label);

	return () => {
		disposeStyles();

		trigger.label.removeEventListener("touchstart", onTouchStart);
		trigger.label.removeEventListener("touchend", onTouchEnd);
		trigger.label.removeEventListener("click", onClick);

		clickableTriggers.delete(element);

		trigger.label.remove();
	};
}

/**
 * Simulate a click on the element that is closest to the touch point.
 *
 * The wrapping div on body is a button so it can receive false clicks.
 */
rootTrigger.label.addEventListener(
	"click",
	(event: MouseEvent) => {
		if (event.target !== rootTrigger.label) {
			return;
		}

		const { clientX, clientY } = event;

		const rects = [...clickableTriggers].map(([element, trigger]) => {
			const rect = element.getBoundingClientRect();

			const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
			const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
			const distance = Math.sqrt(dx * dx + dy * dy);

			return [distance, trigger] as const;
		});

		rects.sort(([d1], [d2]) => d1 - d2);

		const [distance, trigger] = rects[0];

		if (distance && distance <= 15) {
			console.log("element is nearby so simulating click on ", trigger.label);
			const clickEvent = cloneMouseEvent("click", event);
			trigger.label.dispatchEvent(clickEvent);
		}
	},
	true,
);
