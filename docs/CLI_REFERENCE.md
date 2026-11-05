# SnapDiff CLI Reference

SnapDiff provides a command-line interface for capturing snapshots, running regression tests, launching the review studio, and managing baselines.

## Command Overview

```
snapdiff <command> [options]
```

### Commands

- `snapdiff init`: Initialize a starter `snapdiff.config.json` configuration file.
- `snapdiff capture`: Capture screenshots and save directly as approved baselines.
- `snapdiff test`: Capture current snapshots, compare against baselines, and evaluate diff threshold.
- `snapdiff review`: Start the local Fastify review studio web server.
- `snapdiff approve`: Promote current snapshots to baselines without opening the browser.
- `snapdiff rollback`: Restore an older baseline snapshot from the history archive.
- `snapdiff report`: Export a self-contained HTML report of the latest test run.
- `snapdiff pr-comment`: Output a markdown table suitable for posting to a GitHub Pull Request.
- `snapdiff demo-site`: Start an embedded demo website with toggleable UI mutations.

---

### `snapdiff init`

Scaffolds a `snapdiff.config.json` configuration file in the current working directory.

```bash
npx snapdiff init [--force]
```

---

### `snapdiff capture`

Captures screenshots of configured URLs and saves them directly to `.snapdiff/baseline/`.

```bash
npx snapdiff capture [options]
```

**Options:**
- `-u, --url <url>`: Override or specify a single target URL.
- `-c, --config <path>`: Path to configuration file.
- `-v, --viewports <items>`: Comma-separated list of viewports (for example: `mobile,desktop`).
- `--color-schemes <schemes>`: Comma-separated list of color schemes (`light,dark`).
- `--concurrency <number>`: Number of parallel worker captures (default: `4`).
- `--selector <selector>`: Capture only a specific CSS element instead of full page.

---

### `snapdiff test`

Captures current screenshots, runs pixel comparisons against the baseline, and evaluates the results against the failure threshold.

```bash
npx snapdiff test [options]
```

**Options:**
- `-t, --threshold <ratio>`: Maximum allowable pixel mismatch percentage before failing the test (default: `0.2%` or `0.002`).
- `-c, --config <path>`: Path to configuration file.
- `-u, --url <url>`: Test only a specific URL.
- `-v, --viewports <items>`: Test only specified viewports.
- `--color-schemes <schemes>`: Test across specified color schemes (`light,dark`).
- `--concurrency <number>`: Number of parallel worker comparisons (default: `4`).
- `--webhook <url>`: Send results notification to Slack or Discord webhook.
- `--html <path>`: Generate an HTML report at the specified file path.
- `--json <path>`: Save test results as a JSON file.
- `--update-baseline`: Automatically update baselines for matching runs.

**Exit Codes:**
- `0`: All tests passed within the threshold.
- `1`: One or more snapshots exceeded the threshold.
- `2`: Configuration or runtime error.

---

### `snapdiff review`

Launches the Fastify API server and serves the React 19 visual review studio.

```bash
npx snapdiff review [options]
```

**Options:**
- `-p, --port <number>`: Port number for the review server (default: `9550`).
- `-h, --host <host>`: Host address (default: `localhost`).
- `--no-open`: Do not automatically open the browser.

---

### `snapdiff approve`

Promotes current snapshots to baselines from the command line.

```bash
npx snapdiff approve [options]
```

**Options:**
- `--all`: Approve all changed snapshots in the latest run.
- `--target <name>`: Target name.
- `--viewport <name>`: Viewport name.
- `--dark`: Target dark mode baseline.

---

### `snapdiff rollback`

Restores an archived baseline from history.

```bash
npx snapdiff rollback --target <name> --viewport <name> [--dark]
```

---

### `snapdiff report`

Generates a standalone single-file HTML report with embedded screenshots.

```bash
npx snapdiff report [options]
```

**Options:**
- `-o, --output <path>`: Output HTML file path (default: `.snapdiff/reports/index.html`).
- `--open`: Automatically open the generated report in the default browser.

---

### `snapdiff pr-comment`

Formats the latest test run results as a GitHub Markdown comment for CI workflows.

```bash
npx snapdiff pr-comment [options]
```

**Options:**
- `-o, --output <path>`: Write the markdown output to a file instead of stdout.
