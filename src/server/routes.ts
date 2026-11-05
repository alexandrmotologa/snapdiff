import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BaselineStore } from '../baseline/store.js';
import { approveAllSnapshots, approveSnapshot } from '../baseline/approver.js';
import { SnapDiffEngine } from '../runner.js';
import type { ResolvedSnapDiffConfig } from '../types.js';

interface ImageParams {
  type: 'baseline' | 'current' | 'diff';
  targetName: string;
  viewportName: string;
}

interface ApproveBody {
  targetName: string;
  viewportName: string;
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
      targets: config.targets,
      outputDir: config.outputDir
    });
  });

  // Serve snapshot image buffers
  server.get('/api/images/:type/:targetName/:viewportName', async (
    req: FastifyRequest<{ Params: ImageParams }>,
    reply: FastifyReply
  ) => {
    const { type, targetName, viewportName } = req.params;

    let buffer: Buffer | null = null;
    if (type === 'baseline') {
      buffer = await store.readBaseline(targetName, viewportName);
    } else if (type === 'current') {
      buffer = await store.readCurrent(targetName, viewportName);
    } else if (type === 'diff') {
      buffer = await store.readDiff(targetName, viewportName);
    }

    if (!buffer) {
      return reply.status(404).send({ error: `Image not found for ${type}/${targetName}/${viewportName}` });
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
    const { targetName, viewportName } = req.body || {};
    if (!targetName || !viewportName) {
      return reply.status(400).send({ error: 'targetName and viewportName are required' });
    }

    try {
      await approveSnapshot(store, targetName, viewportName);
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
}
