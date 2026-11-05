import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import { createDemoServer } from '../dist/demo/demo_server.js';
import { SnapDiffEngine } from '../dist/runner.js';
import { startServer } from '../dist/server/api.js';
import { DEFAULT_CONFIG } from '../dist/config.js';

async function main() {
  const outputDir = path.resolve(process.cwd(), 'docs/images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('1. Starting Demo Server...');
  const demoServer = await createDemoServer();
  await demoServer.listen({ port: 4567, host: '127.0.0.1' });
  console.log('✓ Demo server ready at http://127.0.0.1:4567');

  console.log('2. Preparing snapshots...');
  const testOutputDir = '.snapdiff_assets';
  const config = {
    ...DEFAULT_CONFIG,
    outputDir: testOutputDir,
    targets: [
      {
        name: 'acme-cloud',
        url: 'http://127.0.0.1:4567/',
        masks: ['.timestamp']
      },
      {
        name: 'acme-pricing',
        url: 'http://127.0.0.1:4567/pricing'
      }
    ]
  };

  const engine = new SnapDiffEngine(config);

  // Capture clean baseline
  console.log('Capturing baselines...');
  await engine.captureBaselines();

  // Run test against mutated page to produce authentic visual regressions
  console.log('Running test against mutated build to generate authentic diffs...');
  await engine.runTests({
    targets: [
      {
        name: 'acme-cloud',
        url: 'http://127.0.0.1:4567/?mutate=1',
        masks: ['.timestamp']
      },
      {
        name: 'acme-pricing',
        url: 'http://127.0.0.1:4567/pricing?mutate=1'
      }
    ]
  });

  console.log('3. Starting Review Studio Server on port 9550...');
  const { server: reviewServer } = await startServer(config, { port: 9550, host: '127.0.0.1' });
  console.log('✓ Review Studio listening at http://127.0.0.1:9550');

  console.log('4. Launching Playwright Chromium for screenshots and GIF recording...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-font-antialiasing', '--font-render-hinting=none']
  });

  // A. Desktop Screenshots Context
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: path.resolve(process.cwd(), '.temp_video'),
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:9550', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Sliding Wiper Screenshot
  console.log('Capturing Sliding Wiper screenshot...');
  await page.screenshot({
    path: path.join(outputDir, 'snapdiff_studio_wiper.png')
  });

  // 2. Onion Skin Screenshot
  console.log('Capturing Onion Skin screenshot...');
  await page.keyboard.press('2'); // Switch to Onion skin
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(outputDir, 'snapdiff_studio_onion.png')
  });

  // 3. Blink Comparator Screenshot
  console.log('Capturing Blink Comparator screenshot...');
  await page.keyboard.press('5'); // Switch to Blink
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outputDir, 'snapdiff_studio_blink.png')
  });

  // 4. Difference Mask Screenshot
  console.log('Capturing Difference Mask screenshot...');
  await page.keyboard.press('4'); // Switch to Diff mask
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(outputDir, 'snapdiff_diff_mask.png')
  });

  // 5. Interactive Demo Choreography for GIF
  console.log('Recording interactive demo choreography...');
  await page.keyboard.press('1'); // Switch back to Wiper
  await page.waitForTimeout(500);

  // Smooth Wiper Drag
  const wiperBox = await page.evaluate(() => {
    const el = document.querySelector('.cursor-ew-resize');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });

  if (wiperBox) {
    const startX = wiperBox.x + wiperBox.width * 0.5;
    const centerY = wiperBox.y + wiperBox.height * 0.5;
    await page.mouse.move(startX, centerY);
    await page.mouse.down();
    // Drag left
    for (let p = 0.5; p >= 0.15; p -= 0.05) {
      await page.mouse.move(wiperBox.x + wiperBox.width * p, centerY);
      await page.waitForTimeout(80);
    }
    // Drag right
    for (let p = 0.15; p <= 0.85; p += 0.05) {
      await page.mouse.move(wiperBox.x + wiperBox.width * p, centerY);
      await page.waitForTimeout(80);
    }
    // Return to center
    for (let p = 0.85; p >= 0.5; p -= 0.05) {
      await page.mouse.move(wiperBox.x + wiperBox.width * p, centerY);
      await page.waitForTimeout(80);
    }
    await page.mouse.up();
  }

  // Jump to Diff
  await page.waitForTimeout(400);
  await page.keyboard.press('j');
  await page.waitForTimeout(1000);

  // Switch to Onion
  await page.keyboard.press('2');
  await page.waitForTimeout(1000);

  // Switch to Blink
  await page.keyboard.press('5');
  await page.waitForTimeout(1200);

  // Close context to finalize video
  await page.close();
  await context.close();

  // B. Responsive Mobile Screenshot
  console.log('Capturing responsive mobile screenshot...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:9550', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(outputDir, 'snapdiff_responsive_mobile.png')
  });
  await mobilePage.close();
  await mobileContext.close();

  await browser.close();
  await reviewServer.close();
  await demoServer.close();

  // 6. Convert Recorded Video to GIF with FFmpeg
  console.log('5. Converting video to animated demo GIF...');
  const videoFiles = fs.readdirSync(path.resolve(process.cwd(), '.temp_video'));
  const webmFile = videoFiles.find((f) => f.endsWith('.webm'));

  if (webmFile) {
    const inputVideo = path.resolve(process.cwd(), '.temp_video', webmFile);
    const outputGif = path.join(outputDir, 'snapdiff_demo.gif');

    // High quality palette-based GIF conversion
    const palette = path.resolve(process.cwd(), '.temp_video', 'palette.png');
    execSync(
      `ffmpeg -y -i "${inputVideo}" -vf "fps=15,scale=960:-1:flags=lanczos,palettegen" "${palette}"`,
      { stdio: 'inherit' }
    );
    execSync(
      `ffmpeg -y -i "${inputVideo}" -i "${palette}" -filter_complex "fps=15,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse" "${outputGif}"`,
      { stdio: 'inherit' }
    );
    console.log('✓ Successfully created ' + outputGif);
  }

  // Clean temp files
  if (fs.existsSync(path.resolve(process.cwd(), '.temp_video'))) {
    fs.rmSync(path.resolve(process.cwd(), '.temp_video'), { recursive: true, force: true });
  }
  if (fs.existsSync(path.resolve(process.cwd(), testOutputDir))) {
    fs.rmSync(path.resolve(process.cwd(), testOutputDir), { recursive: true, force: true });
  }

  console.log('✓ All visual assets successfully generated!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
