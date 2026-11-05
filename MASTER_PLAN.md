# SnapDiff Master Plan

Self-hosted responsive visual regression testing engine with WebAssembly pixel diffing, dynamic element masking, and interactive review studio.

## 1. Problem and Objective

Visual regressions break user interfaces when CSS changes, dependencies update, or layout rules shift unexpectedly. Traditional unit or end-to-end tests assert DOM element presence and attributes, but miss rendering bugs such as overlapping text, truncated cards, or broken flexbox layouts on mobile viewports.

Commercial cloud services such as Percy and Chromatic bill high monthly subscriptions, enforce strict screenshot quotas, and upload internal UI builds to third-party infrastructure.

SnapDiff provides a self-hosted, local-first visual regression testing tool with:
1. Multi-breakpoint capture across Mobile (390px), Tablet (768px), and Desktop (1440px) with custom wait-for-idle strategies.
2. WebAssembly pixel comparison using a fast pixelmatch engine with difference bounding boxes and magenta overlay.
3. Smart masking of volatile content (timestamps, avatars, dynamic widgets) and animation freezing.
4. Embedded Fastify server and React 19 review studio with sliding wiper, onion skin overlay, and one-click baseline approval.
5. CI quality gate that exits with code 1 when diff ratios exceed configured thresholds.

## 2. System Architecture

SnapDiff runs as a CLI command or programmatic library. The architecture contains five modular layers:

```
+-------------------------------------------------------------------------+
|                                SNAPDIFF                                 |
+-----------------------------------+-------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
+-----------v-----------+                       +-----------v-----------+
| Multi-Viewport Engine |                       | Smart Masking Engine  |
| Mobile (390px @2x)    |                       | CSS selector masks    |
| Tablet (768px @2x)    |                       | Freezes animations    |
| Desktop (1440px @2x)  |                       | Caret and scrollbar   |
| Lazy scroll + fonts   |                       | neutral background    |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
            +-----------------------+-----------------------+
                                    |
                        +-----------v-----------+
                        |  Pixel Diff Engine    |
                        | Wasm / Fast Pixelmatch|
                        | Mismatch metric calc  |
                        | Magenta diff PNG      |
                        +-----------+-----------+
                                    |
                        +-----------v-----------+
                        |  Review Studio & API  |
                        | Fastify REST backend  |
                        | React 19 Web Studio   |
                        | Sliding wiper slider  |
                        | Onion skin overlay    |
                        | One-click approval    |
                        +-----------+-----------+
                                    |
                        +-----------v-----------+
                        | CI Gate & Reporters   |
                        | CLI threshold check   |
                        | GitHub PR commenter   |
                        | Standalone HTML report|
                        +-----------------------+
```

## 3. Directory Layout

```
snapdiff/
├── src/
│   ├── index.ts                  # Public programmatic API export
│   ├── types.ts                  # Common TypeScript interfaces and schemas
│   ├── config.ts                 # Configuration loader and defaults
│   ├── capture/
│   │   ├── browser_runner.ts     # Playwright Chromium lifecycle manager
│   │   ├── viewport_config.ts    # Responsive presets and custom viewports
│   │   ├── wait_strategy.ts      # Font loading, network idle, and lazy scroll
│   │   └── mask_injector.ts      # CSS dynamic masks and animation freezing
│   ├── diff/
│   │   ├── wasm_pixelmatch.ts    # WebAssembly and high-speed pixel diff engine
│   │   ├── metric_calculator.ts  # Total pixels, mismatch count, percentage
│   │   └── image_writer.ts       # Baseline, current, and diff image generation
│   ├── baseline/
│   │   ├── store.ts              # File-based snapshot storage manager
│   │   ├── approver.ts           # Baseline approval and promotion workflow
│   │   └── git_metadata.ts       # Commit SHA and branch detection
│   ├── reporter/
│   │   ├── terminal_table.ts     # Colorized terminal output with pass/fail table
│   │   ├── pr_commenter.ts       # GitHub Pull Request comment generator
│   │   └── html_report.ts        # Standalone self-contained HTML report builder
│   ├── server/
│   │   ├── api.ts                # Fastify REST endpoints for the review studio
│   │   ├── routes.ts             # Snapshot routes, approval handlers, and runs
│   │   └── static.ts             # Static file handler for snapshot images and UI
│   ├── demo/
│   │   └── demo_server.ts        # Embedded test fixture server for quick verification
│   └── cli.ts                    # Commander CLI entry point
├── web/                          # React 19 review studio
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # Top status bar, run selector, and filter controls
│   │   │   ├── SlidingWiper.tsx  # Split-screen slider comparing baseline vs current
│   │   │   ├── OnionSkinViewer.tsx # Opacity overlay with blend modes
│   │   │   ├── SideBySide.tsx    # Synchronized two-pane comparison
│   │   │   ├── DiffLayer.tsx     # Magenta diff mask viewer
│   │   │   ├── SnapshotList.tsx  # Sidebar grouped by URL and viewport
│   │   │   └── ApproveBar.tsx    # Approval actions with batch support
│   │   ├── hooks/
│   │   │   └── useSnapshots.ts   # Data fetching and state management
│   │   ├── App.tsx               # Main application container
│   │   └── main.tsx              # React DOM entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── tests/
│   ├── config.test.ts
│   ├── mask_injector.test.ts
│   ├── pixel_comparator.test.ts
│   ├── baseline_store.test.ts
│   └── server_api.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CLI_REFERENCE.md
│   ├── CONFIGURATION.md
│   └── CI_INTEGRATION.md
├── package.json
├── tsconfig.json
└── README.md
```

