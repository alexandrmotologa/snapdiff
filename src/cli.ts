#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import open from 'open';
import pc from 'picocolors';
import { loadConfig, parseThreshold } from './config.js';
import { SnapDiffEngine } from './runner.js';
import { BaselineStore } from './baseline/store.js';
import { approveAllSnapshots, approveSnapshot } from './baseline/approver.js';
import { startServer } from './server/api.js';
import { printTerminalReport } from './reporter/terminal_table.js';
import { generatePRComment } from './reporter/pr_commenter.js';
import { saveHTMLReport } from './reporter/html_report.js';
import { createDemoServer } from './demo/demo_server.js';
import type { TargetConfig } from './types.js';

const program = new Command();

program
  .name('snapdiff')
  .description('Self-hosted visual regression testing engine with WebAssembly diffing and review studio')
  .version('1.0.0');

/**
 * Command: init
 */
program
  .command('init')
  .description('Initialize a starter snapdiff.config.json in the current directory')
  .option('-f, --force', 'Overwrite existing configuration file')
  .action(async (options) => {
    const targetFile = path.resolve(process.cwd(), 'snapdiff.config.json');
    if (fs.existsSync(targetFile) && !options.force) {
      console.log(pc.yellow('snapdiff.config.json already exists. Use --force to overwrite.'));
      return;
    }

    const sampleConfig = {
      $schema: 'https://raw.githubusercontent.com/alexandrmotologa/snapdiff/main/schema.json',
      threshold: 0.002,
      diffColor: [255, 0, 255],
      viewports: {
        mobile: { width: 390, height: 844, deviceScaleFactor: 2 },
        tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
        desktop: { width: 1440, height: 900, deviceScaleFactor: 2 }
      },
      targets: [
        {
          name: 'home-page',
          url: 'http://localhost:3000',
          masks: ['.timestamp', '[data-dynamic]'],
          wait: {
            networkIdle: true,
            fontsReady: true,
            delay: 200
          }
        }
      ],
      outputDir: '.snapdiff'
    };

    fs.writeFileSync(targetFile, JSON.stringify(sampleConfig, null, 2) + '\n', 'utf8');
    console.log(pc.green(`✓ Created ${targetFile}`));
  });

/**
 * Command: capture
 */
