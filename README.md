<p align="center">
  <img src="docs/images/logo.png?raw=true" alt="SnapDiff Logo" width="130" style="border-radius: 28px;" />
</p>

<h1 align="center">SnapDiff</h1>

<p align="center">
  <strong>Self-hosted responsive visual regression testing engine with WebAssembly pixel diffing, pre-capture interaction flows, and interactive review studio.</strong>
</p>

<p align="center">
  <a href="https://github.com/alexandrmotologa/snapdiff/actions/workflows/ci.yml"><img src="https://github.com/alexandrmotologa/snapdiff/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white" alt="Node.js 22+" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
</p>

---

<p align="center">
  <img src="docs/images/snapdiff_demo.gif?raw=true" alt="SnapDiff Interactive Review Studio Demo" width="900" style="border-radius: 12px; border: 1px solid #334155;" />
</p>

SnapDiff captures full-page or component screenshots across standard viewports (Mobile 390px, Tablet 768px, Desktop 1440px) using headless Chromium. It masks dynamic elements to suppress false alarms, computes pixel differences, and enforces CI thresholds with a local review studio.

## Core Capabilities

- Multi-viewport capture: Mobile (390x844 @2x), Tablet (768x1024 @2x), and Desktop (1440x900 @2x) with custom viewport support.
- Color scheme matrix: Automated testing across Light and Dark modes (`colorSchemes: ["light", "dark"]`).
- Pre-capture action flows: Click, hover, form fill, and wait sequences to test modals, dropdowns, and drawers.
- Authentication injection: Custom headers, session cookies, and local storage values for protected routes.
- WebAssembly accelerated diffing: Pixel mismatch calculations with bounding box detection and magenta difference maps.
- Smart dynamic masking: Freezes CSS animations, hides text carets, suppresses scrollbars, and masks dynamic selectors such as timestamps and avatars.
- Interactive Review Studio:
  - Sliding wiper split viewer with draggable divider.
  - Onion skin opacity overlay with normal, difference, and multiply blend modes.
  - Blink comparator with rapid A/B toggling (200ms to 600ms).
  - Jump to Diff: Automatically centers and zooms directly on the bounding box of visual drift.
  - Interactive mask creator: Persist ignore masks directly to `snapdiff.config.json`.
  - Baseline history and rollback: Restore prior baselines with one click.
- Multi-worker concurrency: Parallel capture pipeline scaling across CPU cores.
- CI quality gate: Exits with code 1 when differences exceed the threshold (for example `--threshold 0.2%`), with automatic GitHub Pull Request comment formatting.
- Webhook notifications: Dispatches alerts to Slack and Discord channels on visual regressions.
- Standalone HTML report: Exports self-contained single-file reports with embedded base64 images.

---

## Review Studio Interface

### 1. Sliding Wiper (Split Screen Comparison)
Drag the vertical divider horizontally to inspect pixel shifts between baseline and candidate builds:

<p align="center">
  <img src="docs/images/snapdiff_studio_wiper.png?raw=true" alt="SnapDiff Sliding Wiper" width="900" style="border-radius: 8px; border: 1px solid #334155;" />
</p>

### 2. Onion Skin Overlay
Layer baseline and candidate images with adjustable opacity (0% to 100%) and difference blend mode:

<p align="center">
  <img src="docs/images/snapdiff_studio_onion.png?raw=true" alt="SnapDiff Onion Skin Overlay" width="900" style="border-radius: 8px; border: 1px solid #334155;" />
</p>

### 3. Difference Mask
Highlight divergent pixels in bright magenta (`#ff00ff`) with bounding box localization:

<p align="center">
  <img src="docs/images/snapdiff_diff_mask.png?raw=true" alt="SnapDiff Difference Mask" width="900" style="border-radius: 8px; border: 1px solid #334155;" />
</p>

### 4. Responsive Viewport Testing (Mobile 390px)
Test mobile drawers, navigation bars, and cards across small form factors:

<p align="center">
  <img src="docs/images/snapdiff_responsive_mobile.png?raw=true" alt="SnapDiff Mobile Responsive Studio" width="400" style="border-radius: 8px; border: 1px solid #334155;" />
</p>

---

## Quick Start

### Installation

Install SnapDiff as a development dependency:

```bash
npm install --save-dev snapdiff
# or
npx snapdiff --help
```

Ensure Playwright Chromium is installed:

```bash
npx playwright install chromium
```

### Initializing Configuration

Generate a starter configuration file:

```bash
npx snapdiff init
```

This creates a `snapdiff.config.json` with standard viewports, wait conditions, and target URLs.

### Capturing Baselines

Capture initial baseline snapshots:

```bash
npx snapdiff capture --url http://localhost:3000
```

Baselines are stored in `.snapdiff/baseline/`.

### Running Tests in CI

Run visual regression tests against the baseline:

```bash
npx snapdiff test --threshold 0.2%
```

If visual differences exceed 0.2%, SnapDiff prints failing viewports and exits with status code 1.

### Launching the Review Studio

Open the visual diff review studio locally:

```bash
npx snapdiff review --port 9550
```

Navigate to `http://localhost:9550` to inspect diffs using the sliding wiper, onion skin, or blink comparator, and approve baseline updates with one click.

---

## Configuration Example

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
      "masks": [".timestamp", "[data-avatar]"],
      "wait": {
        "networkIdle": true,
        "fontsReady": true,
        "delay": 200
      }
    },
    {
      "name": "checkout-dialog",
      "url": "http://localhost:3000/cart",
      "actions": [
        { "type": "click", "selector": "#checkout-btn" },
        { "type": "wait", "selector": ".modal-dialog" }
      ],
      "auth": {
        "headers": { "Authorization": "Bearer ci-test-token" }
      }
    }
  ],
  "outputDir": ".snapdiff"
}
```

---

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md): Design of the capture pipeline, diff engine, and review studio.
- [CLI Reference](docs/CLI_REFERENCE.md): Full command-line options and flags.
- [Configuration Guide](docs/CONFIGURATION.md): Configuration schema, viewports, dynamic masks, action flows, and auth.
- [CI/CD Integration](docs/CI_INTEGRATION.md): GitHub Actions workflow examples and PR comment automation.

---

## License

MIT
