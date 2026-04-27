import { Page } from "playwright";
import fs from "fs";

export interface ScreenshotOptions {
  title?: string;
}

export async function takeScreenshot(page:Page, opts: ScreenshotOptions): Promise<Buffer> {
  const base = opts.title ?? 
  `${String(new Date().getMonth() + 1).padStart(2, "0")}-
  ${String(new Date().getDate()).padStart(2, "0")}`;
  const basetitle = base.replace(/[^\w\-]/g, "_");
  let filename = `${basetitle}.png`;
  const path = `screenshots/${filename}`
  await fs.promises.mkdir("screenshots", { recursive: true });
  const buffer = await page.screenshot({ type: "png", fullPage: false });
  await fs.promises.writeFile(path, buffer);
  return buffer;
}
