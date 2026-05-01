import { Page } from "playwright";

export interface DomElement{
    tagName: string;
    role?: string;
    label?: string;
    testId?: string;
}

export async function extractElements(page: Page, categories: string[] =[
    "ボタン", "入力フォーム", "リンク", "テキスト表示", "画像表示", "レイアウト"
]): Promise<DomElement[]> {
    const CATEGORY_SELECTORS: Record<string, string> = {
        "ボタン": 'button, [role="button"]',
        "入力フォーム": 'input, textarea, select, label',
        "リンク": 'a[href]',
        "テキスト表示": 'h1, h2, h3, h4, h5, h6, p, span, [data-testid]',
        "画像表示": 'img, [role="img"], svg',
        "レイアウト": 'header, footer, nav, main, section',
    }

    const selector = categories
        .map(c => CATEGORY_SELECTORS[c])
        .join(", ");

    const elements = await page.$$eval(selector, (els) => {
        return els.map(el => ({
            tagName: el.tagName,
            role: el.getAttribute("role") ?? undefined,
            label: el.getAttribute("aria-label") ?? el.textContent ?? undefined,
            testId: el.getAttribute("data-testid") ?? undefined,
        }))
    })
    
    return elements
}