import pc from 'picocolors';
import type { RunManifest } from '../types.js';

export function printTerminalReport(manifest: RunManifest): void {
  console.log('\n' + pc.bold(pc.cyan('  SnapDiff Visual Regression Report')) + '\n');

  const headers = ['Status', 'Target', 'Viewport', 'Diff %', 'Threshold', 'Duration'];
  const colWidths = [10, 22, 18, 12, 12, 10];

  const headerLine = headers
    .map((h, i) => h.padEnd(colWidths[i]))
    .join(' ');
  console.log('  ' + pc.dim(headerLine));
  console.log('  ' + pc.dim('-'.repeat(headerLine.length)));

  for (const snap of manifest.snapshots) {
    let statusText: string;
    if (snap.status === 'passed') {
      statusText = pc.green('✓ PASS');
    } else if (snap.status === 'failed') {
      statusText = pc.red('✗ FAIL');
    } else if (snap.status === 'new_baseline') {
      statusText = pc.cyan('+ NEW');
    } else {
      statusText = pc.yellow('? MISSING');
    }

    const diffStr = snap.metrics ? `${snap.metrics.diffPercentage.toFixed(2)}%` : '-';
    const threshStr = snap.metrics ? `${(snap.metrics.threshold * 100).toFixed(2)}%` : '-';
    const durationStr = snap.metrics ? `${snap.metrics.durationMs}ms` : '-';

    const row = [
      statusText.padEnd(colWidths[0] + 9), // Compensate for ANSI codes
      snap.targetName.slice(0, 20).padEnd(colWidths[1]),
      snap.viewportName.slice(0, 16).padEnd(colWidths[2]),
      diffStr.padEnd(colWidths[3]),
      threshStr.padEnd(colWidths[4]),
      durationStr.padEnd(colWidths[5])
    ].join(' ');

    console.log('  ' + row);
  }

  console.log('  ' + pc.dim('-'.repeat(headerLine.length)));

  const { total, passed, failed, newBaselines, durationMs } = manifest.summary;
  const summaryParts = [
    pc.bold(`Total: ${total}`),
    pc.green(`Passed: ${passed}`),
    failed > 0 ? pc.bold(pc.red(`Failed: ${failed}`)) : pc.dim(`Failed: 0`),
    newBaselines > 0 ? pc.cyan(`New Baselines: ${newBaselines}`) : null,
    pc.dim(`Duration: ${durationMs}ms`)
  ].filter(Boolean);

  console.log('\n  ' + summaryParts.join(' | ') + '\n');
}
