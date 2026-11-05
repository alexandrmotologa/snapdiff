import fastify, { type FastifyInstance } from 'fastify';

export async function createDemoServer(): Promise<FastifyInstance> {
  const app = fastify({ logger: false });

  // Home Page
  app.get('/', async (req, reply) => {
    const query = req.query as { mutate?: string };
    const isMutated = query.mutate === 'true' || query.mutate === '1';

    const headerBg = isMutated ? 'background: #4f46e5;' : 'background: #2563eb;';
    const heroPadding = isMutated ? 'padding: 80px 24px;' : 'padding: 60px 24px;';
    const buttonText = isMutated ? 'Get Started Now &rarr;' : 'Get Started Free';
    const buttonBg = isMutated ? 'background: #e11d48;' : 'background: #0284c7;';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Cloud Platform</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    header { ${headerBg} color: white; padding: 18px 32px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 20px; font-weight: 700; }
    nav a { color: #e2e8f0; margin-left: 20px; text-decoration: none; font-size: 14px; }
    .hero { ${heroPadding} text-align: center; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 40px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em; }
    p { font-size: 18px; color: #94a3b8; margin-bottom: 32px; line-height: 1.6; }
    .btn { ${buttonBg} color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 40px auto; padding: 0 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
    .card h3 { font-size: 18px; margin-bottom: 8px; color: #38bdf8; }
    .timestamp { font-size: 12px; color: #64748b; margin-top: 20px; display: inline-block; }
  </style>
</head>
<body>
  <header>
    <div class="logo">Acme Cloud</div>
    <nav>
      <a href="/">Overview</a>
      <a href="/pricing">Pricing</a>
      <a href="/docs">Docs</a>
    </nav>
  </header>
  <div class="hero">
    <h1>Deploy modern applications with zero configuration.</h1>
    <p>Fast, resilient cloud primitives designed for global developer teams. High throughput, low latency edge delivery.</p>
    <a href="#" class="btn">${buttonText}</a>
    <div class="timestamp">Generated at ${new Date().toLocaleTimeString()}</div>
  </div>
  <div class="features">
    <div class="card">
      <h3>Edge Compute</h3>
      <p style="font-size: 14px; margin-bottom: 0;">Sub-10ms response times worldwide via 300+ edge PoPs.</p>
    </div>
    <div class="card">
      <h3>Secure Storage</h3>
      <p style="font-size: 14px; margin-bottom: 0;">Encrypted blob and relational databases with continuous replication.</p>
    </div>
    <div class="card">
      <h3>Observability</h3>
      <p style="font-size: 14px; margin-bottom: 0;">Instant request telemetry and distributed trace analysis.</p>
    </div>
  </div>
</body>
</html>`;

    reply.type('text/html').send(html);
  });

  // Pricing Page
  app.get('/pricing', async (req, reply) => {
    const query = req.query as { mutate?: string };
    const isMutated = query.mutate === 'true' || query.mutate === '1';

    const cardMargin = isMutated ? 'margin-top: 24px;' : 'margin-top: 0;';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acme Cloud - Pricing</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 48px 24px; }
    .header { text-align: center; margin-bottom: 48px; }
    h1 { font-size: 36px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 960px; margin: 0 auto; }
    .plan { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; ${cardMargin} }
    .plan-name { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .price { font-size: 32px; font-weight: 800; color: #38bdf8; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Simple, Predictable Pricing</h1>
    <p style="color: #94a3b8;">Choose the tier that matches your workflow.</p>
  </div>
  <div class="grid" id="pricing-grid">
    <div class="plan">
      <div class="plan-name">Starter</div>
      <div class="price">$0/mo</div>
      <p style="color: #94a3b8; font-size: 14px;">Perfect for personal projects and experimentation.</p>
    </div>
    <div class="plan" style="border-color: #38bdf8;">
      <div class="plan-name">Pro</div>
      <div class="price">$29/mo</div>
      <p style="color: #94a3b8; font-size: 14px;">Unlimited team collaboration and dedicated edge nodes.</p>
    </div>
  </div>
</body>
</html>`;

    reply.type('text/html').send(html);
  });

  return app;
}
