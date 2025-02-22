// Sorry Tim Cook, PWAs deserve some love too...

let proMaxVibrator: any;

function teachSafariHowToVibe(
  rawPatterns: Iterable<number> | VibratePattern
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

  function vibratePolyfill(time: number) {
    const endTime = Date.now() + time;

    return new Promise<void>((resolve) => {
      function vibrate() {
        if (endTime <= Date.now()) {
          resolve();
          return;
        }

        label.click();

        proMaxVibrator = setTimeout(vibrate, 30);
      }

      vibrate();
    });
  }

  if (!patterns.length) {
    return false;
  }

  clearTimeout(proMaxVibrator);

  async function next(index: number, adjustment = 0) {
    const time = patterns[index] - adjustment;
    const startTime = Date.now();

    if (index % 2) {
      await new Promise((resolve) => {
        proMaxVibrator = setTimeout(resolve, time);
      });
    } else {
      await vibratePolyfill(time);
    }

    if (index === patterns.length - 1) {
      label.remove();
      return;
    }

    next(index + 1, Date.now() - startTime - time);
  }

  next(0);

  return true;
}

if (typeof navigator !== "undefined" && !navigator.vibrate) {
  navigator.vibrate = teachSafariHowToVibe;
}
