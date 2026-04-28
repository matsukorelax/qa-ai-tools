import dotenv from "dotenv";
dotenv.config();
import { Command } from "commander";
import { generateTests } from "./generator.js";

const program = new Command();

program
  .name("bugrepro")
  .description("URL → screenshot → Claude Vision → Appium/WebView test code")
  .version("0.1.0");

program
  .command("generate <url>")
  .alias("gen")
  .description("Generate test code from a URL")
  .option("-o, --output <file>", "output file path (default: stdout)")
  .option("-p, --platform <platform>", "target platform: webview|android|ios", "webview")
  .option("-t, --title <title>", "screenshot title (default: url)", url => url)
  .option("-c, --context <text>", "bug context (one-line description)")
  .option("-a, --auth <status>", "auth status: guest|login", "guest")
  .option("--viewport <size>", "viewport size WxH", "1280x800")
  .option("--vision", "attach screenshot to AI prompt")
  .option(
    "--elements <categories>", 
    "DOM categories to extract, comma-separated (ボタン,リンク,入力フォーム,テキスト表示,画像表示,レイアウト)")
  .action(async (url: string, 
    opts: { 
      output?: string; 
      platform: string; 
      title: string; 
      context?: string; 
      auth: string; 
      viewport: string;
      vision: boolean;
      elements: string;
    }) => {
    const [width, height] = opts.viewport.split("x").map(Number);
    try {
      await generateTests({ 
        url, 
        platform: opts.platform, 
        title: opts.title ?? url, 
        context: opts.context, 
        auth: opts.auth, 
        viewport: { width, height }, 
        output: opts.output,
        vision: opts.vision,
        elements: opts.elements ? opts.elements.split(",") : undefined
      });
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
