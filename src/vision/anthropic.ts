import Anthropic from "@anthropic-ai/sdk";
import type { VisionAnalysis, VisionProvider } from "./types.js";

const client = new Anthropic();

export class AnthropicProvider implements VisionProvider {
  async analyzeScreenshot(screenshotBuffer: Buffer, platform: string): Promise<VisionAnalysis> {
    const base64 = screenshotBuffer.toString("base64");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are a test automation expert specializing in ${platform} test code generation.
Analyze UI screenshots and identify interactive elements, their types, labels, and likely selectors.
Respond in JSON only.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: base64 },
            },
            {
              type: "text",
              text: `Analyze this screenshot and return JSON with this shape:
{
  "pageTitle": "string",
  "rawDescription": "one-line summary",
  "elements": [
    { "type": "button|input|link|select|text", "label": "visible text", "selector": "css or xpath hint", "action": "tap|fill|assert" }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    return JSON.parse(json) as VisionAnalysis;
  }
}
