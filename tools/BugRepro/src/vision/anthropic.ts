import Anthropic from "@anthropic-ai/sdk";
import type { VisionProvider, AnalyzeOptions } from "./types.js";
import fs from "node:fs";
import path from "node:path";

const client = new Anthropic();

export function loadKnowledgeDir(dirEnvKey: string): string {
  const dir = process.env[dirEnvKey];
  if (!dir) return "";
  const resolved = path.resolve(dir);
  if (!fs.existsSync(resolved)) return "";
  return fs.readdirSync(resolved)
    .filter(f => f.endsWith(".md") || f.endsWith(".txt"))
    .map(f => fs.readFileSync(path.join(resolved, f), "utf-8"))
    .join("\n\n");
}

export class AnthropicProvider implements VisionProvider {
  async analyze({ 
    platform, 
    domElements, 
    screenshot, 
    target_url,
    context,
    user_status
  }: AnalyzeOptions): Promise<string> {
    const codeKnowledge = loadKnowledgeDir("CODE_KNOWLEDGE");
    const linkKnowledge = loadKnowledgeDir("LINK_KNOWLEDGE");

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
      text: `あなたはWebアプリのテストコード生成AIです。以下の情報をもとにバグを再現するテストコードを生成してください。
対象URL: ${target_url}
プラットフォーム: ${platform}
バグ概要: ${context}
ユーザー状態: ${user_status} 

ロケーター優先度: 
getByRole() > getByLabel()/getByText() > getByTestId() > CSS selector in that priority order.

DOM elements:
${domSummary}

出力ルール
テストコードのみ出力（説明文不要）
バグ再現に関連する操作を中心に絞ること

## 参考コード:
${codeKnowledge}

## 画面遷移表:
${linkKnowledge}
`
    })

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}