// Sorry Tim Cook, PWAs deserve some love too...

import {
	handleAddElement,
	handleRemoveElement,
	rootBody,
	triggersRoot,
} from "./passthroughs/index.js";
import { getSafariVersion } from "./utils/safari-version.js";
import { registerStyleUpdater } from "./utils/styles/update-styles.js";
import { trigger, vibrate, ignoredElements } from "./vibration.js";

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

const SAFARI_VERSION = getSafariVersion();

const shouldPolyfill = SAFARI_VERSION && !navigator.vibrate;
const style = document.createElement("style");

// Setup trigger elements
trigger.label.htmlFor = "ios-vibrator-pro-max";

const triggerStyles = [
	"all: unset",
	"-webkit-tap-highlight-color: transparent",
	"position: fixed",
	"inset: 0",
];

registerStyleUpdater(trigger.label, () => {
	const styles = getComputedStyle(document.body);

	return [
		...triggerStyles,
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

trigger.input.id = "ios-vibrator-pro-max";
trigger.input.name = "ios-vibrator-pro-max";

function initPolyfill() {
	document.head.appendChild(style);
	document.body.appendChild(rootBody);
	document.body.appendChild(triggersRoot);

	for (const child of document.body.childNodes) {
		if (ignoredElements.has(child as HTMLElement)) {
			continue;
		}

		rootBody.appendChild(child);

		if (child.nodeType === Node.ELEMENT_NODE) {
			handleAddElement(child as HTMLElement, []);
		}
	}

	const reparentObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!ignoredElements.has(node as HTMLElement)) {
					rootBody.appendChild(node);
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

	observer.observe(rootBody, {
		childList: true,
		subtree: true,
		attributes: true,
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
