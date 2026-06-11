import { registerStyleUpdater } from "../utils/styles/update-styles.js";
import {
	createVibrationTrigger,
	ignoredElements,
	trigger,
} from "../vibration.js";

export const triggersRoot = document.createElement("div");
triggersRoot.setAttribute("for", "ios-vibrator-pro-max-content-triggers");
ignoredElements.add(triggersRoot);

export const CLICKABLE = ["button", "input", "textarea", "select", "label"];

export const clickableTriggers = new Map<
	HTMLElement,
	{ label: HTMLLabelElement; input: HTMLInputElement }
>();

let anchorId = 1;

export function handleClickable(element: HTMLElement) {
	const tagName = element.tagName.toLowerCase();
	if (element.draggable) {
		return;
	}

	if (!CLICKABLE.includes(tagName) && element.role !== "button") {
		return;
	}

	const trigger = createVibrationTrigger();
	const anchorName = `--ios-vibrator-pro-max-${anchorId++}`;

	let transparentHighlight = false;
	let touchMove = false;

	function onTouchStart(event: TouchEvent) {
		touchMove = false;

		const { clientX, clientY } = event.touches[0];

		transparentHighlight = true;

		updateStyles();

		const touchedElement = document.elementFromPoint(clientX, clientY);

		if (touchedElement === element) {
			transparentHighlight = false;
			updateStyles();
		}
	}

	function onTouchMove() {
		touchMove = true;
	}

	function onClick(event: MouseEvent) {
		transparentHighlight = false;
		updateStyles();

		if (touchMove || event.target !== trigger.input) {
			return;
		}

		setTimeout(() => {
			element.click();
		});
	}

	trigger.input.addEventListener("click", onClick, true);
	trigger.label.addEventListener("touchstart", onTouchStart, true);
	trigger.label.addEventListener("touchmove", onTouchMove, true);

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
				"overflow: hidden",
				`position-anchor: ${anchorName}`,
				`border-radius: ${computedStyle.borderRadius}`,
				`-webkit-tap-highlight-color: ${transparentHighlight ? "transparent" : highlightColor}`,
			];
		},
	);

	const triggers = new Set<HTMLLabelElement>();
	triggers.add(trigger.label);

	clickableTriggers.set(element, trigger);
	triggersRoot.appendChild(trigger.label);

	return () => {
		disposeStyles();

		trigger.input.removeEventListener("click", onClick);
		trigger.label.removeEventListener("touchstart", onTouchStart);
		trigger.label.removeEventListener("touchmove", onTouchMove);

		clickableTriggers.delete(element);

		trigger.label.remove();
	};
}

/**
 * Simulate a click on the element that is closest to the touch point.
 *
 * The wrapping div on body is a button so it can receive false clicks.
 */
trigger.label.addEventListener(
	"click",
	(event: MouseEvent) => {
		if (event.target !== trigger.label) {
			return;
		}

		const { clientX, clientY } = event;

		const rects = [...clickableTriggers].map(([element, trigger]) => {
			const rect = element.getBoundingClientRect();

			return [
				Math.max(Math.abs(rect.x - clientX), Math.abs(rect.y - clientY)),
				() => {
					trigger.label.click();
				},
			] as const;
		});

		rects.sort(([d1], [d2]) => d1 - d2);

		const [distance, click] = rects[0];

		if (distance && distance <= 30) {
			click();
		}
	},
	true,
);
