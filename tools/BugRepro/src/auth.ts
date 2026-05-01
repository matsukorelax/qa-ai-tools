import fs from "node:fs/promises";
import type { Page } from "playwright";

export async function stagingAuth(page: Page): Promise<void> {
  const modal = page.locator(process.env.STAGING_MODAL_SELECTOR ?? "");
  await modal.waitFor({ state: "visible", timeout: 30_000 });
  await modal.locator(process.env.STAGING_USERNAME_SELECTOR ?? "").fill(process.env.STG_USER ?? "");
  await modal.locator(process.env.STAGING_PASSWORD_SELECTOR ?? "").fill(process.env.STG_PASS ?? "");
  await modal.locator(process.env.STAGING_SUBMIT_SELECTOR ?? "").click();
  await page.waitForLoadState("networkidle");
  console.error("  ステージング認証完了");
}

export async function closePopup(page: Page): Promise<void> {
  const modal = page.locator('div[role="dialog"][aria-modal="true"]');
  const appeared = await modal.waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await modal.getByRole("button", { name: "閉じる" }).click({ timeout: 3_000 });
    await modal.waitFor({ state: "hidden", timeout: 5_000 });
  }
}

export async function appLogin(page: Page): Promise<void> {
  await page.getByRole("button")
    .filter({ hasText: new RegExp(process.env.LOGIN_ENTRY_TEXT ?? "") })
    .first()
    .click();
  await page.getByRole("link")
    .filter({ hasText: new RegExp(process.env.LOGIN_ACCOUNT_TEXT ?? "") })
    .click();
  await page.getByRole("link")
    .filter({ hasText: new RegExp(process.env.LOGIN_PROVIDER_TEXT ?? "") })
    .click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(150);
  await fs.mkdir("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/debug_login.png" });
  await page.getByLabel(new RegExp(process.env.LOGIN_EMAIL_LABEL ?? "")).fill(process.env.APP_USER ?? "");
  await page.getByLabel(new RegExp(process.env.LOGIN_PASSWORD_LABEL ?? "")).fill(process.env.APP_PASS ?? "");
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: new RegExp(process.env.LOGIN_SUBMIT_TEXT ?? "") }).click();
  const domain = new URL(process.env.BASE_URL ?? "").hostname;
  await page.waitForURL(new RegExp(domain), { timeout: 30_000 });
  console.error("  ログイン完了");
}
