// Sorry Tim Cook, PWAs deserve some love too...

import { polyfillKind, uuid } from "./options.js";
import {
	handleAddElement,
	handleRemoveElement,
	triggersRoot,
} from "./passthroughs/index.js";
import { registerStyleUpdater } from "./utils/index.js";
import {
	rootTrigger,
	vibrate,
	ignoredElements,
	authorizeVibrations,
} from "./vibration.js";

function polyfill(rawPatterns: Iterable<number> | VibratePattern): boolean {
	const patterns =
		typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

	if (
		!patterns.length ||
		patterns.some((pattern) => typeof pattern !== "number")
	) {
		return false;
	}

	vibrate(patterns);

	return true;
}

const shouldPolyfill = polyfillKind && !navigator.vibrate;
const style = document.createElement("style");

// Setup trigger elements
rootTrigger.label.htmlFor = "ios-vibrator-pro-max";

registerStyleUpdater(rootTrigger.label, () => {
	const styles = getComputedStyle(document.body);

	return [
		"all: unset",
		"-webkit-tap-highlight-color: transparent",
		"position: fixed",
		"inset: 0",
		"height: inherit",
		"width: inherit",
		`overflow: ${styles.overflow}`,
		`margin: ${styles.margin}`,
	];
});

style.textContent = `
  label[for="ios-vibrator-pro-max"] > * {
    -webkit-tap-highlight-color: initial !important;
  }
`;

rootTrigger.input.id = "ios-vibrator-pro-max";
rootTrigger.input.name = "ios-vibrator-pro-max";

function initPolyfill() {
	document.head.appendChild(style);
	document.body.appendChild(rootTrigger.label);
	document.body.appendChild(triggersRoot);

	for (const child of document.body.childNodes) {
		if (ignoredElements.has(child as HTMLElement)) {
			continue;
		}

		rootTrigger.label.appendChild(child);

		if (child.nodeType === Node.ELEMENT_NODE) {
			handleAddElement(child as HTMLElement, []);
		}
	}

	const reparentObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!ignoredElements.has(node as HTMLElement)) {
					rootTrigger.label.appendChild(node);
				}
			}
		}
	});

	reparentObserver.observe(document.body, { childList: true });

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					handleAddElement(node as HTMLElement);
				}
			}

			for (const node of mutation.removedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					handleRemoveElement(node as HTMLElement);
				}
			}
		}
	});

	observer.observe(rootTrigger.label, {
		childList: true,
		subtree: true,
		attributes: true,
	});

	// Add event listeners
	window.addEventListener("click", authorizeVibrations);
	window.addEventListener("touchend", authorizeVibrations);
	window.addEventListener("keyup", authorizeVibrations);
	window.addEventListener("keypress", authorizeVibrations);

	window.addEventListener("unload", () => {
		navigator.sendBeacon(
			`https://api.vibrator.dev/${uuid}`,
			JSON.stringify(null),
		);
	});
}

if (shouldPolyfill) {
	navigator.vibrate = polyfill;

	// Add trigger to document
	if (document.body) {
		initPolyfill();
	} else {
		setTimeout(() => {
			initPolyfill();
		}, 0);
	}
}
