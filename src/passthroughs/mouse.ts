import { clickableTriggers } from "./clickable.js";

export function handleMouseEvents(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	if (!trigger) {
		return;
	}

	const onMouseEvent = (event: MouseEvent) => {
		const forwardedEvent = new MouseEvent(event.type, {
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

		element.dispatchEvent(forwardedEvent);
	};

	trigger.label.addEventListener("mousemove", onMouseEvent, true);
	trigger.label.addEventListener("mouseup", onMouseEvent, true);
	trigger.label.addEventListener("mousedown", onMouseEvent, true);

	return () => {
		trigger.label.removeEventListener("mousemove", onMouseEvent, true);
		trigger.label.removeEventListener("mouseup", onMouseEvent, true);
		trigger.label.removeEventListener("mousedown", onMouseEvent, true);
	};
}
