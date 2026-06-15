"use client";

import "ios-vibrator-pro-max/src";
import { enableDebugMode } from "ios-vibrator-pro-max/src";
import { CodeBlock } from "@/components/code-block";
import { ElasticSlider } from "@/components/elastic-slider";
import IOSSlider from "@/components/ios-slider";
import { ShimmeringText } from "@/components/shimmering-text";
import { SiteNav } from "@/components/site-nav";
import {
	SlideToUnlock,
	SlideToUnlockHandle,
	SlideToUnlockText,
	SlideToUnlockTrack,
} from "@/components/slide-to-unlock";
import { TimePicker } from "@/components/time-picker";
import { useState } from "react";
import { useSound } from "use-sound";

enableDebugMode();

const BADGES = [
	{
		href: "https://www.npmjs.com/package/ios-vibrator-pro-max",
		src: "https://www.shieldcn.dev/npm/dm/ios-vibrator-pro-max.svg?variant=branded&size=sm",
		alt: "npm downloads",
	},
	{
		href: "https://www.npmjs.com/package/ios-vibrator-pro-max",
		src: "https://www.shieldcn.dev/npm/dw/ios-vibrator-pro-max.svg?variant=secondary&size=sm",
		alt: "Total npm downloads",
	},
	{
		href: "https://x.com/samdenty",
		src: "https://www.shieldcn.dev/x/follow/samdenty.svg?variant=branded&size=sm",
		alt: "@samdenty on X",
	},
];

const USAGE_CODE = `import "ios-vibrator-pro-max";

<button
  onClick={() => {
    navigator.vibrate(200);
  }}
/>

<input
  type="range"
  onTouchMove={() => {
    navigator.vibrate(50);
  }}
/>
`;

export default function Home() {
	const [value, setValue] = useState(0.5);
	const [play] = useSound("/unlock.mp3", { volume: 0.5 });

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-[#070807] text-white">
			{/* Ambient background glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
				<div className="absolute top-1/3 -left-40 size-120 rounded-full bg-amber-400/5 blur-[120px]" />
			</div>

			<SiteNav />

			<main className="relative mx-auto max-w-5xl px-5 pb-32">
				{/* Hero */}
				<section className="flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
					<h1 className="bg-linear-to-b from-white to-white/50 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
						ios-vibrator
						<span className="bg-linear-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
							-pro-max
						</span>
					</h1>

					<p className="mt-6 max-w-2xl text-balance text-lg text-white/60">
						iOS Safari implementation of{" "}
						<code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-base text-amber-200">
							navigator.vibrate
						</code>{" "}
						— Works inside{" "}
						<code className="font-mono text-white/80">onTouchMove</code>,{" "}
						<code className="font-mono text-white/80">onClick</code> and{" "}
						<code className="font-mono text-white/80">onTouchStart</code>.
					</p>

					<div className="mt-8 flex flex-wrap items-center justify-center gap-2">
						{BADGES.map((badge) => (
							<a
								key={badge.alt}
								href={badge.href}
								target="_blank"
								rel="noreferrer"
								className="transition-opacity hover:opacity-80"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={badge.src} alt={badge.alt} className="h-7" />
							</a>
						))}
					</div>
				</section>

				{/* Usage */}
				<section className="py-12 flex flex-col gap-6">
					<CodeBlock code={USAGE_CODE} language="tsx" wrap />
					<div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-white/10 bg-black/30 p-6">
						<button
							type="button"
							onClick={() => navigator.vibrate(200)}
							className="rounded-xl bg-linear-to-b from-amber-300 to-orange-500 px-6 py-3 font-semibold text-black shadow-lg shadow-orange-500/25 transition-transform active:scale-95"
						>
							Vibrate
						</button>
						<input
							type="range"
							defaultValue={50}
							onTouchMove={() => navigator.vibrate(50)}
							onInput={() => navigator.vibrate(50)}
							className="ios-range w-full max-w-xs"
						/>
					</div>
				</section>

				{/* Playground */}
				<section className="py-12">
					<div className="mb-10 text-center">
						<h2 className="text-3xl font-bold tracking-tight">Playground</h2>
						<p className="mt-2 text-white/50">
							Real iOS-style components, all wired up to the haptics polyfill.
						</p>
					</div>

					<div className="flex flex-col items-center gap-12 rounded-3xl border border-white/10 bg-white/2 px-6 py-16 backdrop-blur">
						<IOSSlider />
						<ElasticSlider
							label="Opacity"
							min={0}
							max={1}
							step={0.1}
							value={value}
							onValueChange={setValue}
							className="w-full max-w-md"
						/>
						<SlideToUnlock onUnlock={() => play()}>
							<SlideToUnlockTrack>
								<SlideToUnlockText>
									{({ isDragging }) => (
										<ShimmeringText
											text="slide to unlock"
											isStopped={isDragging}
										/>
									)}
								</SlideToUnlockText>
								<SlideToUnlockHandle />
							</SlideToUnlockTrack>
						</SlideToUnlock>
						<TimePicker />
					</div>
				</section>
			</main>

			<footer className="relative border-t border-white/5 py-10 text-center text-sm text-white/40">
				Built by{" "}
				<a
					href="https://x.com/samdenty"
					target="_blank"
					rel="noreferrer"
					className="text-white/70 underline-offset-4 hover:underline"
				>
					@samdenty
				</a>{" "}
				· MIT Licensed
			</footer>
		</div>
	);
}
