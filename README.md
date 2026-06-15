# `ios-vibrator-pro-max`

[![npm downloads](https://www.shieldcn.dev/npm/dm/ios-vibrator-pro-max.svg?variant=branded&size=sm)](https://www.npmjs.com/package/ios-vibrator-pro-max)
[![Total npm downloads](https://www.shieldcn.dev/npm/dw/ios-vibrator-pro-max.svg?variant=secondary&size=sm)](https://www.npmjs.com/package/ios-vibrator-pro-max)
[![@samdenty on X](https://www.shieldcn.dev/x/follow/samdenty.svg?variant=branded&size=sm)](https://x.com/samdenty)

iOS Safari implementation of `navigator.vibrate` — works inside `onClick`, `onTouchMove` and `onInput`.

```ts
import "ios-vibrator-pro-max";

navigator.vibrate(1000);
```

## How it works

This polyfill works by layering hidden input switches ontop of interactive elements in your application. When you call `navigator.vibrate` we have three methods of triggering a vibration:

1. **`ontouchmove`** - We overlay a switch ontop of the draggable area and rapidly flip the position, so the browser thinks your finger is toggling the switch causing vibration.
2. **`onclick`** - We wrap the entire DOM inside a label element and detect what element you click on. We then simulate clicks on the elements you were clicking on, and if your handler didn't cause a vibration we call `event.preventDefault()` on the wrapped DOM label to block the vibration.
3. **Outside `onclick`** - We capture previous click interactions that are performed on any element, we then call `label.click()` repeatedly inside a `setTimeout` in that events handlers closure.

## ⚠️ Limitations

This polyfill will work without any user interaction on iOS `18` to `18.3`. In iOS `18.4` Apple [made the vibration require user interaction](https://x.com/samddenty/status/1897123571799118091). Unfortunately the way they did this, the only interaction that counts is a click (unfortunately dragging doesn't count) and the grant expires after 1s. There's no way to keep vibrating after that click grant expires, except to block the main thread - see below to enable that option

## Background popups

```ts
import { enableBackgroundPopup } from 'ios-vibrator-pro-max';

enableBackgroundPopup(true)
```


## Durations longer than 1000ms

This will block the main thread for the duration of the vibration pattern. Only vibration patterns longer than 1s total will block. Blocking is required as it's the only way to extend the trusted event grant of the click handler (async vibrations have expiration)

```ts
import { enableMainThreadBlocking } from "ios-vibrator-pro-max";

enableMainThreadBlocking(true);

navigator.vibrate(2000);
```
