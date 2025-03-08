// Sorry Tim Cook, PWAs deserve some love too...

import { trimVibrations, type Vibration } from "./mergeVibrations.js";

const SAFARI_VERSION = getSafariVersion();
const MAGIC_NUMBER = 26.26;
const GRANT_TIMEOUT = 1000;

const polyfillKind =
  !navigator.vibrate && SAFARI_VERSION
    ? SAFARI_VERSION >= 18.4
      ? "granted"
      : SAFARI_VERSION >= 18
      ? "full"
      : null
    : null;

let trigger: HTMLLabelElement;
let timer: any;
let lastGrant: number | null = null;
let vibration: Vibration = [Date.now(), []];
let blockMainThread = false;

export function enableMainThreadBlocking(enabled: boolean) {
  blockMainThread = enabled;
}

function teachSafariHowToVibe(
  rawPatterns: Iterable<number> | VibratePattern
): boolean {
  const patterns =
    typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

  if (
    !patterns.length ||
    patterns.some((pattern) => typeof pattern !== "number")
  ) {
    return false;
  }

  vibration = [Date.now(), patterns];

  return true;
}

async function grantedVibrate() {
  lastGrant = Date.now();

  let adjustment = 0;

  while (true) {
    vibration = [
      Date.now(),
      trimVibrations(Date.now() - vibration[0], vibration[1]),
    ];

    const [vibrateMs, waitMs] = vibration[1] as (number | undefined)[];

    if (vibrateMs == null) {
      if (!getTimeUntilGrantExpires()) {
        return;
      }

      await asyncWait(1);

      continue;
    }

    const vibrate = vibrateMs > 0;
    const waitTime = (vibrate ? MAGIC_NUMBER : waitMs ?? 0) + adjustment;

    if (vibrate) {
      trigger.click();
    }

    adjustment = await wait(waitTime);
  }
}

function getTimeUntilGrantExpires(): number {
  if (polyfillKind === "full") {
    return Infinity;
  }

  if (!lastGrant) {
    return 0;
  }

  return Math.max(0, GRANT_TIMEOUT - (Date.now() - lastGrant));
}

async function wait(duration: number) {
  const timeUntilGrantExpires = getTimeUntilGrantExpires();
  const grantTimeout = timeUntilGrantExpires - 150;

  if (blockMainThread && grantTimeout <= 0) {
    return blockingWait(duration);
  }

  if (!blockMainThread || grantTimeout > duration) {
    return asyncWait(duration);
  }

  const adjustment = await asyncWait(grantTimeout);
  const wait = duration - grantTimeout - adjustment;
  return blockingWait(wait);
}

function blockingWait(ms: number) {
  if (ms < 0) {
    return ms;
  }

  const start = Date.now();
  while (Date.now() - start < ms) {}

  return 0;
}

async function asyncWait(ms: number) {
  const start = Date.now();

  await new Promise<void>((resolve) => {
    clearTimeout(timer);
    timer = setTimeout(resolve, ms);
  });

  return ms - (Date.now() - start);
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof navigator !== "undefined" &&
  polyfillKind
) {
  navigator.vibrate = teachSafariHowToVibe;

  // Setup trigger elements
  trigger = document.createElement("label");
  trigger.ariaHidden = "true";
  trigger.style.display = "none";

  const triggerInput = document.createElement("input");
  triggerInput.type = "checkbox";
  triggerInput.setAttribute("switch", "");
  trigger.appendChild(triggerInput);

  // Authorization handler
  function authorizeVibrations({ target }: UIEvent) {
    if (
      target === trigger ||
      target === triggerInput ||
      getTimeUntilGrantExpires() > GRANT_TIMEOUT * 0.5
    ) {
      return;
    }

    grantedVibrate();
  }

  // Add event listeners
  window.addEventListener("click", authorizeVibrations);
  window.addEventListener("touchend", authorizeVibrations);
  window.addEventListener("keyup", authorizeVibrations);
  window.addEventListener("keypress", authorizeVibrations);

  // Add trigger to document
  if (document.head) {
    document.head.appendChild(trigger);
  } else {
    setTimeout(() => document.head.appendChild(trigger), 0);
  }
}

function getSafariVersion() {
  const userAgent = navigator.userAgent;

  if (
    userAgent.indexOf("Safari") !== -1 &&
    userAgent.indexOf("Chrome") === -1
  ) {
    const versionRegex = /Version\/(\d+(\.\d+)?)/;
    const match = userAgent.match(versionRegex);

    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }

  return null;
}
