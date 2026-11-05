import type { RunManifest } from '../types.js';

/**
 * Formats visual regression test results as a GitHub Markdown comment.
 */
export function generatePRComment(manifest: RunManifest): string {
  const { total, passed, failed, newBaselines } = manifest.summary;
  const statusIcon = failed === 0 ? '✅' : '❌';

  let md = `### ${statusIcon} SnapDiff Visual Regression Report\n\n`;

  if (failed === 0) {
    md += `All **${total}** visual checks passed within acceptable thresholds.\n\n`;
  } else {
    md += `**${failed}** of **${total}** visual snapshots exceeded the difference threshold.\n\n`;
  }

  md += '| Target | Viewport | Diff % | Threshold | Status |\n';
  md += '| :--- | :--- | :--- | :--- | :--- |\n';

  for (const snap of manifest.snapshots) {
    let statusLabel = 'PASS';
    if (snap.status === 'failed') statusLabel = '🚨 FAIL';
    else if (snap.status === 'new_baseline') statusLabel = '✨ NEW';

    const diffStr = snap.metrics ? `${snap.metrics.diffPercentage.toFixed(2)}%` : '-';
    const threshStr = snap.metrics ? `${(snap.metrics.threshold * 100).toFixed(2)}%` : '-';

    md += `| **${snap.targetName}** | ${snap.viewportName} | ${diffStr} | ${threshStr} | ${statusLabel} |\n`;
  }

  md += '\n';
  md += `*Summary: ${passed} passed, ${failed} failed, ${newBaselines} new baselines.*\n`;

  if (manifest.git?.commit) {
    md += `*Tested commit: \`${manifest.git.commit}\` on branch \`${manifest.git.branch || 'main'}\`*\n`;
  }

  return md;
}