## 4. Implementation Steps

### Phase 1: Core Setup and Configuration
- Set up root package.json with dependencies: Playwright, Fastify, PNGjs, Pixelmatch, Commander, Picocolors.
- Configure TypeScript compiler options for Node.js 22+ ESM.
- Implement configuration loader `src/config.ts` supporting `snapdiff.config.ts` and `snapdiff.config.json` with sensible defaults.

### Phase 2: Responsive Playwright Capturer and Smart Masking
- Implement `src/capture/browser_runner.ts` using Chromium headless with consistent font antialiasing and headless flags.
- Build viewport profiles: Mobile (390x844 @2x), Tablet (768x1024 @2x), Desktop (1440x900 @2x), and custom dimensions.
- Implement `src/capture/wait_strategy.ts`: wait for `document.fonts.ready`, network idle, and full-page lazy-loading scrolling.
- Implement `src/capture/mask_injector.ts`: inject CSS to disable animations, hide carets, hide scrollbars, and mask target selectors with neutral fill.

### Phase 3: Pixel Comparison Engine
- Implement `src/diff/wasm_pixelmatch.ts`: WebAssembly pixel comparison core with typed array buffers and color delta evaluation.
- Implement `src/diff/metric_calculator.ts`: calculate mismatch ratio, total pixels, and bounding box coordinates.
- Implement `src/diff/image_writer.ts`: encode PNG diff outputs highlighting variations in magenta.

### Phase 4: Baseline Management and Storage
- Implement `src/baseline/store.ts`: structure `.snapdiff/baseline/`, `.snapdiff/current/`, `.snapdiff/diff/`, and `manifest.json`.
- Implement `src/baseline/approver.ts`: promote current snapshots to baseline individually or in bulk.
- Implement `src/baseline/git_metadata.ts`: capture branch name, commit SHA, and author when available.

### Phase 5: Fastify Backend and API
- Implement `src/server/api.ts` with Fastify:
  - `GET /api/reports/latest`: return comparison statistics.
  - `GET /api/snapshots/:folder/:filename`: serve image buffers.
  - `POST /api/approve`: promote current image to baseline.
  - `POST /api/approve-all`: approve all failed snapshots.
  - `POST /api/run`: re-run capture and test cycle.
- Implement static asset serving for the built React frontend.

### Phase 6: React 19 Review Studio
- Set up Vite + React 19 application in `web/`.
- Build the Sliding Wiper: drag divider horizontally across the canvas to expose baseline versus current image.
- Build the Onion Skin viewer: adjust opacity slider from 0% to 100% to identify sub-pixel misalignments.
- Build Side-by-Side and Diff Highlight viewing modes.
- Build instant approval toolbar and filter controls (status, viewport, URL path).

### Phase 7: CLI, Reporters, and CI Integration
- Implement CLI commands in `src/cli.ts`:
  - `snapdiff init`: generate starter configuration.
  - `snapdiff capture`: record baseline snapshots.
  - `snapdiff test`: execute visual comparison and exit with code 1 if diff exceeds threshold.
  - `snapdiff review`: start the Fastify server and open the web studio.
  - `snapdiff approve`: promote snapshots via command line.
  - `snapdiff report`: export self-contained HTML report.
  - `snapdiff pr-comment`: output GitHub Markdown summary.
- Implement embedded demo server `src/demo/demo_server.ts` with toggleable mutations to test SnapDiff end-to-end immediately.

### Phase 8: Verification and Documentation
- Run automated unit and integration tests across diffing, masking, and server routes.
- Validate end-to-end capture, diff detection, web studio interaction, and baseline approval.
- Finalize documentation files (`README.md`, `ARCHITECTURE.md`, `CLI_REFERENCE.md`, `CONFIGURATION.md`, `CI_INTEGRATION.md`).
