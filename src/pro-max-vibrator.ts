// Sorry Tim Cook, PWAs deserve some love too...

const MAGIC_NUMBER = 26.26;

let waiter: any;
let grant: any;
let trigger: HTMLLabelElement;
let vibrateDuringGrant = false;
let blockMainThread = false;

export function enableMainThreadBlocking(enabled: boolean) {
  blockMainThread = enabled;
}

function teachSafariHowToVibe(
  rawPatterns: Iterable<number> | VibratePattern,
  allowMainThreadBlocking = blockMainThread
): boolean {
  const patterns =
    typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

  if (
    !patterns.length ||
    patterns.some((pattern) => typeof pattern !== "number")
  ) {
    return false;
  }

  const totalTime = patterns.reduce((acc, pattern) => {
    return acc + pattern;
  }, 0);

  const block = allowMainThreadBlocking && totalTime > 1000;

  const timeout = block ? blockForMs : waitForMs;
  const vibrate = block ? blockingVibrate : grantedVibrate;

  clearTimeout(waiter);

  async function next(index: number, adjustment = 0) {
    const time = patterns[index] - adjustment;
    const startTime = Date.now();

    if (index % 2) {
      await timeout(time);
    } else {
      await vibrate(time);
    }

    if (index !== patterns.length - 1) {
      return next(index + 1, Date.now() - startTime - time);
    }
  }

  next(0);

  return true;
}

function blockForMs(ms: number, endTime?: number) {
  if (ms < 0) {
    ms = 0;
  }

  const date = Date.now();

  while (Date.now() - date < ms) {
    if (endTime && Date.now() >= endTime) {
      break;
    }

    // Block the main thread
  }

  return !endTime || Date.now() >= endTime;
}

async function grantedVibrate(time: number) {
  vibrateDuringGrant = true;
  await waitForMs(time);
  vibrateDuringGrant = false;
}

async function allowVibrationsDuringGrant(adjustment = 0): Promise<boolean> {
  const time = MAGIC_NUMBER - adjustment;
  const startTime = Date.now();

  if (vibrateDuringGrant) {
    trigger.click();
  }

  await new Promise<void>((resolve) => {
    grant = setTimeout(resolve, time);
  });

  return allowVibrationsDuringGrant(Date.now() - startTime - time);
}

function blockingVibrate(time: number) {
  const endTime = Date.now() + time;

  function vibrate(adjustment = 0): boolean {
    const time = MAGIC_NUMBER - adjustment;
    const startTime = Date.now();

    trigger.click();

    const complete = blockForMs(time, endTime);

    return complete || vibrate(Date.now() - startTime - Math.floor(time));
  }

  return vibrate();
}

function waitForMs(ms: number) {
  return new Promise<void>((resolve) => {
    waiter = setTimeout(resolve, ms);
  });
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof navigator !== "undefined" &&
  !navigator.vibrate
) {
  navigator.vibrate = teachSafariHowToVibe;

  trigger = document.createElement("label");
  trigger.ariaHidden = "true";
  trigger.style.display = "none";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  trigger.appendChild(input);

  document.body.addEventListener("click", () => {
    if (grant) {
      return;
    }

    clearTimeout(grant);

    allowVibrationsDuringGrant();

    setTimeout(() => {
      // in older iOS versions, there was no such thing as a grant...
      grant = undefined;
    }, 1000);
  });

  // head so we don't trigger body clicks
  if (document.head) {
    document.head.appendChild(trigger);
  } else {
    setTimeout(() => {
      document.head.appendChild(trigger);
    }, 0);
  }
}
