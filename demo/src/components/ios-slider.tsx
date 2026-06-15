"use client";

import { useEffect, useRef, useState } from "react";
import {
	animate,
	clamp,
	mix,
	motion,
	progress,
	useMotionValue,
	useMotionValueEvent,
	useTransform,
} from "motion/react";

const containerStyle: React.CSSProperties = {
	width: 400,
	height: 300,
	overflow: "hidden",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backdropFilter: "blur(2px)",
	touchAction: "none",
};

const trackStyle: React.CSSProperties = {
	width: 100,
	height: 225,
	backgroundColor: "rgba(255, 255, 255, 0.1)",
	borderRadius: 45,
	overflow: "hidden",
	position: "relative",
	display: "flex",
	alignItems: "flex-end",
	justifyContent: "center",
	touchAction: "none",
	outline: "none",
	userSelect: "none",
	WebkitUserSelect: "none",
	WebkitTouchCallout: "none",
};

const fillStyle: React.CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
	backgroundColor: "var(--white)",
	pointerEvents: "none",
};

const sunIconStyle: React.CSSProperties = {
	position: "relative",
	zIndex: 1,
	bottom: 20,
	pointerEvents: "none",
};

function inverseScale(value: number) {
	return 1 / value;
}

function SunIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			style={sunIconStyle}
			aria-hidden
		>
			<title>Brightness icon</title>
			<circle cx="12" cy="12" r="4" stroke="currentColor" fill="currentColor" />
			<path d="M12 3v1" />
			<path d="M12 20v1" />
			<path d="M3 12h1" />
			<path d="M20 12h1" />
			<path d="m18.364 5.636-.707.707" />
			<path d="m6.343 17.657-.707.707" />
			<path d="m5.636 5.636.707.707" />
			<path d="m17.657 17.657.707.707" />
		</svg>
	);
}

interface IOSSliderProps {
	maxPull?: number;
	maxSquish?: number;
	maxStretch?: number;
	keyboardStep?: number;
	keyboardSpring?: { stiffness: number; damping: number };
}

