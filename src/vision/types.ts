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

export interface VisionProvider {
  analyzeScreenshot(screenshotBuffer: Buffer, platform: string): Promise<VisionAnalysis>;
}
