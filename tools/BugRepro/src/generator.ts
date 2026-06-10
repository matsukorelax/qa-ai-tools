import fs from "node:fs/promises";
import { spawnSync } from "child_process";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./vision/index.js";
import { chromium } from "playwright";
import { extractElements } from "./dom/extractDom.js";
import { stagingAuth, closePopup, appLogin } from "./auth.js";
import path from "node:path";

export interface GenerateOptions {
  url: string;
  platform: string;
  vision?: boolean;
  elements?: string[];
  title?: string;
  context?: string;
  auth?: string;
  viewport: { width: number; height: number };
  output?: string;
}

export async function generateTests(opts: GenerateOptions): Promise<void> {
  const STATE_PATH = "playwright/.auth/state.json";
  const hasState = opts.auth === "login" &&
    await fs.access(STATE_PATH).then(() => true).catch(() => false);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...(process.env.BASIC_USER ? {
      httpCredentials: {
        username: process.env.BASIC_USER,
        password: process.env.BASIC_PASS ?? "",
      }
    } : {}),
    ...(hasState ? { storageState: STATE_PATH } : {})
  });
  const page = await context.newPage();
  await page.setViewportSize(opts.viewport);

  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    console.error(`[1/3] 認証 + ページ取得 ...`);
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    if (!hasState) {
      await stagingAuth(page);
      await closePopup(page);
      if (opts.auth === "login") {
        await appLogin(page);
        await closePopup(page);
      }
      await fs.mkdir("playwright/.auth", { recursive: true });
      await context.storageState({ path: "playwright/.auth/state.json" });
    }
    await closePopup(page);
    await page.goto(opts.url, { waitUntil: "networkidle" });
  } else {
    console.error(`[1/3] ページ取得 ${opts.url} ...`);
    await page.goto(opts.url, { waitUntil: "networkidle" });
  }

  const domElements = await extractElements(page, opts.elements);
  const screenshot = opts.vision ? await takeScreenshot(page, { title: opts.title }) : undefined;

  console.error(`[2/3] AI解析中 (platform: ${opts.platform}) ...`);
  const code = await analyzeScreenshot({
    platform: opts.platform,
    domElements,
    screenshot,
    target_url: opts.url,
    context: opts.context,
    user_status: opts.auth
  });

  console.error(`[3/3] コード生成完了`);
  await browser.close();

  if (opts.output && opts.platform === "webview") {
    const finalCode = injectStorageState(code);
    await fs.writeFile(opts.output, finalCode, "utf8");
    console.error(`Written to ${opts.output}`);
    runTest(opts.output);
  } else if (opts.output && opts.platform === "android") {
    const outputPath = opts.output.replace(/\.spec\.ts$/, ".py");
    await fs.writeFile(outputPath, code, "utf8");
    console.error(`Written to ${opts.output}`);
    runTest(outputPath);
  } else {
    process.stdout.write(code + "\n");
  }
}

function injectStorageState(code: string): string {
  const STATE_FILE = path.resolve("playwright/.auth/state.json").replace(/\\/g, "/");
  const injection = `\ntest.use({ storageState: '${STATE_FILE}' });\n`;
  return code.replace(/(import[^\n]+\n)+/, (imports) => imports + injection);
}

function runTest(outputPath: string): void {
  const normalizedPath = outputPath.replace(/\\/g, "/");
  if (normalizedPath.includes(".spec.ts")) {
    console.error(`\n[実行] playwright test ${normalizedPath}`);
    const result = spawnSync(
      "npx",
      ["playwright", "test", "--headed", "--reporter=list", normalizedPath],
      { stdio: "inherit", env: process.env, shell: true }
    );
    console.error(
      result.status === 0
        ? "✓ テスト成功"
        : `✗ テスト失敗 (exit code: ${result.status})`
    );
  } else if (normalizedPath.includes(".py")) {
    console.error(`\n[実行] pytest ${normalizedPath}`);
    const pytest = process.platform === "win32" ? "venv\\Scripts\\pytest.exe" : "venv/bin/pytest";
    const result = spawnSync(
      pytest,
      [normalizedPath],
      { stdio: "inherit", env: process.env, shell: true }
    );
    console.error(
      result.status === 0
        ? "✓ テスト成功"
        : `✗ テスト失敗 (exit code: ${result.status})`
    );
  };
};

export async function saveAuth(): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...(process.env.BASIC_USER ? {
      httpCredentials: {
        username: process.env.BASIC_USER,
        password: process.env.BASIC_PASS ?? "",
      }
    } : {})
  });
  const page = await context.newPage();

  const baseUrl = process.env.BASE_URL ?? "";
  await page.goto(baseUrl, {waitUntil: "networkidle"});
  await stagingAuth(page);
  await closePopup(page);

  console.error("ブラウザでログインしてください。完了後ブラウザを閉じてください");
  await page.waitForEvent("close", { timeout: 600_000 });
  await fs.mkdir("playwright/.auth", { recursive: true });
  await context.storageState({ path: "playwright/.auth/state.json" });
  await browser.close();
};