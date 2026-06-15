"use client";

import "ios-vibrator-pro-max/src";
import { ElasticSlider } from "@/components/elastic-slider";
import IOSSlider from "@/components/ios-slider";
import { ShimmeringText } from "@/components/shimmering-text";
import {
	SlideToUnlock,
	SlideToUnlockHandle,
	SlideToUnlockText,
	SlideToUnlockTrack,
} from "@/components/slide-to-unlock";
import { TimePicker } from "@/components/time-picker";
import { useState } from "react";
import { useSound } from "use-sound";

export default function Home() {
	const [value, setValue] = useState(0.5);
	const [play] = useSound("/unlock.mp3", {
		volume: 0.5,
	});

	return (
		<main id="sandbox">
			<IOSSlider />
			<ElasticSlider
				label="Opacity"
				min={0}
				max={1}
				step={0.1}
				value={value}
				onValueChange={setValue}
				className="w-full"
			/>
			<SlideToUnlock
				onUnlock={() => {
					play();
				}}
			>
				<SlideToUnlockTrack>
					<SlideToUnlockText>
						{({ isDragging }) => (
							<ShimmeringText text="slide to unlock" isStopped={isDragging} />
						)}
					</SlideToUnlockText>
					<SlideToUnlockHandle />
				</SlideToUnlockTrack>
			</SlideToUnlock>
			<TimePicker />
		</main>
	);
}
