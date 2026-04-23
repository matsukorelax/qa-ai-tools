import fs from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./vision/index.js";
import { generateTestCode } from "./codegen.js";
import { chromium } from "playwright";
import { extractElements } from "./dom/extractDom.js";

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
  await page.goto(opts.url, {waitUntil: "networkidle"});
  console.error(`[1/3] ページ取得 ${opts.url} ...`);
  const domElements = await extractElements(page, opts.elements);
  const screenshot = opts.vision ? await takeScreenshot(page, { title: opts.title }): undefined;

  console.error(`[2/3] Analyzing with AI (platform: ${opts.platform}) ...`);
  const analysis = await analyzeScreenshot({ 
    platform: opts.platform, 
    domElements, 
    screenshot,
    target_url: opts.url,
    context: opts.context,
    user_status: opts.auth
  });

  console.error(`[3/3] Generating test code ...`);
  const code = generateTestCode(analysis, opts.platform, opts.url);

  if (opts.output) {
    await fs.writeFile(opts.output, code, "utf8");
    console.error(`Done. Written to ${opts.output}`);
  } else {
    process.stdout.write(code + "\n");
  }
  await browser.close();
};
