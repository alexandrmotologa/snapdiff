# SnapDiff Configuration Guide

SnapDiff can be configured using `snapdiff.config.json` or `snapdiff.config.ts`. When no configuration file is provided, default settings are applied.

## Example Configuration

```json
{
  "threshold": 0.002,
  "diffColor": [255, 0, 255],
  "concurrency": 4,
  "colorSchemes": ["light", "dark"],
  "viewports": {
    "mobile": { "width": 390, "height": 844, "deviceScaleFactor": 2 },
    "tablet": { "width": 768, "height": 1024, "deviceScaleFactor": 2 },
    "desktop": { "width": 1440, "height": 900, "deviceScaleFactor": 2 }
  },
  "targets": [
    {
      "name": "home-page",
      "url": "http://localhost:3000",
      "colorSchemes": ["light", "dark"],
      "masks": [".dynamic-timestamp", "[data-avatar]", ".ticker-item"],
      "wait": {
        "networkIdle": true,
        "fontsReady": true,
        "delay": 250
      }
    },
    {
      "name": "checkout-dialog",
      "url": "http://localhost:3000/cart",
      "actions": [
        { "type": "click", "selector": "#checkout-btn" },
        { "type": "wait", "selector": ".modal-dialog" },
        { "type": "wait", "ms": 200 }
      ],
      "auth": {
        "headers": { "Authorization": "Bearer ci-test-token" },
        "localStorage": { "cookie_consent": "true" }
      }
    }
  ],
  "webhook": {
    "url": "https://discord.com/api/webhooks/...",
    "type": "discord",
    "onFailureOnly": true
  },
  "outputDir": ".snapdiff"
}
```

## Configuration Options

### `threshold`
- Type: `number` (or string percentage such as `"0.2%"`)
- Default: `0.002` (0.2%)
- Maximum allowed ratio of mismatched pixels over total pixels before a test is marked as failed.

### `concurrency`
- Type: `number`
- Default: `4`
- Number of browser contexts executing screenshot captures and comparisons in parallel.

### `colorSchemes`
- Type: `Array<"light" | "dark">`
- Default: `["light"]`
- Color scheme matrix. When both `"light"` and `"dark"` are set, SnapDiff tests each viewport across both modes using browser media emulation.

### `diffColor`
- Type: `[number, number, number]` (RGB tuple)
- Default: `[255, 0, 255]` (bright magenta)
- The color applied to divergent pixels in the difference image.

### `viewports`
- Type: `Record<string, ViewportConfig>`
- Defines responsive screen sizes:
  - `mobile`: 390x844 @2x
  - `tablet`: 768x1024 @2x
  - `desktop`: 1440x900 @2x

### `targets[].actions`
- Type: `Array<PreCaptureAction>`
- Sequence of browser interactions executed prior to taking the screenshot:
  - `{ type: "click", selector: string, timeout?: number }`
  - `{ type: "hover", selector: string, timeout?: number }`
  - `{ type: "fill", selector: string, value: string }`
  - `{ type: "wait", selector?: string, ms?: number }`
  - `{ type: "evaluate", script: string }`

### `targets[].auth`
- Type: `AuthOptions`
- Session and credentials injection:
  - `cookies`: Array of cookie objects (`name`, `value`, `domain`, `path`).
  - `headers`: Map of custom HTTP request headers (such as `Authorization`).
  - `localStorage`: Map of key-value pairs written to window.localStorage.
  - `sessionStorage`: Map of key-value pairs written to window.sessionStorage.

### `webhook`
- Type: `WebhookConfig | string`
- Notifies external channels on test runs:
  - `url`: Webhook endpoint URL (Discord, Slack, or generic HTTP POST).
  - `type`: `"discord" | "slack" | "generic"`.
  - `onFailureOnly`: Boolean (default: true). Only dispatches notification when one or more visual checks fail.
