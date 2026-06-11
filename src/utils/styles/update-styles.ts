const elementCallbacks = new Map<HTMLElement, Set<() => string[]>>();

let pendingUpdate = false;

function applyStyles(
	element: HTMLElement,
	callbacks: Iterable<() => string[]>,
) {
	let mergedStyles = [];

	for (const callback of callbacks) {
		const styles = callback();
		if (styles.includes("all: unset") || styles.includes("all: revert")) {
			mergedStyles = [];
		}
		mergedStyles.push(...styles);
	}

	element.setAttribute(
		"style",
		mergedStyles.map((style) => `${style} !important`).join("; "),
	);
}

function updateStyles() {
	pendingUpdate = false;

	for (const [element, callbacks] of elementCallbacks) {
		applyStyles(element, callbacks);
	}
}

setInterval(updateStyles, 500);

export function registerStyleUpdater(
	element: HTMLElement,
	callback: () => string[],
) {
	let callbacks = elementCallbacks.get(element);
	if (!callbacks) {
		callbacks = new Set();
		elementCallbacks.set(element, callbacks);
	}

	callbacks.add(callback);

	if (!pendingUpdate) {
		requestAnimationFrame(updateStyles);
	}

	pendingUpdate = true;

	return [
		() => {
			applyStyles(element, callbacks);
		},
		() => {
			callbacks.delete(callback);

			if (callbacks.size === 0) {
				elementCallbacks.delete(element);
			}
		},
	];
}
