# SnapDiff

Self-hosted visual regression testing engine with WebAssembly pixel diffing, responsive multi-breakpoint capture, and an interactive review studio.

SnapDiff renders pages in headless Chromium across mobile, tablet, and desktop viewports, masks dynamic elements to prevent false alarms, and flags visual differences above a user-defined threshold.

## Features

- Multi-viewport capture: Mobile (390px @2x), Tablet (768px @2x), and Desktop (1440px @2x) with custom viewport support.
- Color scheme matrix: Automated testing across Light and Dark modes (`colorSchemes: ["light", "dark"]`).
- Pre-capture action flows: Execute click, hover, form fill, and wait sequences before capturing screenshots.
- Authentication injection: Inject custom headers, session cookies, and local storage values for authenticated pages.
- WebAssembly accelerated diffing: Pixel-level mismatch calculations with bounding box detection and magenta difference maps.
- Smart masking: Disables CSS animations, hides blinking carets, suppresses scrollbars, and masks dynamic selectors such as timestamps and avatars.
- Interactive Review Studio: React 19 web application featuring:
  - Sliding wiper split viewer (interactive drag comparison).
  - Onion skin opacity overlay with blend modes.
  - Blink comparator (rapid A/B toggle for instant eye detection).
  - Side-by-side synchronized comparison.
  - Jump to Diff: Automatically zoom and center on the exact bounding box of the visual shift.
  - Interactive mask creator: Add dynamic masks to `snapdiff.config.json` directly from the UI.
  - Baseline history and rollback: Restore prior baselines with one click.
- Multi-worker concurrency: Parallel capture pipeline scaling across CPU cores.
- CI quality gate: Exit with code 1 when differences exceed the threshold (for example `--threshold 0.2%`), with automatic GitHub Pull Request comment formatting.
- Webhook notifications: Instant alert dispatch to Slack and Discord channels on visual regressions.
- Standalone HTML report: Export a single self-contained report file for sharing or archiving in CI pipelines.

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

If visual differences exceed 0.2%, SnapDiff prints the failing viewports and exits with status code 1.

### Launching the Review Studio

Open the visual diff review studio locally:

```bash
npx snapdiff review --port 9550
```

Navigate to `http://localhost:9550` to inspect diffs using the sliding wiper, onion skin, or blink comparator, and approve baseline updates with one click.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md): Design of the capture pipeline, diff engine, and review studio.
- [CLI Reference](docs/CLI_REFERENCE.md): Full command-line options and flags.
- [Configuration Guide](docs/CONFIGURATION.md): Configuration schema, viewports, dynamic masks, action flows, and auth.
- [CI/CD Integration](docs/CI_INTEGRATION.md): GitHub Actions workflow examples and PR comment automation.

## License

MIT
