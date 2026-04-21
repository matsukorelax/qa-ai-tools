import type { VisionAnalysis, VisionProvider, AnalyzeOptions } from "./types.js";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_API_KEY ?? "";

export class DifyProvider implements VisionProvider {
  async analyze({ platform, domElements, screenshot }: AnalyzeOptions): Promise<VisionAnalysis> {
    const domSummary = domElements.map(el => {
      const parts = [el.tagName.toLowerCase()];
      if (el.role) parts.push(`role="${el.role}"`);
      if (el.label) parts.push(`label="${el.label.trim().slice(0, 80)}"`);
      if (el.testId) parts.push(`data-testid="${el.testId}"`);
      return parts.join(" ");
    }).join("\n");

    const prompt = `You are a test automation expert specializing in ${platform} test code generation.
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
}`;

    const files = screenshot ? [
      {
        type: "image",
        transfer_method: "base64",
        upload_file_id: "",
        data: `data:image/png;base64,${screenshot.toString("base64")}`,
      },
    ] : [];

    const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          dom_elements: domSummary,
        },
        query: prompt,
        response_mode: "blocking",
        conversation_id: "",
        user: "bugrepro",
        files,
      }),
    });

    if (!res.ok) {
      throw new Error(`Dify API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json() as { answer?: string };
    const text = data.answer ?? "";
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    return JSON.parse(json) as VisionAnalysis;
  }
}
