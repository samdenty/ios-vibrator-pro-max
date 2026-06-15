import { getPseudoStyles, registerStyleUpdater } from "../../utils";
import { clickableTriggers, triggersRoot } from "./clickable";

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
	let lastInputValue = inputRange.value;
	let preventChange = false;

	const updateValue = (event: PointerEvent | MouseEvent) => {
		const { width, x } = inputRange.getBoundingClientRect();

		const percentage = (event.clientX - x) / width;

		const min = Number.parseFloat(inputRange.min) || 0;
		const max = Number.parseFloat(inputRange.max) || 100;
		const step = Number.parseFloat(inputRange.step) || 1;

		const possibleRange = max - min;
		const newValue = min + percentage * possibleRange;

		inputRange.value = `${inputRange.step === "any" ? newValue : Math.round(newValue / step) * step}`;

		if (lastValue !== inputRange.value && event.type === "click") {
			lastInputValue = inputRange.value;
			lastValue = inputRange.value;

			inputRange.dispatchEvent(new Event("change"));
		} else if (lastInputValue !== inputRange.value && event.type !== "click") {
			lastInputValue = inputRange.value;
			inputRange.dispatchEvent(new Event("input"));
		}

		updateStyles();
	};

	const onChange = (event: Event) => {
		if (preventChange) {
			event.preventDefault();
			event.stopPropagation();
			preventChange = false;

			resetValueOnTouch();

			return;
		}

		lastInputValue = inputRange.value;
		lastValue = inputRange.value;
		updateStyles();
	};

	const resetValueOnTouch = () => {
		const resetToValue = lastValue;
		inputRange.value = resetToValue;
		updateStyles();

		requestAnimationFrame(() => {
			if (lastValue !== resetToValue) {
				return;
			}

			inputRange.value = resetToValue;
			updateStyles();
		});
	};

	const onPointerDown = (event: PointerEvent) => {
		preventChange = false;

		if (event.target === trigger.label) {
			return resetValueOnTouch();
		}

		updateValue(event);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (event.target === trigger.label) {
			preventChange = true;
			return resetValueOnTouch();
		}
	};

	const onPointerMove = (event: PointerEvent) => {
		if (event.target === trigger.label) {
			return resetValueOnTouch();
		}

		updateValue(event);
	};

	const onClick = (event: MouseEvent) => {
		updateValue(event);
	};

	const [updateStyles, disposeStyles] = registerStyleUpdater(
		trigger.clip,
		() => {
			const { width, height, borderRadius } = getPseudoStyles(
				inputRange,
				"::-webkit-slider-thumb",
			);

			const min = Number.parseFloat(inputRange.min) || 0;
			const max = Number.parseFloat(inputRange.max) || 100;
			const value = Number.parseFloat(inputRange.value);
			const percentage = (value - min) / (max - min);

			const left = `calc(${percentage * 100}% - ${width * percentage}px)`;

			return [
				"all: revert",
				"position: absolute",
				"top: 50%",
				`left: ${left}`,
				"transform: translateY(-50%)",
				`width: ${width}px`,
				`height: ${height}px`,
				`border-radius: ${borderRadius}`,
			];
		},
	);

	const disposeClick = trigger.onSimulateClick(onClick);
	inputRange.addEventListener("change", onChange, true);

	trigger.label.addEventListener("pointerdown", onPointerDown, true);
	trigger.label.addEventListener("pointermove", onPointerMove, true);
	trigger.label.addEventListener("pointerup", onPointerUp, true);

	return () => {
		disposeStyles();
		disposeClick();

		inputRange.removeEventListener("change", onChange);

		trigger.label.removeEventListener("pointerdown", onPointerDown);
		trigger.label.removeEventListener("pointermove", onPointerMove);
		trigger.label.removeEventListener("pointerup", onPointerUp);
	};
}

export function handleInputable(element: HTMLElement) {
	const disposeInputRange = handleInputRange(element as HTMLInputElement);

	if (disposeInputRange) {
		return disposeInputRange;
	}

	const trigger = clickableTriggers.get(element);
	if (!trigger || !isInputableElement(element)) {
		return;
	}

	const onClick = () => {
		element.focus();
	};

	const dispose = trigger.onSimulateClick(onClick);

	return () => {
		dispose();
	};
}

let lastActiveTrigger =
	typeof document !== "undefined"
		? (document.activeElement as HTMLElement | null)
		: null;

/**
 * For inputs and textareas, we need to disable the click passthrough when the element is focused.
 */
setInterval(() => {
	const activeElement =
		typeof document !== "undefined"
			? (document.activeElement as HTMLElement | null)
			: null;

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
