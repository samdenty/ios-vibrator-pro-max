// Sorry Tim Cook, PWAs deserve some love too...

const MAGIC_NUMBER = 26.26;

let proMaxVibrator: any;

function teachSafariHowToVibe(
  rawPatterns: Iterable<number> | VibratePattern,
  allowMainThreadBlocking = false
): boolean {
  const patterns =
    typeof rawPatterns === "number" ? [rawPatterns] : [...rawPatterns];

  if (patterns.some((pattern) => typeof pattern !== "number")) {
    return false;
  }

  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);

  document.body.appendChild(label);

  if (!patterns.length) {
    return false;
  }

  const totalTime = patterns.reduce((acc, pattern) => {
    return acc + pattern;
  }, 0);

  const timeout =
    allowMainThreadBlocking && totalTime > 1000 ? blockForMs : waitForMs;

  function vibratePolyfill(time: number) {
    const endTime = Date.now() + time;

    async function vibrate(adjustment = 0): Promise<boolean> {
      const time = MAGIC_NUMBER - adjustment;
      const startTime = Date.now();

      label.click();

      const complete = await timeout(time, endTime);

      return complete || vibrate(Date.now() - startTime - Math.floor(time));
    }

    return vibrate();
  }

  clearTimeout(proMaxVibrator);

  async function next(index: number, adjustment = 0) {
    const time = patterns[index] - adjustment;
    const startTime = Date.now();

    if (index % 2) {
      await timeout(time);
    } else {
      await vibratePolyfill(time);
    }

    if (index === patterns.length - 1) {
      label.remove();
      return;
    }

    return next(index + 1, Date.now() - startTime - time);
  }

  next(0);

  return true;
}

if (typeof navigator !== "undefined" && !navigator.vibrate) {
  navigator.vibrate = teachSafariHowToVibe;
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

function waitForMs(ms: number, endTime?: number) {
  return new Promise<boolean>((resolve) => {
    proMaxVibrator = setTimeout(() => {
      resolve(!endTime || Date.now() >= endTime);
    }, ms);
  });
}
