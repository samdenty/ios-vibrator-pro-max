import { triggersRoot } from "../../passthroughs/clickable.js";

let cached: DOMRect | null = null;

export function getDefaultSwitchDimensions() {
	if (!cached) {
		const input = document.createElement("input");
		input.type = "checkbox";
		input.setAttribute("switch", "");
		triggersRoot.appendChild(input);

		cached ??= input.getBoundingClientRect();

		input.remove();
	}

	return {
		width: cached.width,
		height: cached.height,
	};
}
