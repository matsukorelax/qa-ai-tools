import fs from "node:fs/promises";
import { spawnSync } from "child_process";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./vision/index.js";
import { chromium } from "playwright";
import { extractElements } from "./dom/extractDom.js";
import { permanAuth, closePopup, appLogin } from "./auth.js";

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
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(opts.viewport);

  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    console.error(`[1/3] 認証 + ページ取得 ...`);
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await permanAuth(page);
    await closePopup(page);
    if (opts.auth === "login") {
      await appLogin(page);
      await closePopup(page);
    }
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
  if (opts.output) {
    await fs.writeFile(opts.output, code, "utf8");
    console.error(`Written to ${opts.output}`);
    runTest(opts.output);
  } else {
    process.stdout.write(code + "\n");
  }

  await browser.close();
}

function runTest(outputPath: string): void {
  console.error(`\n[実行] playwright test ${outputPath}`);
  const result = spawnSync(
    "npx",
    ["playwright", "test", "--reporter=list", outputPath],
    { stdio: "inherit" }
  );
  console.error(
    result.status === 0
      ? "✓ テスト成功"
      : `✗ テスト失敗 (exit code: ${result.status})`
  );
}
