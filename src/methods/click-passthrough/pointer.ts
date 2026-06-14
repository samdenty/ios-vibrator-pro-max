import { clickableTriggers } from "./clickable";

export function clonePointerEvent(
	type: MouseEvent["type"],
	event: Partial<MouseEvent>,
) {
	return new PointerEvent(type, {
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

export function preventForwardingOfNextPointerEvent() {
	ignoreNextEvent = true;
}

export function handlePointerEvents(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	if (!trigger) {
		return;
	}

	const onPointerEvent = (event: MouseEvent) => {
		console.log("onPointerEvent", event.type);
		if (ignoreNextEvent) {
			ignoreNextEvent = false;
			return;
		}

		const forwardedEvent = clonePointerEvent(event.type, event);

		element.dispatchEvent(forwardedEvent);
	};

	trigger.label.addEventListener("mousemove", onPointerEvent, true);
	trigger.label.addEventListener("mouseup", onPointerEvent, true);
	trigger.label.addEventListener("mousedown", onPointerEvent, true);
	trigger.label.addEventListener("pointerdown", onPointerEvent, true);
	trigger.label.addEventListener("pointermove", onPointerEvent, true);
	trigger.label.addEventListener("pointerup", onPointerEvent, true);
	trigger.label.addEventListener("pointercancel", onPointerEvent, true);

	return () => {
		trigger.label.removeEventListener("mousemove", onPointerEvent);
		trigger.label.removeEventListener("mouseup", onPointerEvent);
		trigger.label.removeEventListener("mousedown", onPointerEvent);
	};
}
