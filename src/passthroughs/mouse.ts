import { clickableTriggers } from "./clickable.js";

export function cloneMouseEvent(
	type: MouseEvent["type"],
	event: Partial<MouseEvent>,
) {
	return new MouseEvent(type, {
		bubbles: true,
		altKey: event.altKey,
		cancelable: event.cancelable,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
		shiftKey: event.shiftKey,
		view: event.view,
		detail: event.detail,
		which: event.which,
		composed: event.composed,
		button: event.button,
		buttons: event.buttons,
		clientX: event.clientX,
		clientY: event.clientY,
		movementX: event.movementX,
		movementY: event.movementY,
		screenX: event.screenX,
		screenY: event.screenY,
	});
}

let ignoreNextEvent = false;

export function preventForwardingOfNextMouseEvent() {
	ignoreNextEvent = true;
}

export function handleMouseEvents(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	if (!trigger) {
		return;
	}

	const onMouseEvent = (event: MouseEvent) => {
		if (ignoreNextEvent) {
			ignoreNextEvent = false;
			return;
		}

		const forwardedEvent = cloneMouseEvent(event.type, event);

		element.dispatchEvent(forwardedEvent);
	};

	trigger.label.addEventListener("mousemove", onMouseEvent, true);
	trigger.label.addEventListener("mouseup", onMouseEvent, true);
	trigger.label.addEventListener("mousedown", onMouseEvent, true);

	return () => {
		trigger.label.removeEventListener("mousemove", onMouseEvent);
		trigger.label.removeEventListener("mouseup", onMouseEvent);
		trigger.label.removeEventListener("mousedown", onMouseEvent);
	};
}