program
  .command('capture')
  .description('Capture screenshots and save directly as approved baselines')
  .option('-u, --url <url>', 'Target URL to capture')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-v, --viewports <items>', 'Comma-separated viewports to capture (e.g. mobile,desktop)')
  .option('--selector <selector>', 'CSS selector of component to capture')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);

      let targets: TargetConfig[] | undefined;
      if (options.url) {
        targets = [
          {
            name: 'target-url',
            url: options.url,
            selector: options.selector,
            viewports: options.viewports ? options.viewports.split(',').map((s: string) => s.trim()) : undefined
          }
        ];
      }

      console.log(pc.cyan('Capturing baseline snapshots...'));
      const engine = new SnapDiffEngine(config);
      const manifest = await engine.captureBaselines(targets);

      printTerminalReport(manifest);
      console.log(pc.green(`✓ Successfully recorded ${manifest.summary.total} baseline snapshots.`));
    } catch (err) {
      console.error(pc.red(`Error capturing baselines: ${(err as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Command: test
 */
program
  .command('test')
  .description('Capture current snapshots, compare against baselines, and evaluate diff threshold')
  .option('-t, --threshold <value>', 'Diff threshold ratio or percentage (e.g. 0.2% or 0.002)')
  .option('-u, --url <url>', 'Test a single URL')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-v, --viewports <items>', 'Comma-separated viewports')
  .option('--html <path>', 'Generate standalone HTML report at specified path')
  .option('--json <path>', 'Output JSON results to specified file')
  .option('--update-baseline', 'Automatically update baselines')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);
      const threshold = options.threshold ? parseThreshold(options.threshold) : config.threshold;

      let targets: TargetConfig[] | undefined;
      if (options.url) {
        targets = [
          {
            name: 'target-url',
            url: options.url,
            viewports: options.viewports ? options.viewports.split(',').map((s: string) => s.trim()) : undefined
          }
        ];
      }

      console.log(pc.cyan(`Running visual regression tests (Threshold: ${(threshold * 100).toFixed(2)}%)...`));
      const engine = new SnapDiffEngine(config);
      const manifest = await engine.runTests({
        threshold,
        targets,
        updateBaseline: options.updateBaseline
      });

      printTerminalReport(manifest);

      if (options.html) {
        const outPath = await saveHTMLReport(manifest, options.html, config.outputDir);
        console.log(pc.dim(`HTML report saved to ${outPath}`));
      }

      if (options.json) {
        const jsonPath = path.resolve(process.cwd(), options.json);
        fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
        fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(pc.dim(`JSON report saved to ${jsonPath}`));
      }

      if (manifest.summary.failed > 0) {
        console.error(pc.red(`\nVisual regression tests failed: ${manifest.summary.failed} snapshot(s) exceeded threshold.`));
        process.exit(1);
      }

      console.log(pc.green('\n✓ All visual regression checks passed.'));
    } catch (err) {
      console.error(pc.red(`Error executing tests: ${(err as Error).message}`));
      process.exit(2);
    }
  });

/**
 * Command: review
 */
program
  .command('review')
  .description('Launch the local visual review studio in the browser')
  .option('-p, --port <number>', 'Server port', '9550')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);
      const port = Number.parseInt(options.port, 10);
      const host = options.host;

      console.log(pc.cyan(`Starting SnapDiff Review Studio on port ${port}...`));
      const { url } = await startServer(config, { port, host });

      console.log(pc.green(`✓ Review Studio listening at ${url}`));
      console.log(pc.dim('Press Ctrl+C to stop the server.'));

      if (options.open !== false) {
        await open(url);
      }
    } catch (err) {
      console.error(pc.red(`Failed to launch review studio: ${(err as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Command: approve
 */
program
  .command('approve')
  .description('Promote current snapshots to baselines')
  .option('--all', 'Approve all failed/new snapshots in the latest run')
  .option('--target <name>', 'Target name')
  .option('--viewport <name>', 'Viewport name')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);
      const store = new BaselineStore(config.outputDir);

      if (options.all) {
        const res = await approveAllSnapshots(store);
        if (res.success) {
          console.log(pc.green(`✓ Successfully approved ${res.approvedCount} snapshots as new baselines.`));
        } else {
          console.error(pc.red(`Approval failed: ${res.error}`));
        }
        return;
      }

      if (!options.target || !options.viewport) {
        console.error(pc.yellow('Please specify either --all or both --target <name> and --viewport <name>'));
        process.exit(1);
      }

      await approveSnapshot(store, options.target, options.viewport);
      console.log(pc.green(`✓ Approved baseline for ${options.target} [${options.viewport}]`));
    } catch (err) {
      console.error(pc.red(`Approval failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Command: report
 */
program
  .command('report')
  .description('Generate standalone HTML report from the latest test run')
  .option('-o, --output <path>', 'Output HTML path', '.snapdiff/reports/index.html')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--open', 'Open report in browser after generation')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);
      const store = new BaselineStore(config.outputDir);
      const manifest = store.loadManifest();

      if (!manifest) {
        console.error(pc.yellow('No test manifest found. Run snapdiff test or capture first.'));
        process.exit(1);
      }

      const outPath = await saveHTMLReport(manifest, options.output, config.outputDir);
      console.log(pc.green(`✓ Report generated at ${outPath}`));

      if (options.open) {
        await open(outPath);
      }
    } catch (err) {
      console.error(pc.red(`Failed to generate report: ${(err as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Command: pr-comment
 */
program
  .command('pr-comment')
  .description('Output GitHub Markdown comment summarizing latest test run')
  .option('-o, --output <path>', 'Write comment to file instead of stdout')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      const config = await loadConfig(process.cwd(), options.config);
      const store = new BaselineStore(config.outputDir);
      const manifest = store.loadManifest();

      if (!manifest) {
        console.error(pc.yellow('No test manifest found.'));
        process.exit(1);
      }

      const comment = generatePRComment(manifest);

      if (options.output) {
        const outPath = path.resolve(process.cwd(), options.output);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, comment, 'utf8');
        console.log(pc.green(`✓ Written PR comment to ${outPath}`));
      } else {
        console.log(comment);
      }
    } catch (err) {
      console.error(pc.red(`Error generating PR comment: ${(err as Error).message}`));
      process.exit(1);
    }
  });

/**
 * Command: demo-site
 */
program
  .command('demo-site')
  .description('Start embedded fixture website to test SnapDiff visual regressions')
  .option('-p, --port <number>', 'Server port', '4000')
  .action(async (options) => {
    try {
      const port = Number.parseInt(options.port, 10);
      const app = await createDemoServer();
      await app.listen({ port, host: 'localhost' });
      console.log(pc.green(`✓ Demo site running at http://localhost:${port}`));
      console.log(pc.dim('Use query parameter ?mutate=1 to trigger visual regressions.'));
      console.log(pc.dim('Press Ctrl+C to stop the demo server.'));
    } catch (err) {
      console.error(pc.red(`Failed to start demo server: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
