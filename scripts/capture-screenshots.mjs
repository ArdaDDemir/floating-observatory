/**
 * Showcase screenshots for GitHub README.
 * Usage: node scripts/capture-screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "images");
const BASE = process.argv[2] || "http://localhost:3000";

function showcaseState() {
  return {
    state: {
      resources: { crystals: 420, energy: 380 },
      islandState: "healthy",
      status: "idle",
      activeQuest: null,
      activeBreak: null,
      lastReward: null,
      lastPenalty: null,
      preferredFocusMinutes: 25,
      preferredTag: "deep_work",
      lockUntil: null,
      placedBuildings: [
        { id: "b-core", type: "energy_core", level: 3, position: [2, 0.26, 1] },
        { id: "b-tower", type: "data_tower", level: 2, position: [-2, 0.26, 1] },
        { id: "b-lab", type: "botanical_lab", level: 2, position: [1, 0.26, -2] },
        {
          id: "b-shield",
          type: "shield_generator",
          level: 1,
          position: [-1, 0.26, -2],
        },
        { id: "b-dish", type: "signal_dish", level: 1, position: [3, 0.26, -1] },
      ],
      crew: [],
      sessionLog: [],
      hasSeenOnboarding: true,
      unlockedAchievements: ["first_session", "builder_1"],
      research: {
        efficientHarvest: true,
        resilientCore: false,
        calmSignal: true,
      },
      coreSkin: "default",
      skySkin: "default",
      prefs: {
        soundEnabled: false,
        notifyEnabled: false,
        zenMode: false,
        graphicsQuality: "high",
        wakeLockEnabled: false,
        hapticsEnabled: false,
      },
      stats: {
        sessionsCompleted: 12,
        sessionsFailed: 1,
        totalFocusSeconds: 18000,
        failStreak: 0,
        cleanRun: 5,
        dailyFocusSeconds: 1800,
        dailyGoalMinutes: 50,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        currentStreak: 4,
        longestStreak: 7,
        focusByTag: {
          coding: 4000,
          study: 2000,
          deep_work: 9000,
          creative: 2000,
          other: 1000,
        },
      },
      cheaterStrike: false,
    },
    version: 0,
  };
}

async function openPage(browser, viewport, opts = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: opts.deviceScaleFactor ?? 1,
    isMobile: opts.isMobile ?? false,
    hasTouch: opts.hasTouch ?? false,
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem("observatory-save-v3", JSON.stringify(payload));
  }, showcaseState());
  await page.goto(BASE, { waitUntil: "load", timeout: 90000 });
  await page.waitForSelector("canvas", { timeout: 60000 });
  // WebGL warm-up
  await page.waitForTimeout(opts.settle ?? 4000);
  // Confirm canvas has pixels (not blank)
  for (let i = 0; i < 8; i++) {
    const ok = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return false;
      try {
        const gl =
          c.getContext("webgl2") ||
          c.getContext("webgl") ||
          c.getContext("experimental-webgl");
        // R3F already owns context — just check size
        return c.width > 100 && c.height > 100;
      } catch {
        return c.width > 100;
      }
    });
    if (ok) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(500);
  return { context, page };
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: "png" });
  const fs = await import("node:fs/promises");
  const st = await fs.stat(file);
  console.log(`wrote ${name}.png (${Math.round(st.size / 1024)} KB)`);
}

async function click(page, re) {
  const loc = page.getByRole("button", { name: re });
  const n = await loc.count();
  if (!n) return false;
  await loc.first().click({ force: true, timeout: 5000 });
  return true;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-angle=d3d11",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--enable-webgl2",
    ],
  });

  // 1) Desktop hero idle
  {
    const { context, page } = await openPage(browser, {
      width: 1440,
      height: 900,
    });
    await shot(page, "desktop-idle");
    await context.close();
  }

  // 2) Desktop build
  {
    const { context, page } = await openPage(browser, {
      width: 1440,
      height: 900,
    });
    await page.keyboard.press("b");
    await page.waitForTimeout(1500);
    await shot(page, "desktop-build");
    await click(page, /energy core/i);
    await page.waitForTimeout(800);
    await shot(page, "desktop-build-select");
    await context.close();
  }

  // 3) Desktop focus
  {
    const { context, page } = await openPage(browser, {
      width: 1440,
      height: 900,
    });
    await click(page, /start/i);
    await page.waitForTimeout(1800);
    await shot(page, "desktop-focus");
    await click(page, /^pause$/i);
    await page.waitForTimeout(600);
    await shot(page, "desktop-paused");
    await context.close();
  }

  // 4) Desktop guide
  {
    const { context, page } = await openPage(browser, {
      width: 1440,
      height: 900,
    });
    await click(page, /help|guide/i);
    await page.waitForTimeout(1000);
    await shot(page, "desktop-guide");
    await context.close();
  }

  // 5) Desktop lab — use title aria
  {
    const { context, page } = await openPage(browser, {
      width: 1440,
      height: 900,
    });
    // ToolbarIconButton aria-label starts with Lab
    const lab = page.locator('button[title*="Lab"], button[aria-label*="Lab"]');
    if ((await lab.count()) > 0) {
      await lab.first().click({ force: true });
      await page.waitForTimeout(1200);
      await shot(page, "desktop-lab");
    } else if (await click(page, /lab/i)) {
      await page.waitForTimeout(1200);
      await shot(page, "desktop-lab");
    }
    await context.close();
  }

  // 6) Mobile hero — full island (quest collapsed)
  {
    const { context, page } = await openPage(
      browser,
      { width: 390, height: 844 },
      { deviceScaleFactor: 2, isMobile: true, hasTouch: true, settle: 5000 }
    );
    // Collapse quest if expanded
    const hide = page.getByRole("button", { name: /^hide$/i });
    if ((await hide.count()) > 0) {
      await hide.first().click({ force: true });
      await page.waitForTimeout(600);
    }
    await shot(page, "mobile-idle");
    await context.close();
  }

  // 7) Mobile quest form
  {
    const { context, page } = await openPage(
      browser,
      { width: 390, height: 844 },
      { deviceScaleFactor: 2, isMobile: true, hasTouch: true, settle: 4500 }
    );
    await shot(page, "mobile-quest");
    await context.close();
  }

  // 8) Mobile focus compact
  {
    const { context, page } = await openPage(
      browser,
      { width: 390, height: 844 },
      { deviceScaleFactor: 2, isMobile: true, hasTouch: true, settle: 4500 }
    );
    await click(page, /start/i);
    await page.waitForTimeout(1800);
    await shot(page, "mobile-focus");
    await context.close();
  }

  // 9) Mobile build
  {
    const { context, page } = await openPage(
      browser,
      { width: 390, height: 844 },
      { deviceScaleFactor: 2, isMobile: true, hasTouch: true, settle: 4500 }
    );
    // Collapse quest for more canvas
    const hide = page.getByRole("button", { name: /^hide$/i });
    if ((await hide.count()) > 0) await hide.first().click({ force: true });
    await page.waitForTimeout(300);
    // Open menu then build
    const menu = page.getByRole("button", { name: /menu/i });
    if ((await menu.count()) > 0) await menu.first().click({ force: true });
    await page.waitForTimeout(400);
    const build = page.locator(
      'button[title*="Build"], button[aria-label*="Build"]'
    );
    if ((await build.count()) > 0) {
      await build.first().click({ force: true });
    } else {
      await click(page, /build/i);
    }
    await page.waitForTimeout(1500);
    await shot(page, "mobile-build");
    const tower = page.getByRole("button", { name: /data tower/i });
    if ((await tower.count()) > 0) {
      await tower.first().click({ force: true });
      await page.waitForTimeout(800);
      await shot(page, "mobile-build-info");
    }
    await context.close();
  }

  // 10) Mobile settings
  {
    const { context, page } = await openPage(
      browser,
      { width: 390, height: 844 },
      { deviceScaleFactor: 2, isMobile: true, hasTouch: true, settle: 4000 }
    );
    const setBtn = page.locator(
      'button[title*="Settings"], button[aria-label*="Settings"]'
    );
    if ((await setBtn.count()) > 0) {
      await setBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
      await shot(page, "mobile-settings");
    }
    await context.close();
  }

  // 11) Wide tablet with island + build
  {
    const { context, page } = await openPage(
      browser,
      { width: 1280, height: 720 },
      { settle: 4500 }
    );
    await page.keyboard.press("b");
    await page.waitForTimeout(1500);
    await shot(page, "tablet-landscape");
    await context.close();
  }

  await browser.close();
  console.log("done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
