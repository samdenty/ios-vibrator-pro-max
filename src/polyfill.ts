// Sorry Tim Cook, PWAs deserve some love too...

import {
	handleAddElement,
	handleRemoveElement,
	triggersRoot,
	authorizeVibrations,
	setBackgroundVibration,
} from "./methods";
import { asyncWait, polyfillKind } from "./utils";
import { rootTrigger, setVibration, ignoredElements } from "./vibration";

function polyfill(rawPatterns: Iterable<number> | VibratePattern): boolean {
	const patterns =
		typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

	if (
		!patterns.length ||
		patterns.some((pattern) => typeof pattern !== "number")
	) {
		return false;
	}

	setVibration(patterns);
	setBackgroundVibration(patterns);

	return true;
}

let style: HTMLStyleElement | null = null;

if (rootTrigger) {
	style = document.createElement("style");

	// Setup trigger elements
	rootTrigger.label.htmlFor = "ios-vibrator-pro-max";

	style.textContent = `
  label[for="ios-vibrator-pro-max"] > * {
    -webkit-tap-highlight-color: initial !important;
  }
`;

	triggersRoot.appendChild(rootTrigger.input);

	rootTrigger.input.id = "ios-vibrator-pro-max";
	rootTrigger.input.name = "ios-vibrator-pro-max";
}

async function initPolyfill() {
	window.addEventListener("click", authorizeVibrations);
	window.addEventListener("touchend", authorizeVibrations);
	window.addEventListener("keyup", authorizeVibrations);
	window.addEventListener("keypress", authorizeVibrations);

	await asyncWait(250);

	if (!rootTrigger || !style) {
		return;
	}

	document.head.appendChild(style);
	document.body.prepend(rootTrigger.label);
	document.body.appendChild(triggersRoot);

	for (const attribute of document.body.attributes) {
		rootTrigger.label.setAttribute(attribute.name, attribute.value);
	}

	const body = document.body;

	let raf: number | null = null;
	let ignoreMutation = false;

	const updateBodyStyles = () => {
		raf = null;
		ignoreMutation = true;

		if (rootTrigger!.label.className !== body.className) {
			rootTrigger!.label.className = body.className;
		}

		body.removeAttribute("style");

		const bodyStyles = getComputedStyle(body);
		const rootTriggerStyles = getComputedStyle(rootTrigger!.label);

		rootTrigger!.label.setAttribute(
			"style",
			[
				"position: fixed",
				"inset: 0",
				"-webkit-tap-highlight-color: transparent",
			].join("; "),
		);

		for (const style of bodyStyles) {
			if (
				rootTriggerStyles.getPropertyValue(style) ===
				bodyStyles.getPropertyValue(style)
			) {
				continue;
			}
			rootTrigger!.label.style.setProperty(
				style,
				bodyStyles.getPropertyValue(style),
			);
		}

		document.documentElement.style.setProperty(
			"background",
			bodyStyles.background,
		);

		body.setAttribute(
			"style",
			"all: unset !important; display: contents !important",
		);

		setTimeout(() => {
			ignoreMutation = false;
		});
	};

	updateBodyStyles();

	for (const child of [...document.body.childNodes]) {
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
					rootTrigger!.label.appendChild(node);
				}
			}
		}
	});

	reparentObserver.observe(body, { childList: true });

	const observer = new MutationObserver((mutations) => {
		if (ignoreMutation) {
			return;
		}

		raf ??= requestAnimationFrame(updateBodyStyles);

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

	Object.defineProperty(document, "body", {
		get() {
			return rootTrigger!.label;
		},
	});
}

if (polyfillKind) {
	navigator.vibrate = polyfill;

	if (document.readyState === "complete") {
		initPolyfill();
	} else {
		window.addEventListener("load", () => {
			initPolyfill();
		});
	}
}
