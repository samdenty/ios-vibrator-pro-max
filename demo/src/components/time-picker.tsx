"use client";

import {
	animate,
	motion,
	useMotionValue,
	useMotionValueEvent,
} from "motion/react";
import { useRef, useState } from "react";

const ITEM_HEIGHT = 52;
const UNIT_ANGLE = 20;
const UNIT_RAD = (UNIT_ANGLE * Math.PI) / 180;
const RADIUS = ITEM_HEIGHT / UNIT_RAD;
const VISIBLE_HALF = 4;
const HIDE_ANGLE = (89 * Math.PI) / 180;
const Y_MAX = RADIUS * Math.sin(VISIBLE_HALF * UNIT_RAD);
const EDGE_MARGIN = 34;
const WHEEL_HEIGHT = Math.round(2 * (Y_MAX + EDGE_MARGIN));
const PILL_HEIGHT = 58;
const WHITE_CLIP_HEIGHT = ITEM_HEIGHT;
const WHITE_CLIP_TOP = (WHEEL_HEIGHT - WHITE_CLIP_HEIGHT) / 2;
const WHITE_CLIP_BOTTOM = WHITE_CLIP_TOP + WHITE_CLIP_HEIGHT;
const SIDE_BEND = 14;

type TimeValue = {
	hours: number;
	minutes: number;
	seconds: number;
};

type TimePickerProps = {
	initialValue?: Partial<TimeValue>;
	onChange?: (value: TimeValue) => void;
};

const columns = [
	{
		key: "hours",
		unit: "hours",
		ariaLabel: "Hours",
		values: Array.from({ length: 24 }, (_, index) => index),
		bend: 1,
	},
	{
		key: "minutes",
		unit: "min",
		ariaLabel: "Minutes",
		values: Array.from({ length: 60 }, (_, index) => index),
		bend: 0,
	},
	{
		key: "seconds",
		unit: "sec",
		ariaLabel: "Seconds",
		values: Array.from({ length: 60 }, (_, index) => index),
		bend: -1,
	},
] as const;

function clampIndex(index: number, max: number) {
	return Math.min(Math.max(index, 0), max);
}

function getIndexFromY(y: number, max: number) {
	return clampIndex(Math.round(-y / ITEM_HEIGHT), max);
}

function WheelItems({
	values,
	scrollOffset,
	variant,
	bend,
}: {
	values: number[];
	scrollOffset: number;
	variant: "muted" | "white";
	bend: number;
}) {
	const center = -scrollOffset / ITEM_HEIGHT;

	return values.map((item, index) => {
		const offset = index - center;
		const angle = offset * UNIT_RAD;

		if (
			Math.abs(angle) >= HIDE_ANGLE ||
			Math.abs(offset) > VISIBLE_HALF + 0.5
		) {
			return null;
		}

		const cos = Math.cos(angle);
		const y = RADIUS * Math.sin(angle);
		const scaleY = Math.max(cos, 0.05);
		const scale = 0.62 + 0.38 * cos;
		const fade = Math.max(cos, 0) ** 0.7;
		const x = bend * SIDE_BEND * (1 - Math.max(cos, 0));

		return (
			<div
				key={item}
				className="absolute inset-x-0 flex items-center justify-end text-[34px] tracking-[-0.04em] will-change-transform"
				style={{
					top: "50%",
					height: ITEM_HEIGHT,
					marginTop: -ITEM_HEIGHT / 2,
					transform: `translate(${x}px, ${y}px) scaleY(${scaleY}) scale(${scale})`,
					transformOrigin: "center",
					color:
						variant === "white"
							? `rgba(255,255,255,${0.98 * fade})`
							: `rgba(255,255,255,${0.5 * fade})`,
					fontWeight: Math.abs(offset) < 0.5 ? 500 : 400,
				}}
			>
				<span className="tabular-nums">{item}</span>
			</div>
		);
	});
}

