import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import { BrowserRunner } from '../src/capture/browser_runner.js';

describe('Pre-capture actions and authentication injection', () => {
  let app: FastifyInstance;
  let serverPort: number;

  beforeAll(async () => {
    app = fastify({ logger: false });

    app.get('/interactive', async (req, reply) => {
      const html = `<!DOCTYPE html>
<html>
<head><title>Interactive Test</title></head>
<body>
  <div id="initial-text">Initial State</div>
  <button id="toggle-btn" onclick="document.getElementById('secret-box').style.display = 'block'">Open Modal</button>
  <div id="secret-box" style="display: none; background: #22c55e; color: white; padding: 20px;">Secret Modal Revealed</div>
  <input id="name-input" type="text" value="" />
</body>
</html>`;
      reply.type('text/html').send(html);
    });

    app.get('/auth-check', async (req, reply) => {
      const authHeader = req.headers['authorization'] || 'none';
      const html = `<!DOCTYPE html>
<html>
<body>
  <div id="auth-status">${authHeader}</div>
</body>
</html>`;
      reply.type('text/html').send(html);
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    serverPort = (app.server.address() as { port: number }).port;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('executes clicks and waits to reveal hidden interactive states', async () => {
    const runner = new BrowserRunner(true);
    await runner.init();

    try {
      const result = await runner.capture(`http://127.0.0.1:${serverPort}/interactive`, {
        viewport: { width: 800, height: 600 },
        actions: [
          { type: 'click', selector: '#toggle-btn' },
          { type: 'wait', selector: '#secret-box' },
          { type: 'fill', selector: '#name-input', value: 'Alex' }
        ]
      });

      expect(result.buffer).toBeDefined();
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    } finally {
      await runner.close();
    }
  });

  it('injects custom authentication headers', async () => {
    const runner = new BrowserRunner(true);
    await runner.init();

    try {
      const result = await runner.capture(`http://127.0.0.1:${serverPort}/auth-check`, {
        viewport: { width: 800, height: 600 },
        auth: {
          headers: {
            Authorization: 'Bearer test-secret-token'
          }
        }
      });

      expect(result.buffer).toBeDefined();
    } finally {
      await runner.close();
    }
  });
});
