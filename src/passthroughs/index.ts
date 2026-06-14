import { handleClickable } from "./clickable.js";
import { ignoredElements, rootTrigger } from "../vibration.js";
import { handleTouchEvents } from "./touch.js";
import { handleInputable } from "./inputable.js";
import { handleMouseEvents } from "./mouse.js";
import { handleMovable } from "./movable.js";

const elementDisposers = new WeakMap<HTMLElement, () => void>();

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
		while (parent && parent !== rootTrigger.label) {
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
		handleTouchEvents(element),
		handleMouseEvents(element),
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

export { triggersRoot } from "./clickable.js";
