export interface VisionAnalysis {
  elements: UIElement[];
  pageTitle: string;
  rawDescription: string;
}

export interface UIElement {
  type: string;
  label: string;
  selector?: string;
  action?: string;
}

export interface AnalyzeOptions {
  platform: string;
  domElements: import("../dom/extractDom.js").DomElement[];
  screenshot?: Buffer;
}

export interface VisionProvider {
  analyze(opts: AnalyzeOptions): Promise<VisionAnalysis>;
}
