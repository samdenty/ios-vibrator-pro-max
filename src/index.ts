import "./polyfill";

export {
	enableDebugMode,
	enableBackgroundPopup,
	hasBackgroundPopup,
	enableMainThreadBlocking,
} from "./methods";

export { mergeVibrations, trimVibrations, polyfillKind } from "./utils";
