# SnapDiff Configuration Guide

SnapDiff can be configured using `snapdiff.config.json` or `snapdiff.config.ts`. When no configuration file is provided, default settings are applied.

## Example Configuration

```json
{
  "threshold": 0.002,
  "diffColor": [255, 0, 255],
  "viewports": {
    "mobile": { "width": 390, "height": 844, "deviceScaleFactor": 2 },
    "tablet": { "width": 768, "height": 1024, "deviceScaleFactor": 2 },
    "desktop": { "width": 1440, "height": 900, "deviceScaleFactor": 2 }
  },
  "targets": [
    {
      "name": "home-page",
      "url": "http://localhost:3000",
      "masks": [".dynamic-timestamp", "[data-avatar]", ".ticker-item"],
      "wait": {
        "networkIdle": true,
        "fontsReady": true,
        "delay": 250
      }
    },
    {
      "name": "pricing-table",
      "url": "http://localhost:3000/pricing",
      "selector": "#pricing-grid"
    }
  ],
  "outputDir": ".snapdiff"
}
```

## Configuration Options

### `threshold`
- Type: `number` (or string percentage such as `"0.2%"`)
- Default: `0.002` (0.2%)
- Maximum allowed ratio of mismatched pixels over total pixels before a test is marked as failed.

### `diffColor`
- Type: `[number, number, number]` (RGB tuple)
- Default: `[255, 0, 255]` (bright magenta)
- The color applied to divergent pixels in the generated difference image.

### `viewports`
- Type: `Record<string, ViewportConfig>`
- Defines responsive screen sizes. Each viewport configuration supports:
  - `width`: Number of pixels across the viewport.
  - `height`: Number of pixels down the viewport.
  - `deviceScaleFactor`: Device pixel ratio (default: `2` for high-DPI rendering).
  - `isMobile`: Whether to simulate mobile browser behavior (default: inferred from width).

Standard presets included by default:
- `mobile`: 390x844 @2x (iPhone 15 equivalent)
- `tablet`: 768x1024 @2x (iPad Mini equivalent)
- `desktop`: 1440x900 @2x (MacBook Pro standard desktop)

### `targets`
- Type: `Array<TargetConfig>`
- Array of pages or components to capture and test.
  - `name`: Unique slug used for naming snapshot files.
  - `url`: Full URL to navigate to.
  - `selector`: Optional CSS selector to snapshot a specific component instead of the full page.
  - `masks`: Array of CSS selectors to overlay with neutral masking boxes.
  - `viewports`: Optional array of viewport names to test for this target (defaults to all configured viewports).
  - `wait`:
    - `networkIdle`: Wait until no network connections are active for at least 500ms.
    - `fontsReady`: Await `document.fonts.ready`.
    - `delay`: Additional milliseconds to wait after page load before taking the screenshot.

### `outputDir`
- Type: `string`
- Default: `".snapdiff"`
- Directory where baseline, current, and diff images are preserved.
