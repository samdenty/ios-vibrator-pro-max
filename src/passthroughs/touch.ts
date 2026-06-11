import { clickableTriggers } from "./clickable.js";

export function handleTouchEvents(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	if (!trigger) {
		return;
	}

	function mapTouches(touches: TouchList) {
		return [...touches].map((touch) => {
			return new Touch({
				altitudeAngle: (touch as any).altitudeAngle,
				azimuthAngle: (touch as any).azimuthAngle,
				clientX: touch.clientX,
				clientY: touch.clientY,
				force: touch.force,
				identifier: touch.identifier,
				pageX: touch.pageX,
				pageY: touch.pageY,
				radiusX: touch.radiusX,
				radiusY: touch.radiusY,
				rotationAngle: touch.rotationAngle,
				screenX: touch.screenX,
				screenY: touch.screenY,
				target: element,
				touchType: (touch as any).touchType,
			});
		});
	}

	const onTouchEvent = (event: TouchEvent) => {
		const forwardedEvent = new TouchEvent(event.type, {
			bubbles: true,
			altKey: event.altKey,
			cancelable: event.cancelable,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			shiftKey: event.shiftKey,
			touches: mapTouches(event.touches),
			changedTouches: mapTouches(event.changedTouches),
			targetTouches: mapTouches(event.targetTouches),
			view: event.view,
			detail: event.detail,
			which: event.which,
			composed: event.composed,
		});

		element.dispatchEvent(forwardedEvent);
	};

	trigger.label.addEventListener("touchstart", onTouchEvent, true);
	trigger.label.addEventListener("touchmove", onTouchEvent, true);
	trigger.label.addEventListener("touchend", onTouchEvent, true);
	trigger.label.addEventListener("touchcancel", onTouchEvent, true);

	return () => {
		trigger.label.removeEventListener("touchstart", onTouchEvent, true);
		trigger.label.removeEventListener("touchmove", onTouchEvent, true);
		trigger.label.removeEventListener("touchend", onTouchEvent, true);
		trigger.label.removeEventListener("touchcancel", onTouchEvent, true);
	};
}
