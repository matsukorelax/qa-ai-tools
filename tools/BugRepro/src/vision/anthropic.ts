import Anthropic from "@anthropic-ai/sdk";
import type { VisionAnalysis, VisionProvider, AnalyzeOptions } from "./types.js";

const client = new Anthropic();

export class AnthropicProvider implements VisionProvider {
  async analyze({ platform, domElements, screenshot }: AnalyzeOptions): Promise<VisionAnalysis> {
    const domSummary = domElements.map(el => {
      const parts = [el.tagName.toLowerCase()];
      if (el.role) parts.push(`role="${el.role}"`);
      if (el.label) parts.push(`label="${el.label.trim().slice(0, 80)}"`);
      if (el.testId) parts.push(`data-testid="${el.testId}"`);
      return parts.join(" ");
    }).join("\n");

    const content: Anthropic.MessageParam["content"] = [];

    if (screenshot) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: screenshot.toString("base64") },
      });
    }

    content.push({
      type: "text",
      text: `You are a test automation expert specializing in ${platform} test code generation.
Generate Playwright test code based on the following DOM elements.
Use getByRole() > getByLabel()/getByText() > getByTestId() > CSS selector in that priority order.

DOM elements:
${domSummary}

Return JSON only with this shape:
{
  "pageTitle": "string",
  "rawDescription": "one-line summary",
  "elements": [
    { "type": "button|input|link|select|text", "label": "visible text", "selector": "css or xpath hint", "action": "tap|fill|assert" }
  ]
}`,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    return JSON.parse(json) as VisionAnalysis;
  }
}
