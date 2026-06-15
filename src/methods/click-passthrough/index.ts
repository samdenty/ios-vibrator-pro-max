import { updateStyles } from "../../utils";
import { handleClickable } from "./clickable";
import { forwardEvents } from "./forward-events";
import { handleInputable } from "./inputable";
import { handleMovable } from "./movable";

const elementDisposers = new WeakMap<HTMLElement, () => void>();

export let debugMode = false;

export function enableDebugMode(enabled = true) {
	debugMode = enabled;
	updateStyles();
}

export function handleAddElement(element: HTMLElement) {
	if (elementDisposers.has(element)) {
		return () => {};
	}

	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			handleAddElement(child as HTMLElement);
		}
	}

	const disposers = [
		handleClickable(element),
		handleInputable(element),
		forwardEvents(element),
		handleMovable(element),
	];

	elementDisposers.set(element, () => {
		disposers.reverse();

		for (const dispose of disposers) {
			dispose?.();
		}
	});

	return () => {
		handleRemoveElement(element);
	};
}

export function handleRemoveElement(element: HTMLElement) {
	const dispose = elementDisposers.get(element);
	dispose?.();
	elementDisposers.delete(element);

	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			handleRemoveElement(child as HTMLElement);
		}
	}
}

export { triggersRoot } from "./clickable";