export default function IOSSlider({
	maxPull = 20,
	maxSquish = 0.92,
	maxStretch = 1.08,
	keyboardStep = 0.05,
	keyboardSpring = { stiffness: 200, damping: 60 },
}: IOSSliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const startClientY = useRef(0);
	const startPointerY = useRef(0);
	const bounds = useRef({ top: 0, bottom: 0 });
	const isDragging = useRef(false);
	const activePointerId = useRef<number | null>(null);

	const value = useMotionValue(0.5);
	const fillScaleY = useTransform(() => clamp(0, 1, value.get()));
	const pullY = useTransform(value, [-1, 0, 1, 2], [maxPull, 0, 0, -maxPull]);
	const { scaleX, scaleY } = useTransform(pullY, [-maxPull, 0, 0, maxPull], {
		scaleX: [maxSquish, 1, 1, maxSquish],
		scaleY: [maxStretch, 1, 1, maxStretch],
	});
	const iconScaleX = useTransform(() => inverseScale(scaleX.get()));
	const iconScaleY = useTransform(() => inverseScale(scaleY.get()));

	const iconColor = useTransform(
		value,
		[0, 0.1, 0.14, 1],
		["#ffffff", "#f6ce46", "#f6ce46", "#f6ce46"],
	);

	const [ariaValue, setAriaValue] = useState(50);
	useMotionValueEvent(value, "change", (latest) => {
		setAriaValue(Math.round(clamp(0, 1, latest) * 100));
	});

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
			return;
		}

		event.preventDefault();

		let current = clamp(0, 1, value.get());
		if (current <= 0.04) current = 0;
		if (current >= 0.96) current = 1;

		const next =
			current + (event.key === "ArrowUp" ? keyboardStep : -keyboardStep);

		if (next > 1) {
			animate(value, 1, { velocity: 20, type: "spring", ...keyboardSpring });
		} else if (next < 0) {
			animate(value, 0, { velocity: -20, type: "spring", ...keyboardSpring });
		} else {
			value.jump(clamp(0, 1, next));
		}
	};

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;

		let vibrating = false;

		const supportsPointer = "PointerEvent" in window;

		const beginDrag = (clientY: number) => {
			const { top, bottom } = track.getBoundingClientRect();
			bounds.current = { top, bottom };
			startClientY.current = clientY;
			startPointerY.current = mix(bottom, top, value.get());
			isDragging.current = true;
		};

		const drag = (clientY: number) => {
			if (!isDragging.current) return;

			const offset = clientY - startClientY.current;
			const { top, bottom } = bounds.current;

			value.set(progress(bottom, top, startPointerY.current + offset));

			const clamped = Math.min(Math.max(value.get(), 0), 1);

			if (clamped === 0 || clamped === 1) {
				if (!vibrating) {
					navigator.vibrate(50);
				}

				vibrating = true;
			} else {
				vibrating = false;
			}
		};

		const endDrag = () => {
			if (!isDragging.current) return;

			isDragging.current = false;
			activePointerId.current = null;

			const current = value.get();
			if (current < 0) animate(value, 0);
			if (current > 1) animate(value, 1);
		};

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;

			activePointerId.current = event.pointerId;
			track.setPointerCapture(event.pointerId);
			beginDrag(event.clientY);
		};

		const onPointerMove = (event: PointerEvent) => {
			if (activePointerId.current !== event.pointerId) return;

			event.preventDefault();
			drag(event.clientY);
		};

		const onPointerEnd = (event: PointerEvent) => {
			if (activePointerId.current !== event.pointerId) return;

			if (track.hasPointerCapture(event.pointerId)) {
				track.releasePointerCapture(event.pointerId);
			}

			endDrag();
		};

		const onTouchStart = (event: TouchEvent) => {
			if (supportsPointer || event.touches.length !== 1) return;

			beginDrag(event.touches[0].clientY);
		};

		const onTouchMove = (event: TouchEvent) => {
			if (supportsPointer || event.touches.length !== 1) return;

			event.preventDefault();
			drag(event.touches[0].clientY);
		};

		const onTouchEnd = () => {
			if (supportsPointer) return;

			endDrag();
		};

		track.addEventListener("pointerdown", onPointerDown);
		track.addEventListener("pointermove", onPointerMove);
		track.addEventListener("pointerup", onPointerEnd);
		track.addEventListener("pointercancel", onPointerEnd);
		track.addEventListener("touchstart", onTouchStart, { passive: true });
		track.addEventListener("touchmove", onTouchMove, { passive: false });
		track.addEventListener("touchend", onTouchEnd);
		track.addEventListener("touchcancel", onTouchEnd);

		return () => {
			track.removeEventListener("pointerdown", onPointerDown);
			track.removeEventListener("pointermove", onPointerMove);
			track.removeEventListener("pointerup", onPointerEnd);
			track.removeEventListener("pointercancel", onPointerEnd);
			track.removeEventListener("touchstart", onTouchStart);
			track.removeEventListener("touchmove", onTouchMove);
			track.removeEventListener("touchend", onTouchEnd);
			track.removeEventListener("touchcancel", onTouchEnd);
		};
	}, [value]);

	return (
		<div style={containerStyle}>
			<motion.div
				ref={trackRef}
				role="slider"
				aria-label="Brightness"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={ariaValue}
				tabIndex={0}
				style={{ ...trackStyle, y: pullY, scaleX, scaleY }}
				onFocus={() => document.addEventListener("keydown", onKeyDown)}
				onBlur={() => document.removeEventListener("keydown", onKeyDown)}
				transition={{ duration: 0.15 }}
				initial={{ boxShadow: "0px 0px 0px 4px #0d63f800" }}
				whileFocus={{ boxShadow: "0px 0px 0px 4px #0d63f8ff" }}
			>
				<motion.div style={{ ...fillStyle, originY: 1, scaleY: fillScaleY }} />
				<motion.div
					style={{ scaleX: iconScaleX, scaleY: iconScaleY, color: iconColor }}
				>
					<SunIcon />
				</motion.div>
			</motion.div>
		</div>
	);
}
