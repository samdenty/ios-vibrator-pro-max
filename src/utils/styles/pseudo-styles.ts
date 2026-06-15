export function getPseudoStyles(
	element: HTMLElement,
	pseudoSelector: `::${string}`,
) {
	let width: number | null = null;
	let height: number | null = null;
	let borderRadius: string | null = null;

	// Fallbacks
	try {
		const styles = window.getComputedStyle(element, "::-webkit-slider-thumb");
		width = Number.parseFloat(styles.width);
		height = Number.parseFloat(styles.height) || width;
		borderRadius = styles.borderRadius;
	} catch (e) {}

	if (width && height) {
		return { width, height, borderRadius };
	}

	for (const sheet of document.styleSheets) {
		try {
			const rules = sheet.cssRules || sheet.rules;
			if (!rules) continue;

			for (const rule of rules) {
				if (rule.type !== 1) {
					continue;
				}

				const styleRule = rule as CSSStyleRule;

				const selectorText = styleRule.selectorText || "";

				if (!selectorText.includes(pseudoSelector)) {
					continue;
				}

				// Extract base selector (remove the pseudo-element part)
				const baseSelector = selectorText
					.replace(new RegExp(`::?${pseudoSelector.slice(2)}`), "")
					.trim();

				// Check if this rule applies to our specific rangeEl
				if (baseSelector && element.matches(baseSelector)) {
					const style = element.getAttribute("style");

					element.style.setProperty("width", styleRule.style.width);
					element.style.setProperty("height", styleRule.style.height);
					element.style.setProperty(
						"border-radius",
						styleRule.style.borderRadius,
					);

					const computedStyle = getComputedStyle(element);

					if (styleRule.style.width) {
						width = Number.parseFloat(computedStyle.getPropertyValue("width"));
					}

					if (styleRule.style.height) {
						height = Number.parseFloat(
							computedStyle.getPropertyValue("height"),
						);
					}

					if (styleRule.style.borderRadius) {
						borderRadius = computedStyle.getPropertyValue("border-radius");
					}

					if (style) {
						element.setAttribute("style", style);
					} else {
						element.removeAttribute("style");
					}
				}
			}
		} catch {}
	}

	if (!width) {
		width = 24;
	}

	if (!height) {
		height = 16;
	}

	if (!borderRadius) {
		borderRadius = "50%";
	}

	return { width, height, borderRadius };
}
