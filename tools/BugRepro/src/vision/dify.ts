import type { VisionAnalysis, VisionProvider, AnalyzeOptions } from "./types.js";

export class DifyProvider implements VisionProvider {
  async analyze({ 
    platform, 
    domElements, 
    screenshot,
    target_url,
    context,
    user_status 
  }: AnalyzeOptions): 
  Promise<VisionAnalysis> {
    const DIFY_API_URL = process.env.DIFY_API_URL ?? "";
    const DIFY_API_KEY = process.env.DIFY_API_KEY ?? "";
    const domSummary = domElements.map(el => {
      const parts = [el.tagName.toLowerCase()];
      if (el.role) parts.push(`role="${el.role}"`);
      if (el.label) parts.push(`label="${el.label.trim().slice(0, 80)}"`);
      if (el.testId) parts.push(`data-testid="${el.testId}"`);
      return parts.join(" ");
    }).join("\n");

    console.error("AUTH:", `Bearer ${DIFY_API_KEY.slice(0,5)}...`);  
    const res = await fetch(`${DIFY_API_URL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          dom_elements: domSummary,
          platform: platform,
          bug_screenShot: screenshot ? [{
            type: "image",
            transfer_method: "local_file",
            upload_file_id: await uploadFile(screenshot, DIFY_API_URL, DIFY_API_KEY) 
          }] : [],
          target_url: target_url,
          context: context,
          user_status: user_status
        },
        response_mode: "blocking",
        user: "bugrepro",
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

async function uploadFile(buffer: Buffer, apiUrl: string, apiKey: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/png" }), "screenshot.png");
  form.append("user", "bugrepro");

  const res = await fetch(`${apiUrl.replace("/workflows/run", "")}/files/upload`,{
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) throw new Error(`File upload error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { id: string };
  return data.id;
}