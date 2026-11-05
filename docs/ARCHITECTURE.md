# SnapDiff Architecture

This document describes the internal architecture of SnapDiff, covering the capture pipeline, pixel comparison engine, baseline store, and review studio.

## System Components

SnapDiff contains five primary modules:

1. **Capture Runner (`src/capture`)**
   Uses Playwright to manage headless Chromium instances. It creates isolated browser contexts for each viewport, injects stabilization stylesheets, scrolls the document to trigger lazy-loaded assets, and waits for web fonts to load.

2. **Pixel Diff Engine (`src/diff`)**
   Executes byte-level pixel comparisons using a WebAssembly pixelmatch core. It compares baseline and current RGBA buffers, counts mismatched pixels, calculates percentage drift, and generates a visual diff PNG with magenta highlights (`#ff00ff`).

3. **Baseline Store (`src/baseline`)**
   Manages the `.snapdiff` directory structure:
   - `.snapdiff/baseline/`: Approved canonical snapshots.
   - `.snapdiff/current/`: Newly captured snapshots from the current run.
   - `.snapdiff/diff/`: Generated visual diff images.
   - `.snapdiff/manifest.json`: Metadata linking snapshots to URLs, viewports, commit SHAs, and test results.

4. **Review Studio Server & Frontend (`src/server` and `web/`)**
   A Fastify web service serving a React 19 application. The studio provides visual inspection tools:
   - Sliding Wiper: Split-view slider to inspect pixel shifts between baseline and candidate images.
   - Onion Skin: Opacity slider with blend modes (normal, difference, invert).
   - Side-by-side: Two synchronized zoomable viewports.
   - Diff Mask: Direct view of the magenta mismatch buffer.
   - Approver: API calls that promote current snapshots to `.snapdiff/baseline/`.

5. **CI Quality Gate & Reporters (`src/reporter`)**
   CLI command runner that asserts mismatch percentages against a threshold. If any test case exceeds the threshold, the process exits with code 1. Reporters format results for terminal display, standalone single-file HTML reports, and GitHub PR comments.

## Data Flow

```
[Target URL / App]
       │
       ▼ Playwright (Chromium Headless)
[Stabilization CSS & Dynamic Masks]
       │
       ▼ Multi-Viewport Captures (Mobile, Tablet, Desktop)
[.snapdiff/current/*.png]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[.snapdiff/baseline/*.png]        [Wasm Pixelmatch Engine]
                                         │
                                         ▼
                            [.snapdiff/diff/*.png]
                            [Mismatch Metric Calculation]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         [CLI Quality Gate]                              [Fastify & React 19]
      (Pass / Fail Exit Code)                            (Interactive Studio)
```

## Anti-Flakiness Strategy

Automated screenshot testing frequently suffers from non-deterministic rendering differences. SnapDiff applies multiple stabilization layers before capturing:

1. **Animation Freezing**: Disables CSS animations and transitions via injected styles (`animation: none !important`, `transition: none !important`).
2. **Caret and Focus Suppression**: Hides text selection carets (`caret-color: transparent !important`).
3. **Scrollbar Neutralization**: Suppresses native and webkit scrollbars.
4. **Font Readiness**: Awaits `document.fonts.ready` promise settlement.
5. **Dynamic Masking**: Replaces user-specified selectors (such as `.timestamp`, `.counter`, `[data-avatar]`) with neutral solid fill rectangles before capture.
