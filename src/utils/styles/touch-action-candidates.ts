/**
 * `touch-action` values that indicate an element handles its own dragging
 * (so the browser shouldn't pan/scroll on that axis). These are the ones that
 * are relevant for "movable" widgets (custom sliders, drag handles, etc.).
 *
 * `auto`, `manipulation` and `pinch-zoom` still allow panning, so they don't
 * count as movable.
 */
const MOVABLE_TOUCH_ACTION = /\bnone\b|\bpan-/;

export function isMovableTouchAction(
	value: string | null | undefined,
): boolean {
	return !!value && MOVABLE_TOUCH_ACTION.test(value);
}

/**
 * Selectors (extracted from stylesheets) whose rules declare a movable
 * `touch-action`. Cached so we only re-parse stylesheets when they change,
 * which keeps reconciliation cheap on large documents.
 */
let cachedSelectors: string[] = [];
let stylesheetsDirty = true;

function collectSelectors(): string[] {
	if (!stylesheetsDirty) {
		return cachedSelectors;
	}

	stylesheetsDirty = false;

	const selectors = new Set<string>();

	const walk = (rules: CSSRuleList) => {
		for (const rule of rules) {
			const styleRule = rule as CSSStyleRule;

			if (
				styleRule.selectorText &&
				styleRule.style &&
				// `&`-prefixed nested selectors can't be queried standalone.
				!styleRule.selectorText.includes("&") &&
				isMovableTouchAction(styleRule.style.getPropertyValue("touch-action"))
			) {
				selectors.add(styleRule.selectorText);
			}

			// Recurse into grouping rules (@media, @supports) and CSS nesting.
			const nested = (rule as CSSGroupingRule).cssRules;
			if (nested) {
				walk(nested);
			}
		}
	};

	for (const sheet of document.styleSheets) {
		try {
			const rules = sheet.cssRules;
			if (rules) {
				walk(rules);
			}
		} catch {
			// Cross-origin stylesheets throw on access; skip them.
		}
	}

	cachedSelectors = [...selectors];

	return cachedSelectors;
}

let candidates: Set<HTMLElement> | null = null;

/**
 * Find every element that *might* have a movable `touch-action`, by matching
 * the selectors collected from stylesheets plus anything with an inline
 * `touch-action`. The result is a small superset that we then confirm against
 * the computed style, so we never have to call `getComputedStyle` on the whole
 * document.
 */
export function getTouchActionCandidates(): Set<HTMLElement> {
	if (candidates) {
		return candidates;
	}

	candidates = new Set<HTMLElement>();

	for (const selector of collectSelectors()) {
		try {
			for (const element of document.querySelectorAll<HTMLElement>(selector)) {
				candidates.add(element);
			}
		} catch {
			// Selector not queryable (e.g. contains a pseudo-element); skip it.
		}
	}

	for (const element of document.querySelectorAll<HTMLElement>(
		'[style*="touch-action"]',
	)) {
		candidates.add(element);
	}

	requestAnimationFrame(() => {
		candidates = null;
	});

	return candidates;
}

export function markStylesheetsDirty() {
	stylesheetsDirty = true;
	candidates = null;
}
