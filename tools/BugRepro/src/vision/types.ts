export interface AnalyzeOptions {
  platform: string;
  domElements: import("../dom/extractDom.js").DomElement[];
  screenshot?: Buffer;
  target_url: string;
  context?: string;
  user_status?: string;
}

export interface VisionProvider {
  analyze(opts: AnalyzeOptions): Promise<string>;
}
