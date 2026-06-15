function getSafariVersion() {
	if (typeof navigator === "undefined") {
		return null;
	}

	const userAgent = navigator.userAgent;

	if (
		userAgent.indexOf("Safari") !== -1 &&
		userAgent.indexOf("Chrome") === -1
	) {
		const versionRegex = /Version\/(\d+(\.\d+)?)/;
		const match = userAgent.match(versionRegex);

		if (match?.[1]) {
			return Number.parseFloat(match[1]);
		}
	}

	if (userAgent.indexOf("iPhone OS")) {
		const versionRegex = /iPhone OS (\d+(_\d+)?)/;
		const match = userAgent.match(versionRegex);
		if (match?.[1]) {
			return Number.parseFloat(match[1].replace("_", "."));
		}
	}
	return null;
}

export const SAFARI_VERSION = getSafariVersion();

export const polyfillKind =
	SAFARI_VERSION && !navigator.vibrate
		? SAFARI_VERSION >= 18.4
			? "granted"
			: SAFARI_VERSION >= 18
				? "full"
				: null
		: null;
