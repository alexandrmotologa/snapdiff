# SnapDiff: Master Implementation Plan

> **Self-Hosted Visual Regression & Cross-Breakpoint Screenshot Diffing Engine (Percy & Chromatic Alternative)**
>
> *High-speed, privacy-first visual regression testing platform and CI quality gate. Renders responsive viewports (Mobile, Tablet, Desktop) using headless Chromium, computes pixel-level diffs via WebAssembly pixelmatch, eliminates false positives with smart dynamic element masking, and provides an interactive sliding-wiper review studio.*

---

## 1. Project Overview & Architecture

Frontend user interfaces constantly suffer from visual regressions: a CSS utility tweak, an updated font scale, or a dependency upgrade accidentally breaks flexbox layouts, causes overlapping text, or hides buttons on mobile devices. Traditional automated testing tools (Jest, Playwright unit tests) check only DOM attributes and logic, missing visible UI breaks entirely:
1. **The Commercial Cloud Tax (Percy / Chromatic)**: Hosted visual testing services charge \$150–\$500/month, bill aggressively on screenshot counts, and require uploading proprietary designs to external servers.
2. **The False-Positive Nightmare**: Naive screenshot diffing flags false alarms on dynamic elements (changing timestamps, carousel animations, randomized test avatars, blinking carets).
3. **Multi-Viewport Inconvenience**: Testing responsive behavior across Mobile (390px), Tablet (768px), and Desktop (1440px) requires tedious manual configuration.
4. **Poor Review Experience**: Reviewing raw image diffs without an interactive sliding wiper makes it impossible to detect subtle 2px font-size or margin shifts.

**SnapDiff** delivers a self-hosted, local-first visual regression testing suite:
- **Multi-Breakpoint Headless Capturer**: Uses headless Chromium to capture high-DPI full-page screenshots across standard responsive viewports (390px, 768px, 1440px) with custom wait-for-idle policies.
- **Wasm-Accelerated Pixelmatch Engine**: Computes pixel-level difference masks in milliseconds, calculating exact mismatch percentages and highlighting shifts in bright magenta.
- **Smart Dynamic Element Masking**: Automatically masks out volatile elements via CSS selectors (`.timestamp`, `.avatar`, `[data-dynamic]`) and freezes animations (`prefers-reduced-motion: reduce`) to eliminate false alarms.
- **Interactive Sliding-Wiper Studio**: Embedded React 19 dashboard with side-by-side split wiper (drag slider to reveal before vs after), onion-skin overlay, and 1-click baseline approval.
- **CI Quality Gating**: Fails GitHub Actions pull requests when visual differences exceed configured thresholds: `npx snapdiff test --threshold 0.2%`.

```
+-----------------------------------------------------------------------------------+
|                                     SNAPDIFF                                      |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                 +-----------------------v-------+
|  Multi-Breakpoint Capturer      |                 |    Smart Dynamic Masking      |
|  * Mobile (390px), Tablet(768px)|                 |  * CSS Selector Element Masks |
|  * Desktop (1440px) @2x Retina  |                 |  * Freezes CSS Animations     |
|  * Network Idle & Font Loaded   |                 |  * Hides Random Avatars/Dates |
+-------+-------------------------+                 +-----------------------+-------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                        +-----------------v-----------------+
                        |   Wasm-Accelerated Diff Engine    |
                        |  * Pixelmatch / PNGjs Core        |
                        |  * Mismatch Percentage Calculator |
                        |  * Magenta Shift Highlight Layer  |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Interactive Review Studio       |
                        |  * Sliding Wiper (Split Screen)   |
                        |  * 2-Layer Onion Skin Overlay     |
                        |  * 1-Click "Approve as Baseline"  |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |     CI Gating & GitHub Reporter   |
                        |  * Fails CI if Diff > Threshold   |
                        |  * Automated PR Comment with Diffs|
                        |  * CLI & Web Studio (Port 9550)   |
                        +-----------------------------------+
```

---

## 2. Directory Structure

