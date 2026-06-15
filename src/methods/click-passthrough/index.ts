import { handleClickable } from "./clickable";
import { ignoredElements, rootTrigger } from "../../vibration";
import { handleInputable } from "./inputable";
import { forwardEvents } from "./forward-events";
import { handleMovable } from "./movable";
import { updateStyles } from "../../utils";

const elementDisposers = new WeakMap<HTMLElement, () => void>();

export let debugMode = false;

export function enableDebugMode(enabled = true) {
	debugMode = enabled;
	updateStyles();
}

export function handleAddElement(
	element: HTMLElement,
	parents?: HTMLElement[],
) {
	if (ignoredElements.has(element)) {
		return;
	}

	if (!parents) {
		parents = [];

		let parent = element.parentElement;
		while (parent && parent !== rootTrigger?.label) {
			parents.push(parent);
			parent = parent.parentElement;
		}
	}

	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			handleAddElement(child as HTMLElement, [...parents, element]);
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
}

export function handleRemoveElement(element: HTMLElement) {
	const dispose = elementDisposers.get(element);
	dispose?.();
	elementDisposers.delete(element);
}

export { triggersRoot } from "./clickable";
