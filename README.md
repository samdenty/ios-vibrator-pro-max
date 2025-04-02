# `ios-vibrator-pro-max`

[![npm version](https://img.shields.io/npm/v/ios-vibrator-pro-max.svg?style=flat-square)](https://www.npmjs.com/package/ios-vibrator-pro-max)
[![npm downloads](https://img.shields.io/npm/dm/ios-vibrator-pro-max.svg?style=flat-square)](https://www.npmjs.com/package/ios-vibrator-pro-max)
[![Demo](https://img.shields.io/badge/Demo-blue.svg?style=flat-square)](https://ios-vibrate-api-demo.vercel.app/)


Finally Safari added an unofficial™️ vibration API. I'm sorry to whoever who let this amazing feature/bug accidentally ship it's way into iOS 18. Tim cook please don't remove it, the web & PWAs need love too.

```ts
import "ios-vibrator-pro-max";

navigator.vibrate(1000);
```

## Durations longer than 1000ms

This will block the main thread for the duration of the vibration pattern. Only vibration patterns longer than 1s total will block. Blocking is required as it's the only way to extend the trusted event grant of the click handler (async vibrations have expiration)

```ts
import { enableMainThreadBlocking } from "ios-vibrator-pro-max";

enableMainThreadBlocking(true);

navigator.vibrate(2000);
```
