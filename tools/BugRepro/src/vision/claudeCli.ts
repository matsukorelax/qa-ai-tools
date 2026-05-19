import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { VisionProvider, AnalyzeOptions } from "./types.js";
import { loadKnowledgeDir } from "./anthropic.js";

export class ClaudeCliProvider implements VisionProvider {
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

    // 1. domSummary を作る（anthropic.ts と同じ）
        const domSummary =domElements.map(el => {
            const parts = [el.tagName.toLowerCase()];
            if (el.role) parts.push(`role="${el.role}"`);
            if (el.label) parts.push(`label="${el.label.trim().slice(0, 80)}"`);
            if (el.testId) parts.push(`data-testid="${el.testId}"`);
            return parts.join(" ");
          }).join("\n");

    // 2. プロンプトを作る（anthropic.ts と同じ内容）
        const prompt = `あなたはWebアプリのテストコード生成AIです。以下の情報をもとにバグを再現するテストコードを生成してください。
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
`;

    // 3. スクリーンショットを一時ファイルに保存する
        const tmpImg = path.join(process.env.TEMP ?? "/tmp", `bugrepro_${Date.now()}.png`);
        if (screenshot) {
          fs.writeFileSync(tmpImg, screenshot);
        }

    // 4. claude CLIをサブプロセスで呼び出す（stdinでプロンプトを渡す）
        const args = ["-p", "-"];
        if (screenshot) args.push("--image", tmpImg);

        const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
        const result = spawnSync(claudeCmd, args, {
            input: prompt,
            encoding: "utf-8",
        });

        // 5. 一時ファイルを削除する
        if (screenshot) fs.unlinkSync(tmpImg);

        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error(result.stderr);
        return result.stdout;
        }
}