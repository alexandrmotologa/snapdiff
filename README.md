# SnapDiff

Self-hosted visual regression testing engine with WebAssembly pixel diffing, responsive multi-breakpoint capture, and an interactive review studio.

SnapDiff renders pages in headless Chromium across mobile, tablet, and desktop viewports, masks dynamic elements to prevent false alarms, and flags visual differences above a user-defined threshold.

## Features

- Multi-viewport capture: Mobile (390px @2x), Tablet (768px @2x), and Desktop (1440px @2x) with custom viewport support.
- WebAssembly accelerated diffing: Pixel-level mismatch calculations with bounding box detection and magenta difference maps.
- Smart masking: Disables CSS animations, hides blinking carets, suppresses scrollbars, and masks dynamic selectors such as timestamps and avatars.
- Interactive Review Studio: React 19 web application featuring a sliding wiper split viewer, onion skin opacity overlay, and side-by-side comparison.
- One-click baseline approval: Promote current snapshots to approved baselines through the web studio or CLI.
- CI quality gate: Exit with code 1 when differences exceed the threshold (for example `--threshold 0.2%`), with automatic GitHub Pull Request comment formatting.
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

Navigate to `http://localhost:9550` to inspect diffs using the sliding wiper or onion skin overlay, and approve baseline updates with one click.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md): Design of the capture pipeline, diff engine, and review studio.
- [CLI Reference](docs/CLI_REFERENCE.md): Full command-line options and flags.
- [Configuration Guide](docs/CONFIGURATION.md): Configuration schema, viewports, dynamic masks, and wait strategies.
- [CI/CD Integration](docs/CI_INTEGRATION.md): GitHub Actions workflow examples and PR comment automation.

## License

MIT
