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
	let preventChange = false;

	const updateValue = (event: TouchEvent | MouseEvent) => {
		const isClickEvent = !("touches" in event);

		const clientX = isClickEvent ? event.clientX : event.touches[0].clientX;

		const { width, x } = inputRange.getBoundingClientRect();

		const percentage = (clientX - x) / width;

		const min = Number.parseFloat(inputRange.min) || 0;
		const max = Number.parseFloat(inputRange.max) || 100;
		const step = Number.parseFloat(inputRange.step) || 1;

		const possibleRange = max - min;
		const newValue = min + percentage * possibleRange;

		inputRange.value = `${inputRange.step === "any" ? newValue : Math.round(newValue / step) * step}`;

		console.log(
			"updateValue",
			inputRange.value,
			lastValue,
			lastValue !== inputRange.value,
			isClickEvent,
			event.target,
		);

		if (lastValue !== inputRange.value && isClickEvent) {
			lastValue = inputRange.value;
			inputRange.dispatchEvent(new Event("change"));
		}

		updateStyles();
	};

	const onChange = (event: Event) => {
		if (preventChange) {
			console.warn("on change prevent default");
			event.preventDefault();
			event.stopPropagation();
			preventChange = false;

			resetValueOnTouch();

			return;
		}

		console.log("onChange");
		lastValue = inputRange.value;
		updateStyles();
	};

	const resetValueOnTouch = () => {
		console.warn("resetValueOnTouch", lastValue, inputRange.value);

		const resetToValue = lastValue;
		inputRange.value = resetToValue;
		updateStyles();

		requestAnimationFrame(() => {
			if (lastValue !== resetToValue) {
				return;
			}

			console.warn("rAF resetValueOnTouch");

			inputRange.value = resetToValue;
			updateStyles();
		});
	};

	const onTouchStart = (event: TouchEvent) => {
		preventChange = false;
		console.log("onTouchStart", event.touches[0]);

		if (event.target === trigger.label) {
			return resetValueOnTouch();
		}

		updateValue(event);
	};

	const onTouchEnd = (event: TouchEvent) => {
		console.log("onTouchEnd");

		if (event.target === trigger.label) {
			preventChange = true;
			return resetValueOnTouch();
		}
	};

	const onTouchMove = (event: TouchEvent) => {
		console.log("onTouchMove", event.touches[0]);

		if (event.target === trigger.label) {
			return resetValueOnTouch();
		}

		updateValue(event);
	};

	const onClick = (event: MouseEvent) => {
		console.log("onClick", event.target);
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
				`left: ${left}`,
				`width: ${width}px`,
				`height: ${height}px`,
				`border-radius: ${borderRadius}`,
			];
		},
	);

	inputRange.addEventListener("change", onChange, true);
	inputRange.addEventListener("click", onClick, true);

	trigger.label.addEventListener("touchstart", onTouchStart, true);
	trigger.label.addEventListener("touchmove", onTouchMove, true);
	trigger.label.addEventListener("touchend", onTouchEnd, true);

	return () => {
		disposeStyles();

		inputRange.removeEventListener("change", onChange);
		inputRange.removeEventListener("click", onClick);

		trigger.label.removeEventListener("touchstart", onTouchStart);
		trigger.label.removeEventListener("touchmove", onTouchMove);
		trigger.label.removeEventListener("touchend", onTouchEnd);
	};
}

export function handleInputable(element: HTMLElement) {
	const dispose = handleInputRange(element as HTMLInputElement);

	if (dispose) {
		return dispose;
	}

	const trigger = clickableTriggers.get(element);
	if (!trigger || !isInputableElement(element)) {
		return;
	}

	const onClick = (event: MouseEvent) => {
		if (event.target !== trigger.label) {
			return;
		}

		console.log("focus inputable", element);
		element.focus();
	};

	trigger.label.addEventListener("click", onClick, true);

	return () => {
		trigger.label.removeEventListener("click", onClick);
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
