import fs from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./vision/index.js";
import { chromium } from "playwright";
import { extractElements } from "./dom/extractDom.js";
import { execSync } from "child_process";

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
  const code = await analyzeScreenshot({
    platform: opts.platform,
    domElements,
    screenshot,
    target_url: opts.url,
    context: opts.context,
    user_status: opts.auth
  });

  console.error(`[3/3] Done.`);
  if (opts.output) {
    await fs.writeFile(opts.output, code, "utf8");
    console.error(`Written to ${opts.output}`);
    const result = await sub_process(`${opts.output}`);
    console.error(`Test result: ${result}`);
  } else {
    process.stdout.write(code + "\n");
  }

  

  await browser.close();
};


async function sub_process(outputPath: string): Promise<string> {
  try {
    execSync(`npx playwright test ${outputPath}`, { stdio: "inherit" });
    return "pass";
  } catch (e) {
    return "fail";
  }
}