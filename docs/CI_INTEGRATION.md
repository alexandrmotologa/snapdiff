# Continuous Integration (CI) Integration

This guide demonstrates how to integrate SnapDiff into automated GitHub Actions workflows as a visual regression quality gate.

## GitHub Actions Workflow

Create a workflow file in `.github/workflows/visual-tests.yml`:

```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]

jobs:
  snapdiff:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Start application
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:3000

      - name: Run SnapDiff visual regression tests
        id: snapdiff_test
        run: |
          npx snapdiff test --threshold 0.2% --json .snapdiff/results.json
        continue-on-error: true

      - name: Generate PR comment
        if: always()
        run: |
          npx snapdiff pr-comment --output .snapdiff/comment.md

      - name: Post comment to Pull Request
        if: always() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('.snapdiff/comment.md')) {
              const body = fs.readFileSync('.snapdiff/comment.md', 'utf8');
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }

      - name: Archive SnapDiff diff artifacts
        if: failure() || steps.snapdiff_test.outcome == 'failure'
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs
          path: .snapdiff/diff/

      - name: Fail workflow if tests failed
        if: steps.snapdiff_test.outcome == 'failure'
        run: exit 1
```

## Pull Request Comment Example

When tests complete, SnapDiff produces a markdown table summarizing results:

```markdown
### SnapDiff Visual Regression Report

| Target | Viewport | Diff % | Threshold | Status |
| :--- | :--- | :--- | :--- | :--- |
| **home-page** | Mobile (390px) | 0.04% | 0.20% | PASS |
| **home-page** | Tablet (768px) | 0.00% | 0.20% | PASS |
| **home-page** | Desktop (1440px) | 0.82% | 0.20% | FAIL |
| **pricing** | Desktop (1440px) | 0.00% | 0.20% | PASS |

Summary: 3 passed, 1 failed.
```

## Baseline Branch Strategy

SnapDiff stores baseline images in version control under `.snapdiff/baseline/`. When developers approve changes, they commit the updated `.snapdiff/baseline/` files into their feature branch. Once merged into `main`, the new baselines become the source of truth for subsequent pull requests.
