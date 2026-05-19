# BugRepro

PCで発見したバグをSP端末（Android/iOS）で再現確認するためのテストコードを自動生成・実行するツール。

## できること

- DOM・スクリーンショットをもとにバグ再現テストコードを生成・実行する
- AIプロバイダーを環境変数で切り替えられる（現在Dify対応）

## セットアップ

**前提条件**

- Node.js
- Dify APIキー

```bash
npm install
npx playwright install
```

`.env.example` をコピーして `.env` を作成し、必要な値を入力する。

```bash
cp .env.example .env
```

## 使い方

```bash
npx tsx --env-file=.env src/cli.ts generate <URL> \
  --context "バグの概要" \
  --output "generated/test.ts"
```

**オプション**

| オプション | 説明 | デフォルト |
|---|---|---|
| `--context, -c` | バグの概要（必須） | - |
| `--output, -o` | 出力ファイルパス（省略時はstdout） | - |
| `--platform, -p` | 対象プラットフォーム（webview / android / ios） | webview |
| `--auth, -a` | ユーザー状態（guest / login） | guest |
| `--vision` | スクリーンショットをAIに渡す | false |
| `--elements` | 取得するDOM要素カテゴリ（カンマ区切り） | 全カテゴリ |
| `--title, -t` | スクリーンショットのファイル名 | URL |
| `--viewport` | 画面サイズ（WxH形式） | 1280x800 |

**実行例**

```bash
npx tsx --env-file=.env src/cli.ts generate https://example.com \
  -p webview \
  --context "ログインボタンが反応しない" \
  --output "generated/login_test.ts" \
  --elements "ボタン"
```

## 仕組み

```
URL → DOM取得 → スクリーンショット（任意） → AI（Dify） → テストコード生成・実行
```

1. 指定したURLをPlaywrightで開く
2. DOMから指定カテゴリの要素を抽出する
3. スクリーンショットを撮影する（`--vision` 指定時）
4. DOMとスクリーンショットをAIに渡してテストコードを生成する
5. 出力ファイルを指定した場合、生成したコードをPlaywrightで実行する

## 環境変数

`.env.example` を参照。
