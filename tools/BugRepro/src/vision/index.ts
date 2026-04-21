export type { VisionAnalysis, UIElement, AnalyzeOptions } from "./types.js";

import type { VisionProvider, AnalyzeOptions } from "./types.js";
import { DifyProvider } from "./dify.js";
import { AnthropicProvider } from "./anthropic.js";

function getProvider(): VisionProvider {
  const p = process.env.VISION_PROVIDER ?? "dify";
  if (p === "anthropic") return new AnthropicProvider();
  if (p === "dify") return new DifyProvider();
  throw new Error(`Unknown VISION_PROVIDER: "${p}". Use "dify" or "anthropic".`);
}

const provider = getProvider();

export function analyzeScreenshot(opts: AnalyzeOptions) {
  return provider.analyze(opts);
}
