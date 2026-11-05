import fs from 'node:fs';
import path from 'node:path';
import type { RunManifest } from '../types.js';
import { BaselineStore } from '../baseline/store.js';

export async function generateHTMLReport(
  manifest: RunManifest,
  outputDir = '.snapdiff',
  cwd = process.cwd()
): Promise<string> {
  const store = new BaselineStore(outputDir, cwd);

  // Read images and convert to base64
  const cardsHtml = await Promise.all(
    manifest.snapshots.map(async (snap) => {
      const baselineBuf = await store.readBaseline(snap.targetName, snap.viewportName);
      const currentBuf = await store.readCurrent(snap.targetName, snap.viewportName);
      const diffBuf = await store.readDiff(snap.targetName, snap.viewportName);

      const baselineB64 = baselineBuf ? `data:image/png;base64,${baselineBuf.toString('base64')}` : null;
      const currentB64 = currentBuf ? `data:image/png;base64,${currentBuf.toString('base64')}` : null;
      const diffB64 = diffBuf ? `data:image/png;base64,${diffBuf.toString('base64')}` : null;

      const badgeColor =
        snap.status === 'passed'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : snap.status === 'failed'
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

      const diffText = snap.metrics ? `${snap.metrics.diffPercentage.toFixed(2)}%` : '0.00%';

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <h3>${snap.targetName}</h3>
              <p class="meta">${snap.url} &bull; ${snap.viewportName} (${snap.viewport.width}x${snap.viewport.height})</p>
            </div>
            <div class="badges">
              <span class="badge ${badgeColor}">${snap.status.toUpperCase()}</span>
              <span class="badge badge-diff">Diff: ${diffText}</span>
            </div>
          </div>
          <div class="image-grid">
            <div class="image-box">
              <div class="image-label">Baseline</div>
              ${baselineB64 ? `<img src="${baselineB64}" alt="Baseline" />` : '<div class="empty">No baseline</div>'}
            </div>
            <div class="image-box">
              <div class="image-label">Current</div>
              ${currentB64 ? `<img src="${currentB64}" alt="Current" />` : '<div class="empty">No current</div>'}
            </div>
            <div class="image-box">
              <div class="image-label">Difference Mask</div>
              ${diffB64 ? `<img src="${diffB64}" alt="Diff" />` : '<div class="empty">No differences</div>'}
            </div>
          </div>
        </div>
      `;
    })
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SnapDiff Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header { margin-bottom: 32px; border-bottom: 1px solid #334155; padding-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; color: #38bdf8; margin-bottom: 8px; }
    .stats { display: flex; gap: 24px; margin-top: 16px; }
    .stat-box { background: #1e293b; padding: 12px 20px; border-radius: 8px; border: 1px solid #334155; }
    .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
    .stat-val { font-size: 20px; font-weight: 700; color: #f8fafc; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { font-size: 16px; font-weight: 600; color: #f1f5f9; }
    .meta { font-size: 13px; color: #94a3b8; margin-top: 2px; }
    .badges { display: flex; gap: 8px; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid; }
    .bg-emerald-500\\/10 { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }
    .bg-rose-500\\/10 { background: rgba(244, 63, 94, 0.1); color: #fb7185; border-color: rgba(244, 63, 94, 0.2); }
    .bg-cyan-500\\/10 { background: rgba(6, 182, 212, 0.1); color: #22d3ee; border-color: rgba(6, 182, 212, 0.2); }
    .badge-diff { background: #334155; color: #cbd5e1; border-color: #475569; }
    .image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px; background: #0b1120; }
    .image-box { background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; display: flex; flex-direction: column; }
    .image-label { font-size: 12px; font-weight: 600; color: #94a3b8; padding: 8px 12px; background: #1e293b; border-bottom: 1px solid #334155; }
    .image-box img { width: 100%; height: auto; display: block; object-fit: contain; }
    .empty { padding: 48px; text-align: center; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>SnapDiff Test Report</h1>
      <p class="meta">Run: ${manifest.runId} &bull; Generated: ${new Date(manifest.timestamp).toLocaleString()}</p>
      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Total Checks</div>
          <div class="stat-val">${manifest.summary.total}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Passed</div>
          <div class="stat-val" style="color: #34d399;">${manifest.summary.passed}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Failed</div>
          <div class="stat-val" style="color: #fb7185;">${manifest.summary.failed}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Duration</div>
          <div class="stat-val">${manifest.summary.durationMs}ms</div>
        </div>
      </div>
    </header>
    <main>
      ${cardsHtml.join('\n')}
    </main>
  </div>
</body>
</html>`;

  return html;
}

export async function saveHTMLReport(
  manifest: RunManifest,
  outputPath: string,
  outputDir = '.snapdiff',
  cwd = process.cwd()
): Promise<string> {
  const html = await generateHTMLReport(manifest, outputDir, cwd);
  const resolved = path.resolve(cwd, outputPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await fs.promises.writeFile(resolved, html, 'utf8');
  return resolved;
}
