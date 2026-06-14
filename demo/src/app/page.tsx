"use client";

import { ElasticSlider } from "@/components/elastic-slider";
import IOSSlider from "@/components/IOSSlider";
import { useState } from "react";
import { enableDebugMode } from "ios-vibrator-pro-max/src";

enableDebugMode();

export default function Home() {
	const [value, setValue] = useState(0.1);

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
		</main>
	);
}
