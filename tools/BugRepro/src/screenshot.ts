import { chromium } from "playwright";

export interface ScreenshotOptions {
  url: string;
  viewport: { width: number; height: number };
}

export async function takeScreenshot(opts: ScreenshotOptions): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(opts.viewport);
  await page.goto(opts.url, { waitUntil: "networkidle" });
  const buffer = await page.screenshot({ type: "png", fullPage: false });
  await browser.close();
  return buffer;
}
