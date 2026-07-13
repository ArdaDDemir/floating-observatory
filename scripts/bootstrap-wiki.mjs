/**
 * Bootstrap + publish GitHub Wiki from ./wiki
 * Opens browser if first page is missing so you can click Create once;
 * then copies all pages and pushes.
 *
 * Usage: node scripts/bootstrap-wiki.mjs
 */
import { chromium } from "playwright";
import { execSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  readdirSync,
  readFileSync,
  rmSync,
  mkdirSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const OWNER = "ArdaDDemir";
const REPO = "floating-observatory";
const WIKI_REMOTE_BASE = `https://github.com/${OWNER}/${REPO}.wiki.git`;
const ROOT = process.cwd();
const WIKI_SRC = join(ROOT, "wiki");

function token() {
  const r = spawnSync("gh", ["auth", "token"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("gh auth token failed — run gh auth login");
  return r.stdout.trim();
}

function remoteUrl(t) {
  return `https://x-access-token:${t}@github.com/${OWNER}/${REPO}.wiki.git`;
}

function wikiExists(t) {
  const r = spawnSync("git", ["ls-remote", remoteUrl(t), "HEAD"], {
    encoding: "utf8",
  });
  return r.status === 0;
}

function sh(cmd, opts = {}) {
  console.log(">", cmd);
  return execSync(cmd, { stdio: "inherit", ...opts });
}

async function createFirstPageInBrowser() {
  console.log("\nWiki remote missing — opening browser to create Home once...");
  console.log("If you see Create the first page, click it, set title Home, Create page.\n");

  const browser = await chromium.launch({
    headless: false,
    channel: process.env.PW_CHANNEL || undefined,
  });
  const page = await browser.newPage();
  await page.goto(`https://github.com/${OWNER}/${REPO}/wiki`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  // Wait until wiki git remote exists (user creates first page) — max ~3 min
  const t = token();
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    if (wikiExists(t)) {
      console.log("Wiki remote is ready.");
      await browser.close();
      return true;
    }
    // Try auto-click create if visible and already logged in
    try {
      const create = page.getByRole("link", { name: /create the first page/i });
      if (await create.count()) {
        await create.first().click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        const title = page.locator('#wiki_name, input[name="wiki[name]"]');
        if (await title.count()) {
          await title.fill("Home");
        }
        const body = page.locator(
          '#gollum-editor-body, textarea[name="wiki[body]"]'
        );
        if (await body.count()) {
          await body.fill(
            "# Floating Observatory\n\nBootstrapping wiki… full pages arrive via push."
          );
        }
        const submit = page.getByRole("button", {
          name: /save|create page|submit/i,
        });
        if (await submit.count()) {
          await submit.first().click();
          await page.waitForTimeout(2500);
        }
      }
    } catch {
      /* keep waiting */
    }
    await page.waitForTimeout(3000);
  }

  await browser.close();
  return wikiExists(token());
}

function publish(t) {
  const tmp = join(tmpdir(), `fo-wiki-${Date.now()}`);
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  sh(`git clone "${remoteUrl(t)}" "${tmp}"`);

  for (const f of readdirSync(WIKI_SRC).filter((x) => x.endsWith(".md"))) {
    copyFileSync(join(WIKI_SRC, f), join(tmp, f));
  }

  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "ArdaDDemir",
    GIT_AUTHOR_EMAIL: "iletisim@ardademir.com.tr",
    GIT_COMMITTER_NAME: "ArdaDDemir",
    GIT_COMMITTER_EMAIL: "iletisim@ardademir.com.tr",
  };

  execSync("git add .", { cwd: tmp, stdio: "inherit" });
  const st = execSync("git status --porcelain", { cwd: tmp, encoding: "utf8" });
  if (!st.trim()) {
    console.log("Wiki already up to date.");
    return;
  }
  execSync('git commit -m "docs: publish Floating Observatory wiki"', {
    cwd: tmp,
    stdio: "inherit",
    env,
  });
  try {
    execSync("git push origin HEAD:master", { cwd: tmp, stdio: "inherit" });
  } catch {
    execSync("git push origin HEAD:main", { cwd: tmp, stdio: "inherit" });
  }
  console.log(
    "\nDone → https://github.com/ArdaDDemir/floating-observatory/wiki"
  );
}

async function main() {
  const t = token();
  if (!wikiExists(t)) {
    const ok = await createFirstPageInBrowser();
    if (!ok) {
      console.error(
        "\nTimed out waiting for wiki. Create the first page manually, then:\n  npm run wiki:push\n"
      );
      process.exit(1);
    }
  }
  publish(t);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
