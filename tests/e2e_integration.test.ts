import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { createDemoServer } from '../src/demo/demo_server.js';
import { SnapDiffEngine } from '../src/runner.js';
import { generatePRComment } from '../src/reporter/pr_commenter.js';
import { saveHTMLReport } from '../src/reporter/html_report.js';
import { approveAllSnapshots } from '../src/baseline/approver.js';
import type { ResolvedSnapDiffConfig } from '../src/types.js';

describe('SnapDiff End-to-End Visual Regression Suite', () => {
  let demoServer: FastifyInstance;
  let demoPort: number;
  let baseUrl: string;
  const testOutputDir = '.snapdiff_e2e';
  const fullOutputDir = path.resolve(process.cwd(), testOutputDir);

  beforeAll(async () => {
    if (fs.existsSync(fullOutputDir)) {
      fs.rmSync(fullOutputDir, { recursive: true, force: true });
    }

    demoServer = await createDemoServer();
    const address = await demoServer.listen({ port: 0, host: '127.0.0.1' });
    demoPort = (demoServer.server.address() as { port: number }).port;
    baseUrl = `http://127.0.0.1:${demoPort}`;
  }, 30000);

  afterAll(async () => {
    if (demoServer) {
      await demoServer.close();
    }
    if (fs.existsSync(fullOutputDir)) {
      fs.rmSync(fullOutputDir, { recursive: true, force: true });
    }
  });

  it('captures baselines and detects visual regressions accurately', async () => {
    const config: ResolvedSnapDiffConfig = {
      threshold: 0.002,
      diffColor: [255, 0, 255],
      viewports: {
        mobile: { width: 390, height: 600, deviceScaleFactor: 1 },
        desktop: { width: 1024, height: 768, deviceScaleFactor: 1 }
      },
      targets: [
        {
          name: 'acme-home',
          url: `${baseUrl}/`,
          masks: ['.timestamp'], // Dynamic timestamp masked
          wait: { delay: 100 }
        }
      ],
      outputDir: testOutputDir,
      headless: true,
      stabilize: true
    };

    const engine = new SnapDiffEngine(config);

    // 1. Capture initial baseline
    const initialManifest = await engine.captureBaselines();
    expect(initialManifest.summary.total).toBe(2); // mobile + desktop
    expect(initialManifest.summary.passed).toBe(2);
    expect(engine.store.hasBaseline('acme-home', 'mobile')).toBe(true);
    expect(engine.store.hasBaseline('acme-home', 'desktop')).toBe(true);

    // 2. Run test against identical page -> Should PASS with 0% diff
    const passManifest = await engine.runTests();
    expect(passManifest.summary.failed).toBe(0);
    expect(passManifest.summary.passed).toBe(2);

    // 3. Run test against mutated page (?mutate=1) -> Should FAIL
    const mutatedTargets = [
      {
        name: 'acme-home',
        url: `${baseUrl}/?mutate=1`,
        masks: ['.timestamp'],
        wait: { delay: 100 }
      }
    ];

    const failManifest = await engine.runTests({ targets: mutatedTargets });
    expect(failManifest.summary.failed).toBeGreaterThan(0);

    const desktopSnap = failManifest.snapshots.find((s) => s.viewportName === 'desktop');
    expect(desktopSnap?.status).toBe('failed');
    expect(desktopSnap?.metrics?.diffPercentage).toBeGreaterThan(0.2); // Exceeds 0.2%
    expect(desktopSnap?.metrics?.boundingBox).toBeDefined();

    // 4. Verify Diff Image was created
    const diffBuf = await engine.store.readDiff('acme-home', 'desktop');
    expect(diffBuf).not.toBeNull();

    // 5. Generate PR Comment
    const prComment = generatePRComment(failManifest);
    expect(prComment).toContain('SnapDiff Visual Regression Report');
    expect(prComment).toContain('acme-home');
    expect(prComment).toContain('FAIL');

    // 6. Generate HTML report
    const htmlPath = path.join(fullOutputDir, 'report.html');
    await saveHTMLReport(failManifest, htmlPath, testOutputDir);
    expect(fs.existsSync(htmlPath)).toBe(true);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    expect(htmlContent).toContain('SnapDiff Test Report');
    expect(htmlContent).toContain('acme-home');

    // 7. Approve All Snapshots -> Should promote to baseline and pass
    const approveResult = await approveAllSnapshots(engine.store);
    expect(approveResult.success).toBe(true);
    expect(approveResult.approvedCount).toBeGreaterThan(0);

    const approvedManifest = engine.store.loadManifest();
    expect(approvedManifest?.summary.failed).toBe(0);
    expect(approvedManifest?.summary.passed).toBe(2);
  }, 60000);
});