function WheelColumn({
	ariaLabel,
	value,
	values,
	unit,
	onChange,
	bend,
}: {
	ariaLabel: string;
	value: number;
	values: number[];
	unit: string;
	onChange: (value: number) => void;
	bend: number;
}) {
	const maxScroll = (values.length - 1) * ITEM_HEIGHT;
	const initialIndex = Math.max(values.indexOf(value), 0);
	const initialOffset = -initialIndex * ITEM_HEIGHT;
	const y = useMotionValue(initialOffset);
	const panStartY = useRef(initialOffset);
	const [scrollOffset, setScrollOffset] = useState(initialOffset);
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const lastIndex = useRef(initialIndex);

	const snapToIndex = (index: number) => {
		const nextIndex = clampIndex(index, values.length - 1);

		animate(y, -nextIndex * ITEM_HEIGHT, {
			type: "spring",
			stiffness: 440,
			damping: 44,
			mass: 0.85,
		});
	};

	const snapTarget = (target: number) => {
		const snapped = Math.round(target / ITEM_HEIGHT) * ITEM_HEIGHT;
		return Math.min(0, Math.max(-maxScroll, snapped));
	};

	const elasticScroll = (value: number) => {
		if (value > 0) return value * 0.15;
		if (value < -maxScroll) return -maxScroll + (value + maxScroll) * 0.15;
		return value;
	};

	useMotionValueEvent(y, "change", (latest) => {
		setScrollOffset(latest);

		const index = getIndexFromY(latest, values.length - 1);
		if (index === lastIndex.current) {
			return;
		}

		lastIndex.current = index;
		setSelectedIndex(index);
		navigator.vibrate?.(40);
		onChange(values[index]);
	});

	return (
		<div
			className="relative flex h-full min-w-0 flex-1 cursor-grab touch-none select-none items-center justify-center gap-2 outline-none focus:outline-none focus-visible:outline-none active:cursor-grabbing"
			role="slider"
			aria-label={ariaLabel}
			aria-valuemin={values[0]}
			aria-valuemax={values[values.length - 1]}
			aria-valuenow={values[selectedIndex]}
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === "ArrowUp") {
					event.preventDefault();
					snapToIndex(selectedIndex - 1);
				}

				if (event.key === "ArrowDown") {
					event.preventDefault();
					snapToIndex(selectedIndex + 1);
				}
			}}
		>
			<div className="relative h-full w-14.5">
				<div className="pointer-events-none absolute inset-0">
					<WheelItems
						bend={bend}
						scrollOffset={scrollOffset}
						values={values}
						variant="muted"
					/>
				</div>
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						clipPath: `inset(${WHITE_CLIP_TOP}px 0 ${WHEEL_HEIGHT - WHITE_CLIP_BOTTOM}px 0)`,
					}}
				>
					<WheelItems
						bend={bend}
						scrollOffset={scrollOffset}
						values={values}
						variant="white"
					/>
				</div>
			</div>
			<span className="pointer-events-none shrink-0 text-[22px] font-medium tracking-tight text-white/98">
				{unit}
			</span>
			<motion.div
				className="absolute inset-0 z-10 touch-none"
				onPanStart={() => {
					y.stop();
					panStartY.current = y.get();
				}}
				onPan={(_, info) => {
					y.set(elasticScroll(panStartY.current + info.offset.y));
				}}
				onPanEnd={(_, info) => {
					const projected = y.get() + info.velocity.y * 0.22;
					animate(y, snapTarget(projected), {
						type: "spring",
						velocity: info.velocity.y,
						stiffness: 320,
						damping: 34,
						mass: 0.85,
					});
				}}
			/>
		</div>
	);
}

export function TimePicker({ initialValue, onChange }: TimePickerProps) {
	const [time, setTime] = useState<TimeValue>({
		hours: initialValue?.hours ?? 0,
		minutes: initialValue?.minutes ?? 0,
		seconds: initialValue?.seconds ?? 0,
	});

	const update = (key: keyof TimeValue, value: number) => {
		setTime((current) => {
			const next = { ...current, [key]: value };
			onChange?.(next);
			return next;
		});
	};

	return (
		<div
			className="relative mx-auto flex w-[min(92vw,550px)] items-center justify-center overflow-hidden rounded-[34px]"
			style={{ height: WHEEL_HEIGHT }}
		>
			<div
				className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 -translate-y-1/2 rounded-[31px] bg-[#171719]"
				style={{ height: PILL_HEIGHT }}
			/>
			<div
				className="pointer-events-none absolute inset-0 z-20"
				style={{
					background:
						"linear-gradient(to bottom, #000 0%, rgba(0,0,0,0) 7%, rgba(0,0,0,0) 93%, #000 100%)",
				}}
			/>
			<div className="relative z-10 flex h-full w-full items-center justify-between px-2">
				{columns.map((column) => (
					<WheelColumn
						ariaLabel={column.ariaLabel}
						key={column.key}
						onChange={(next) => update(column.key, next)}
						unit={column.unit}
						value={time[column.key]}
						values={[...column.values]}
						bend={column.bend}
					/>
				))}
			</div>
		</div>
	);
}
