import type { RunManifest, WebhookConfig } from '../types.js';

export async function sendWebhookNotification(
  manifest: RunManifest,
  config?: WebhookConfig
): Promise<boolean> {
  if (!config?.url) return false;

  // Check if we should only send on failure
  if (config.onFailureOnly && manifest.summary.failed === 0) {
    return false;
  }

  const { total, passed, failed, newBaselines } = manifest.summary;
  const isPassing = failed === 0;

  try {
    let payload: Record<string, unknown>;

    if (config.type === 'discord') {
      payload = {
        username: 'SnapDiff CI',
        embeds: [
          {
            title: isPassing ? '✅ SnapDiff: All Visual Checks Passed' : '🚨 SnapDiff: Visual Regressions Detected',
            color: isPassing ? 0x10b981 : 0xf43f5e,
            description: `Tested **${total}** visual snapshots.`,
            fields: [
              { name: 'Passed', value: `${passed}`, inline: true },
              { name: 'Failed', value: `${failed}`, inline: true },
              { name: 'New Baselines', value: `${newBaselines}`, inline: true },
              ...(manifest.git?.commit
                ? [{ name: 'Commit', value: `\`${manifest.git.commit}\` (${manifest.git.branch || 'main'})`, inline: false }]
                : [])
            ],
            timestamp: new Date().toISOString()
          }
        ]
      };
    } else if (config.type === 'slack') {
      payload = {
        text: isPassing
          ? `*SnapDiff*: All ${total} visual checks passed! :white_check_mark:`
          : `*SnapDiff Alert*: ${failed} of ${total} visual checks failed! :rotating_light:`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: isPassing
                ? `*SnapDiff: All ${total} visual checks passed!* :white_check_mark:`
                : `*SnapDiff: ${failed} visual regressions detected!* :rotating_light:`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Passed:* ${passed} | *Failed:* ${failed} | *New:* ${newBaselines}${
                  manifest.git?.commit ? ` | *Commit:* \`${manifest.git.commit}\`` : ''
                }`
              }
            ]
          }
        ]
      };
    } else {
      payload = {
        event: 'snapdiff_test_completed',
        manifest
      };
    }

    const res = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch {
    return false;
  }
}
