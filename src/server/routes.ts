import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BaselineStore } from '../baseline/store.js';
import { approveAllSnapshots, approveSnapshot } from '../baseline/approver.js';
import { SnapDiffEngine } from '../runner.js';
import type { ColorScheme, ResolvedSnapDiffConfig } from '../types.js';

interface ImageParams {
  type: 'baseline' | 'current' | 'diff';
  targetName: string;
  viewportName: string;
}

interface ImageQuery {
  colorScheme?: ColorScheme;
}

interface ApproveBody {
  targetName: string;
  viewportName: string;
  colorScheme?: ColorScheme;
}

interface RollbackBody {
  targetName: string;
  viewportName: string;
  historyFilePath: string;
  colorScheme?: ColorScheme;
}

interface AddMaskBody {
  targetName: string;
  selector: string;
}

export function registerRoutes(
  server: FastifyInstance,
  config: ResolvedSnapDiffConfig,
  store: BaselineStore
): void {
  // Get latest run manifest
  server.get('/api/manifest', async (_req: FastifyRequest, reply: FastifyReply) => {
    const manifest = store.loadManifest();
    if (!manifest) {
      return reply.status(404).send({ error: 'No test runs found. Run snapdiff test or snapdiff capture first.' });
    }
    return reply.send(manifest);
  });

  // Get active configuration
  server.get('/api/config', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      threshold: config.threshold,
      viewports: config.viewports,
      colorSchemes: config.colorSchemes,
      targets: config.targets,
      outputDir: config.outputDir,
      concurrency: config.concurrency
    });
  });

  // Serve snapshot image buffers
  server.get('/api/images/:type/:targetName/:viewportName', async (
    req: FastifyRequest<{ Params: ImageParams; Querystring: ImageQuery }>,
    reply: FastifyReply
  ) => {
    const { type, targetName, viewportName } = req.params;
    const colorScheme = req.query.colorScheme ?? 'light';

    let buffer: Buffer | null = null;
    if (type === 'baseline') {
      buffer = await store.readBaseline(targetName, viewportName, colorScheme);
    } else if (type === 'current') {
      buffer = await store.readCurrent(targetName, viewportName, colorScheme);
    } else if (type === 'diff') {
      buffer = await store.readDiff(targetName, viewportName, colorScheme);
    }

    if (!buffer) {
      return reply.status(404).send({ error: `Image not found for ${type}/${targetName}/${viewportName} [${colorScheme}]` });
    }

    reply.header('Content-Type', 'image/png');
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return reply.send(buffer);
  });

  // Approve a single snapshot
  server.post('/api/approve', async (
    req: FastifyRequest<{ Body: ApproveBody }>,
    reply: FastifyReply
  ) => {
    const { targetName, viewportName, colorScheme = 'light' } = req.body || {};
    if (!targetName || !viewportName) {
      return reply.status(400).send({ error: 'targetName and viewportName are required' });
    }

    try {
      await approveSnapshot(store, targetName, viewportName, colorScheme);
      const updatedManifest = store.loadManifest();
      return reply.send({ success: true, manifest: updatedManifest });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Approve all failed / new snapshots
  server.post('/api/approve-all', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await approveAllSnapshots(store);
      const updatedManifest = store.loadManifest();
      return reply.send({ ...result, manifest: updatedManifest });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Trigger re-run from web UI
  server.post('/api/run', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const engine = new SnapDiffEngine(config);
      const manifest = await engine.runTests();
      return reply.send({ success: true, manifest });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // List history of snapshots for rollback
  server.get('/api/history/:targetName/:viewportName', async (
    req: FastifyRequest<{ Params: { targetName: string; viewportName: string }; Querystring: ImageQuery }>,
    reply: FastifyReply
  ) => {
    const { targetName, viewportName } = req.params;
    const colorScheme = req.query.colorScheme ?? 'light';
    const history = await store.listHistory(targetName, viewportName, colorScheme);
    return reply.send({ history });
  });

  // Rollback baseline to historical version
  server.post('/api/history/rollback', async (
    req: FastifyRequest<{ Body: RollbackBody }>,
    reply: FastifyReply
  ) => {
    const { targetName, viewportName, historyFilePath, colorScheme = 'light' } = req.body || {};
    if (!targetName || !viewportName || !historyFilePath) {
      return reply.status(400).send({ error: 'targetName, viewportName, and historyFilePath are required' });
    }

    try {
      await store.rollbackBaseline(targetName, viewportName, historyFilePath, colorScheme);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Add mask selector to target in snapdiff.config.json
  server.post('/api/masks', async (
    req: FastifyRequest<{ Body: AddMaskBody }>,
    reply: FastifyReply
  ) => {
    const { targetName, selector } = req.body || {};
    if (!targetName || !selector) {
      return reply.status(400).send({ error: 'targetName and selector are required' });
    }

    const configPath = path.resolve(process.cwd(), 'snapdiff.config.json');
    if (!fs.existsSync(configPath)) {
      return reply.status(404).send({ error: 'snapdiff.config.json not found to update' });
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const json = JSON.parse(content);
      const target = (json.targets || []).find((t: { name: string }) => t.name === targetName);
      if (target) {
        target.masks = target.masks || [];
        if (!target.masks.includes(selector)) {
          target.masks.push(selector);
        }
      } else {
        json.targets = json.targets || [];
        json.targets.push({ name: targetName, masks: [selector] });
      }
      fs.writeFileSync(configPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      return reply.send({ success: true, masks: target?.masks });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
}
