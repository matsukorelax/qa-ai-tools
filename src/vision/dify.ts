import type { VisionAnalysis, VisionProvider } from "./types.js";

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.DIFY_API_KEY ?? "";

export class DifyProvider implements VisionProvider {
  async analyzeScreenshot(screenshotBuffer: Buffer, platform: string): Promise<VisionAnalysis> {
    const base64 = screenshotBuffer.toString("base64");

    const prompt = `You are a test automation expert specializing in ${platform} test code generation.
Analyze this UI screenshot and return JSON only, with this shape:
{
  "pageTitle": "string",
  "rawDescription": "one-line summary",
  "elements": [
    { "type": "button|input|link|select|text", "label": "visible text", "selector": "css or xpath hint", "action": "tap|fill|assert" }
  ]
}`;

    const res = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        response_mode: "blocking",
        conversation_id: "",
        user: "bugrepro",
        files: [
          {
            type: "image",
            transfer_method: "base64",
            upload_file_id: "",
            data: `data:image/png;base64,${base64}`,
          },
        ],
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
