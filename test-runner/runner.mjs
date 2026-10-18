import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

const rootDir = process.env.WORKSPACE_DIR || "/game";
const artifactsDir = process.env.ARTIFACTS_DIR || "/artifacts";
const galleryDir = path.join(artifactsDir, "gallery");

fs.mkdirSync(galleryDir, { recursive: true });

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  console.log(`[HTTP REQ] ${req.method} ${req.url}`);
  const urlPath = (req.url || "/").split("?")[0];
  const relPath = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath).replace(/^\//, "");
  const filePath = path.join(rootDir, relPath);
  if (!filePath.startsWith(rootDir)) {
    console.error(`[HTTP 403] ${filePath} not in ${rootDir}`);
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`[HTTP 404] Could not read ${filePath} (${err.message})`);
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

server.listen(4173, "127.0.0.1", async () => {
  console.log("Local server running at http://127.0.0.1:4173");
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--enable-unsafe-swiftshader",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: artifactsDir, size: { width: 1280, height: 720 } },
  });

  const page = await context.newPage();
  const startTime = Date.now();

  page.on("console", (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()));
  page.on("pageerror", (err) => console.error(`[BROWSER ERROR]:`, err));
  page.on("requestfailed", (req) => console.error(`[BROWSER REQUEST FAILED]:`, req.url(), req.failure()?.errorText));

  try {
    console.log("Navigating to Sprites workshop...");
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });

    // Wait until model is loaded and initial views to render
    console.log("Waiting for model to load and initial views to render...");
    await page.waitForFunction(() => {
      const btn = document.querySelector("#render");
      const st = document.querySelector("#status");
      const err = document.querySelector("#error");
      const hasStatus = st && (st.textContent.includes("frames") || st.textContent.includes("views"));
      return (btn && !btn.disabled && hasStatus) || (err && err.textContent.length > 0);
    }, { timeout: 30000 });

    console.log("Model loaded successfully. Status:", await page.locator("#status").textContent());

    // Phase 1 (0:00 - 0:04) Overview & Initial View Grid
    await sleep(2500);
    console.log("Capturing 01-workbench-overview.png...");
    await page.screenshot({ path: path.join(galleryDir, "01-workbench-overview.png") });
    await sleep(1500);

    // Phase 2 (0:04 - 0:09) Multi-Directional Playback
    console.log("Starting playback...");
    await page.click("#play");
    await sleep(2000);

    // Adjust playback speed to 16 FPS
    await page.selectOption("#playback-speed", "16");
    await sleep(1500);

    console.log("Capturing 02-multi-directional-playback.png...");
    await page.screenshot({ path: path.join(galleryDir, "02-multi-directional-playback.png") });
    await sleep(1500);

    // Phase 3 (0:09 - 0:14) Algorithmic Diagonal Warping Matrix
    console.log("Capturing 03-derived-diagonal-matrix.png...");
    await page.screenshot({ path: path.join(galleryDir, "03-derived-diagonal-matrix.png") });
    await sleep(2000);

    // Pause playback for precise settings configuration
    await page.click("#pause");
    await sleep(1500);

    // Phase 4 (0:14 - 0:19) Camera Pitch & Perspective Configuration
    console.log("Opening Render settings...");
    await page.click("details.option-group:nth-of-type(1) summary");
    await sleep(800);

    // Change camera pitch to 45°
    await page.selectOption("#pitch", "45");
    await sleep(800);

    // Click render preview to apply pitch
    await page.click("#render");
    await sleep(1500);

    console.log("Capturing 04-camera-pitch-and-views.png...");
    await page.screenshot({ path: path.join(galleryDir, "04-camera-pitch-and-views.png") });
    await sleep(1500);

    // Phase 5 (0:19 - 0:24) Single Sprite Angle Capture & Auto-Crop
    console.log("Opening Single sprite settings...");
    await page.click("details.option-group:nth-of-type(3) summary");
    await sleep(800);

    // Set angle slider
    await page.evaluate(() => {
      const angleInput = document.querySelector("#single-angle");
      angleInput.value = "135";
      angleInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(600);

    // Click preview single sprite
    await page.click("#preview-single");
    await sleep(1500);

    console.log("Capturing 05-single-sprite-crop-tool.png...");
    await page.screenshot({ path: path.join(galleryDir, "05-single-sprite-crop-tool.png") });
    await sleep(1500);

    // Phase 6 (0:24 - 0:30) Sheet Export & Asset Metrics
    console.log("Opening Export settings...");
    await page.click("details.option-group:nth-of-type(2) summary");
    await sleep(800);

    // Scroll to Asset Info table
    await page.evaluate(() => {
      document.querySelector("#asset-info")?.scrollIntoView({ behavior: "smooth" });
    });
    await sleep(1500);

    console.log("Capturing 06-sheet-export-and-asset-metrics.png...");
    await page.screenshot({ path: path.join(galleryDir, "06-sheet-export-and-asset-metrics.png") });

    // Scroll back to top to showcase the workshop layout
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    await sleep(1000);

    // Pad to ensure total elapsed recording reaches ~30.5 seconds
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 30500 - elapsed);
    console.log(`Elapsed: ${elapsed}ms, waiting ${remaining}ms to reach target ~30.5s duration...`);
    await sleep(remaining);

  } catch (err) {
    console.error("Error during automation:", err);
    throw err;
  } finally {
    console.log("Closing page and saving video recording...");
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const rawVideoPath = await video.path();
      console.log("Raw video recorded at:", rawVideoPath);
      const targetWebm = path.join(artifactsDir, "demo.webm");

      try {
        console.log("Optimizing video to target 30s WebM with ffmpeg...");
        execSync(
          `ffmpeg -y -i "${rawVideoPath}" -t 30 -vf "scale=1280:720,fps=30" -c:v libvpx-vp9 -b:v 1500k -crf 30 -an "${targetWebm}"`,
          { stdio: "inherit" }
        );
        console.log("Optimized video created:", targetWebm);
      } catch (ffErr) {
        console.error("ffmpeg optimization failed, keeping raw video:", ffErr);
        fs.copyFileSync(rawVideoPath, targetWebm);
      }
    }

    server.close();
    console.log("Showcase test run complete.");
  }
});
