import { getPseudoStyles } from "../utils/styles/pseudo-styles.js";
import { registerStyleUpdater } from "../utils/styles/update-styles.js";
import { clickableTriggers, triggersRoot } from "./clickable.js";

const hiddenTriggers = new Set<HTMLElement>();

export function isInputRangeElement(
	element: HTMLElement,
): element is HTMLInputElement {
	return (
		element.tagName.toLowerCase() === "input" &&
		(element as HTMLInputElement).type === "range"
	);
}

function isInputableElement(element: HTMLElement) {
	const tagName = element.tagName.toLowerCase();

	return (
		(tagName === "input" && (element as HTMLInputElement).type === "text") ||
		tagName === "textarea" ||
		tagName === "select"
	);
}

function handleInputRange(inputRange: HTMLInputElement) {
	const trigger = clickableTriggers.get(inputRange);
	if (!trigger || !isInputRangeElement(inputRange)) {
		return;
	}

	let lastValue = inputRange.value;

	const updateValue = (event: TouchEvent | MouseEvent) => {
		const isClickEvent = !("touches" in event);
		const isToSwitch = event.target === trigger.input;
		const isToTrigger = event.target === trigger.label;

		const clientX = isClickEvent ? event.clientX : event.touches[0].clientX;

		if (isClickEvent ? isToTrigger : isToSwitch) {
			const { width, x } = inputRange.getBoundingClientRect();

			const percentage = (clientX - x) / width;

			const min = Number.parseFloat(inputRange.min) || 0;
			const max = Number.parseFloat(inputRange.max) || 100;
			const step = Number.parseFloat(inputRange.step) || 1;

			const possibleRange = max - min;
			const newValue = min + percentage * possibleRange;

			inputRange.value = `${inputRange.step === "any" ? newValue : Math.round(newValue / step) * step}`;
		}

		if (
			lastValue !== inputRange.value &&
			isClickEvent &&
			!isToTrigger &&
			isToSwitch
		) {
			lastValue = inputRange.value;

			inputRange.dispatchEvent(new Event("change"));
		}
	};

	const onChange = () => {
		lastValue = inputRange.value;
		updateStyles();
	};

	trigger.label.addEventListener("click", updateValue, true);

	inputRange.addEventListener("change", onChange);
	trigger.input.addEventListener("touchmove", updateValue, true);

	const [updateStyles, disposeStyles] = registerStyleUpdater(
		trigger.input,
		() => {
			const { width, height, borderRadius } = getPseudoStyles(
				inputRange,
				"::-webkit-slider-thumb",
			);

			const min = Number.parseFloat(inputRange.min) || 0;
			const max = Number.parseFloat(inputRange.max) || 100;
			const value = Number.parseFloat(inputRange.value);

			const left = `calc(${((value - min) / (max - min)) * 100}% - ${width / 2}px)`;

			return [
				"all: unset",
				"position: absolute",
				`left: ${left}`,
				`width: ${width}px`,
				`height: ${height}px`,
				`border-radius: ${borderRadius}`,
			];
		},
	);

	return () => {
		disposeStyles();

		trigger.label.removeEventListener("click", updateValue);
		trigger.input.removeEventListener("touchmove", updateValue);
		inputRange.removeEventListener("change", updateStyles);
	};
}

export function handleInputable(element: HTMLElement) {
	const dispose = handleInputRange(element as HTMLInputElement);

	if (dispose) {
		return dispose;
	}

	const triggers = clickableTriggers.get(element);
	if (!triggers || !isInputableElement(element)) {
		return;
	}

	const onClick = () => {
		element.focus();
	};

	triggers.label.addEventListener("click", onClick);

	return () => {
		triggers.label.removeEventListener("click", onClick);
	};
}

let lastActiveTrigger = document.activeElement as HTMLElement | null;

/**
 * For inputs and textareas, we need to disable the click passthrough when the element is focused.
 */
setInterval(() => {
	const activeElement = document.activeElement as HTMLElement | null;

	if (activeElement === lastActiveTrigger) {
		return;
	}

	if (lastActiveTrigger) {
		const trigger = clickableTriggers.get(lastActiveTrigger);

		if (trigger && hiddenTriggers.has(trigger.label)) {
			triggersRoot.appendChild(trigger.label);
		}
	}

	lastActiveTrigger = activeElement;

	if (activeElement && !isInputableElement(activeElement)) {
		return;
	}

	if (!activeElement || hiddenTriggers.has(activeElement)) {
		return;
	}

	const trigger = clickableTriggers.get(activeElement);
	if (!trigger) {
		return;
	}

	hiddenTriggers.add(trigger.label);
	trigger.label.remove();
});
