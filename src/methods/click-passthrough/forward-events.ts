import { clickableTriggers, triggersRoot } from "./clickable";
import { isInputRangeElement } from "./inputable";

export function clonePointerEvent(
	type: PointerEvent["type"],
	event: Partial<PointerEvent>,
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
		isPrimary: event.isPrimary,
		pointerId: event.pointerId,
		pointerType: event.pointerType,
		pressure: event.pressure,
		tangentialPressure: event.tangentialPressure,
		tiltX: event.tiltX,
		tiltY: event.tiltY,
		twist: event.twist,
		width: event.width,
		height: event.height,
		relatedTarget: event.relatedTarget,
	});
}

export function forwardEvents(element: HTMLElement) {
	const trigger = clickableTriggers.get(element);
	const isInputRange = isInputRangeElement(element);
	if (!trigger) {
		return;
	}

	let pointerTarget: HTMLElement | null = null;
	let touchTarget: HTMLElement | null = null;
	let mouseTarget: HTMLElement | null = null;

	const getTarget = (clientX?: number, clientY?: number) => {
		if (isInputRange || clientX == null || clientY == null) {
			return element;
		}

		triggersRoot.style.display = "none";
		const target = document.elementFromPoint(clientX, clientY) as HTMLElement;
		triggersRoot.style.display = "block";

		return target ?? element;
	};

	const onPointerEvent = (event: PointerEvent) => {
		pointerTarget ??= getTarget(event.clientX, event.clientY);

		const forwardedEvent = clonePointerEvent(event.type, event);
		pointerTarget.dispatchEvent(forwardedEvent);

		if (event.type === "pointerup" || event.type === "pointercancel") {
			pointerTarget = null;
		}
	};

	const onMouseEvent = (event: MouseEvent) => {
		mouseTarget ??= pointerTarget ?? getTarget(event.clientX, event.clientY);

		const forwardedEvent = clonePointerEvent(event.type, event);
		mouseTarget.dispatchEvent(forwardedEvent);

		if (event.type === "mouseup" || event.type === "mousecancel") {
			mouseTarget = null;
		}
	};

	const onTouchEvent = (event: TouchEvent) => {
		touchTarget ??=
			pointerTarget ??
			getTarget(
				event.targetTouches[0]?.clientX,
				event.targetTouches[0]?.clientY,
			);

		const forwardedEvent = new TouchEvent(event.type, {
			bubbles: true,
			altKey: event.altKey,
			cancelable: event.cancelable,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			shiftKey: event.shiftKey,
			touches: mapTouches(touchTarget, event.touches),
			changedTouches: mapTouches(touchTarget, event.changedTouches),
			targetTouches: mapTouches(touchTarget, event.targetTouches),
			view: event.view,
			detail: event.detail,
			which: event.which,
			composed: event.composed,
		});

		touchTarget.dispatchEvent(forwardedEvent);

		if (event.type === "touchend" || event.type === "touchcancel") {
			touchTarget = null;
		}
	};

	trigger.label.addEventListener("mousedown", onMouseEvent, true);
	trigger.label.addEventListener("mousemove", onMouseEvent, true);
	trigger.label.addEventListener("mouseup", onMouseEvent, true);

	trigger.label.addEventListener("pointerdown", onPointerEvent, true);
	trigger.label.addEventListener("pointermove", onPointerEvent, true);
	trigger.label.addEventListener("pointerup", onPointerEvent, true);
	trigger.label.addEventListener("pointercancel", onPointerEvent, true);

	trigger.label.addEventListener("touchstart", onTouchEvent, true);
	trigger.label.addEventListener("touchmove", onTouchEvent, true);
	trigger.label.addEventListener("touchend", onTouchEvent, true);
	trigger.label.addEventListener("touchcancel", onTouchEvent, true);

	return () => {
		trigger.label.removeEventListener("mousedown", onMouseEvent);
		trigger.label.removeEventListener("mousemove", onMouseEvent);
		trigger.label.removeEventListener("mouseup", onMouseEvent);

		trigger.label.removeEventListener("pointerdown", onPointerEvent);
		trigger.label.removeEventListener("pointermove", onPointerEvent);
		trigger.label.removeEventListener("pointerup", onPointerEvent);
		trigger.label.removeEventListener("pointercancel", onPointerEvent);

		trigger.label.removeEventListener("touchstart", onTouchEvent);
		trigger.label.removeEventListener("touchmove", onTouchEvent);
		trigger.label.removeEventListener("touchend", onTouchEvent);
		trigger.label.removeEventListener("touchcancel", onTouchEvent);
	};
}

function mapTouches(element: HTMLElement, touches: TouchList) {
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
