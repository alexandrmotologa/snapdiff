import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import { sendWebhookNotification } from '../src/reporter/webhook.js';
import type { RunManifest } from '../src/types.js';

describe('Webhook notifier', () => {
  let mockServer: FastifyInstance;
  let receivedPayload: unknown = null;
  let serverPort: number;

  beforeAll(async () => {
    mockServer = fastify({ logger: false });
    mockServer.post('/webhook', async (req, reply) => {
      receivedPayload = req.body;
      return reply.send({ ok: true });
    });
    await mockServer.listen({ port: 0, host: '127.0.0.1' });
    serverPort = (mockServer.server.address() as { port: number }).port;
  });

  afterAll(async () => {
    if (mockServer) {
      await mockServer.close();
    }
  });

  it('formats and transmits Discord webhook payloads', async () => {
    receivedPayload = null;
    const manifest: RunManifest = {
      runId: 'webhook-run',
      timestamp: new Date().toISOString(),
      summary: { total: 4, passed: 3, failed: 1, newBaselines: 0, durationMs: 250 },
      snapshots: []
    };

    const success = await sendWebhookNotification(manifest, {
      url: `http://127.0.0.1:${serverPort}/webhook`,
      type: 'discord',
      onFailureOnly: false
    });

    expect(success).toBe(true);
    expect(receivedPayload).toBeDefined();
    const discordBody = receivedPayload as { username: string; embeds: Array<{ title: string; color: number }> };
    expect(discordBody.username).toBe('SnapDiff CI');
    expect(discordBody.embeds[0].title).toContain('Visual Regressions Detected');
    expect(discordBody.embeds[0].color).toBe(0xf43f5e); // Red
  });

  it('respects onFailureOnly flag when tests pass', async () => {
    receivedPayload = null;
    const manifest: RunManifest = {
      runId: 'passing-run',
      timestamp: new Date().toISOString(),
      summary: { total: 2, passed: 2, failed: 0, newBaselines: 0, durationMs: 120 },
      snapshots: []
    };

    const dispatched = await sendWebhookNotification(manifest, {
      url: `http://127.0.0.1:${serverPort}/webhook`,
      onFailureOnly: true
    });

    expect(dispatched).toBe(false);
    expect(receivedPayload).toBeNull();
  });
});
