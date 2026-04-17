import fs from "node:fs/promises";
import { takeScreenshot } from "./screenshot.js";
import { analyzeScreenshot } from "./vision.js";
import { generateTestCode } from "./codegen.js";

export interface GenerateOptions {
  url: string;
  platform: string;
  viewport: { width: number; height: number };
  output?: string;
}

export async function generateTests(opts: GenerateOptions): Promise<void> {
  console.error(`[1/3] Taking screenshot of ${opts.url} ...`);
  const screenshot = await takeScreenshot({ url: opts.url, viewport: opts.viewport });

  console.error(`[2/3] Analyzing with Claude Vision (platform: ${opts.platform}) ...`);
  const analysis = await analyzeScreenshot(screenshot, opts.platform);

  console.error(`[3/3] Generating test code ...`);
  const code = generateTestCode(analysis, opts.platform, opts.url);

  if (opts.output) {
    await fs.writeFile(opts.output, code, "utf8");
    console.error(`Done. Written to ${opts.output}`);
  } else {
    process.stdout.write(code + "\n");
  }
}
