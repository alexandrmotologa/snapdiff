import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { BaselineStore } from '../baseline/store.js';
import { registerRoutes } from './routes.js';
import type { ResolvedSnapDiffConfig } from '../types.js';

export interface ServerOptions {
  port?: number;
  host?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer(
  config: ResolvedSnapDiffConfig,
  _options: ServerOptions = {}
): Promise<FastifyInstance> {
  const app = fastify({ logger: false });
  const store = new BaselineStore(config.outputDir);

  await app.register(cors, {
    origin: true
  });

  // Register API endpoints
  registerRoutes(app, config, store);

  // Serve static UI assets if built
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  const localDistPath = path.resolve(process.cwd(), 'web/dist');
  const staticPath = fs.existsSync(webDistPath) ? webDistPath : (fs.existsSync(localDistPath) ? localDistPath : null);

  if (staticPath) {
    await app.register(fastifyStatic, {
      root: staticPath,
      prefix: '/'
    });

    // Fallback for SPA routing
    app.setNotFoundHandler(async (request, reply) => {
      if (!request.raw.url?.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not Found' });
    });
  }

  return app;
}

export async function startServer(
  config: ResolvedSnapDiffConfig,
  options: ServerOptions = {}
): Promise<{ server: FastifyInstance; url: string }> {
  const port = options.port ?? 9550;
  const host = options.host ?? 'localhost';
  const server = await createServer(config, options);

  await server.listen({ port, host });
  const url = `http://${host}:${port}`;
  return { server, url };
}
