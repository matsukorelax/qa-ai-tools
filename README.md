# qa-ai-tools

QAエンジニアが実務課題を解決するために構築したAI活用ツール集。

## ツール一覧

### 起票ヘルパー（実務投入済み）
バグ発見から起票までの時間を1件あたり約5分削減。
Difyワークフローで入力を構造化し、報告文ドラフトを自動生成。
→ [tools/dify/起票ヘルパー](tools/dify/起票ヘルパー)

### slow-bug-analyze
自作バグチケットDB（約150件）を分析し、
「テスターの改善アクション」を優先度付きで出力するパイプライン。
n8nとDifyを連携したバッチ処理で実現。
→ [tools/slow-bug-analyze](tools/slow-bug-analyze)

### 下書き結衣
AI活用推進係として、メンバーのAI活用の最初の一歩を下げるために構築。
アイデアを自由入力するだけで要件定義書のたたき台を生成。
→ [tools/dify/下書き結衣](tools/dify/下書き結衣)

## 使用技術
- Dify / n8n（AIワークフロー・自動化）
- GPT-4o-mini / GPT-5 / Gemini 3 Pro Preview
- Python / JavaScript（データ整形）