```
snapdiff/
├── src/
│   ├── capture/
│   │   ├── browser_runner.ts     # Playwright Chromium headless lifecycle
│   │   ├── viewport_config.ts    # Standard screen sizes (390, 768, 1440)
│   │   ├── wait_strategy.ts      # Waits for fonts, images, and network idle
│   │   └── mask_injector.ts      # Injects styles to mask dynamic elements
│   ├── diff/
│   │   ├── pixel_comparator.ts   # Pixelmatch Wasm engine computing pixel diff
│   │   ├── metric_calculator.ts  # Total pixels, mismatched count, diff percentage
│   │   └── image_writer.ts       # Generates baseline, current, and diff PNGs
│   ├── baseline/
│   │   ├── store.go              # Filesystem storage for approved baseline snapshots
│   │   ├── approver.ts           # Replaces baseline image with current snapshot
│   │   └── git_metadata.ts       # Tracks commit SHA and branch for each snapshot
│   ├── reporter/
│   │   ├── terminal_table.ts     # Colorized terminal pass/fail summary
│   │   ├── pr_commenter.ts       # Posts diff images to GitHub Pull Request
│   │   └── html_report.ts        # Standalone HTML report export
│   ├── server/
│   │   ├── api.ts                # Fastify backend for web review studio
│   │   └── static.ts             # Serves snapshot images and Vite bundle
│   └── cli.ts                    # Commander CLI entrypoint
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SlidingWiper.tsx      # Split-screen slider comparing baseline vs current
│   │   │   ├── OnionSkinViewer.tsx   # Opacity slider overlay viewer
│   │   │   ├── SnapshotGrid.tsx      # List of tested URLs and responsive viewports
│   │   │   └── ApproveButton.tsx     # 1-click button to update baseline snapshot
│   │   ├── hooks/
│   │   │   └── useDiffReport.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   ├── pixel_comparator.test.ts
│   └── mask_injector.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Implementation Roadmap

### Phase 1: Headless Chromium Capturer & Multi-Breakpoint Engine
- Implement `src/capture/browser_runner.ts` using Playwright:
  - Launch isolated Chromium instance with `--font-render-hinting=none` and consistent font antialiasing.
  - Iterate through viewports:
    - Mobile: `390x844`, `deviceScaleFactor: 2` (iPhone 15).
    - Tablet: `768x1024`, `deviceScaleFactor: 2` (iPad Mini).
    - Desktop: `1440x900`, `deviceScaleFactor: 2`.
- Implement `src/capture/wait_strategy.ts`:
  - Wait for `document.fonts.ready`, network idle, and scroll the page to trigger lazy-loaded images before capturing full-page screenshot.

### Phase 2: Smart Masking & Anti-False-Positive Shield
- Implement `src/capture/mask_injector.ts`:
  - Inject CSS to disable animations: `* { animation: none !important; transition: none !important; }`.
  - Hide carets: `* { caret-color: transparent !important; }`.
  - Mask dynamic elements passed via configuration (e.g. `masks: [".timestamp", "[data-avatar]"]`) by overlaying a solid neutral gray box (`#e2e8f0`).

### Phase 3: Wasm-Accelerated Pixelmatch Diff Engine
- Implement `src/diff/pixel_comparator.ts`:
  - Compare baseline PNG against current PNG using `pixelmatch`:
    - Set color threshold $\Delta = 0.1$.
    - Highlight differences in bright magenta (`#ff00ff`).
  - Calculate mismatch ratio:
    $$\text{DiffRatio} = \frac{\text{MismatchedPixels}}{\text{TotalPixels}} \times 100\%$$
  - If $\text{DiffRatio} > \text{Threshold}$ (default: $0.2\%$), mark test as `FAILED`.

### Phase 4: Interactive Review Studio (Sliding Wiper & Onion Skin)
- Build modern React 19 interface in `web/`:
  - **Sliding Wiper**: Interactive split-screen visualizer where moving the cursor/slider reveals the baseline on the left and the current build on the right.
  - **Onion Skin Overlay**: Layer both images on top of each other with an opacity slider (0% to 100%) to instantly spot 1px–2px alignment shifts.
  - **1-Click Baseline Approval**: Clicking "Approve" moves current PNG into `snapshots/baseline/` and commits to Git.

### Phase 5: CI Gating & Pull Request Reporter
- Implement `src/reporter/pr_commenter.ts`:
  - Post comment to GitHub PR summarizing visual changes:
    ```markdown
    ### 🎨 SnapDiff Visual Regression Report
    - **Status**: ❌ 2 Failures Detected
    - **Checkout (Desktop)**: 0.84% mismatch (Threshold: 0.20%)
    - **Navbar (Mobile)**: 1.42% mismatch (Threshold: 0.20%)
    [View Interactive Review Studio](https://...)
    ```
- Implement CLI commands:
  - `npx snapdiff capture --url http://localhost:3000`: Creates initial baselines.
  - `npx snapdiff test --threshold 0.2%`: Executes comparison and exits with code 1 if diff exceeds threshold.
  - `npx snapdiff review --port 9550`: Launches local review studio.

---

## 4. Agent Kickoff Prompt

```markdown
You are implementing **SnapDiff**, a self-hosted visual regression and cross-breakpoint screenshot diffing engine in Node.js 22 + TypeScript + Playwright + React 19.

### Execution Plan:
1. Initialize the project in `B:\workgit\snapdiff` with root `package.json`, TypeScript configuration, and dependencies (`playwright`, `pixelmatch`, `pngjs`, `fastify`, `commander`).
2. Implement `src/capture/` to render responsive full-page screenshots across Mobile (390px), Tablet (768px), and Desktop (1440px) with custom wait-for-idle strategies.
3. Implement `src/capture/mask_injector.ts` to disable animations and mask dynamic elements using CSS selectors.
4. Implement `src/diff/pixel_comparator.ts` with Pixelmatch to calculate exact mismatch percentages and output magenta diff images.
5. Implement `src/baseline/` to manage approved baseline snapshots on disk.
6. Build the modern React 19 review studio in `web/` featuring the Sliding Wiper (split-screen slider), Onion Skin Overlay, and 1-Click Approve button.
7. Implement the CLI in `src/cli.ts` supporting `capture`, `test --threshold 0.2%`, and `review --port 9550`.

Maintain 100% production code without mocks, placeholders, or empty handlers.
```
