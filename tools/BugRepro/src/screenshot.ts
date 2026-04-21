import { chromium } from "playwright";
import fs from "fs";

export interface ScreenshotOptions {
  url: string;
  title?: string;
  viewport: { width: number; height: number };
}

export async function takeScreenshot(opts: ScreenshotOptions): Promise<String> {
  const base = opts.title ?? `${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  let filename = `${base}.png`;
  const path = `screenshots/${filename}`
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(opts.viewport);
  await page.goto(opts.url, { waitUntil: "networkidle" });
  const buffer = await page.screenshot({ type: "png", fullPage: false });
  await fs.promises.writeFile(path, buffer);
  await browser.close();
  return path;
}
