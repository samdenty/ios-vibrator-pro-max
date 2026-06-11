export function getSafariVersion() {
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

	return null;
}
